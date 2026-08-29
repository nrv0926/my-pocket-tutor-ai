"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { generate, currentModel } from "@/lib/aiService";
import { classifyError, logAICall } from "@/lib/observability";
import { buildReportCardPrompt } from "@/lib/prompts";
import { QuotaExceededError, consumeAIQuota } from "@/lib/quota";
import { getRole } from "@/lib/role";
import { mapToSkillIds } from "@/lib/skillGapEngine";
import { getServerSupabase } from "@/lib/supabaseServer";
import { MAX_UPLOAD_BYTES, kindOf, rejectReason, storagePath } from "@/lib/uploadRules";
import type { Grade, LearningNeed } from "@/types/child";
import type { AnalysisResult } from "@/types/session";

const BUCKET = "uploads";

/**
 * Turn an uploaded report card into a plan.
 *
 * The button used to sleep for 800ms and say the pipeline landed in Phase
 * 1.5. This is the pipeline: validate, store privately, hand the document to
 * the model, save the session, then delete the file.
 *
 * There is no OCR step and there should not be one. Claude reads PDFs and
 * photos itself, which matters because a real report card arrives as a phone
 * photo taken at an angle — and because the table structure is most of the
 * meaning. Which column a comment sits in tells you the strand; OCR flattens
 * that away.
 *
 * The file is deleted after analysis, because the privacy page says so. A
 * promise about data that lives only in copy is not a promise.
 */
export async function analyzeUpload(formData: FormData): Promise<void> {
  const childId = formData.get("childId");
  const file = formData.get("file");

  if (typeof childId !== "string" || !childId) throw new Error("Choose a child first.");
  if (!(file instanceof File)) throw new Error("Choose a file to analyze.");

  // The browser checks these too. A limit enforced only there is not a limit.
  const reason = rejectReason({ type: file.type, size: file.size, name: file.name });
  if (reason) throw new Error(reason);

  const kind = kindOf(file.type);
  if (!kind) throw new Error("We can't read that file type.");

  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  // RLS returns no row unless this child is theirs, so this is the check.
  const { data: child, error: childErr } = await supabase
    .from("children")
    .select("grade, age, curriculum, learning_needs, strengths, weaknesses, parent_goal")
    .eq("id", childId)
    .single();
  if (childErr || !child) throw new Error("Child not found.");

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new Error("That file is over 10 MB.");

  const uploadId = randomUUID();
  const path = storagePath(user.id, uploadId, file.name);

  const { error: storeErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (storeErr) {
    throw new Error(
      `Could not store the file: ${storeErr.message}. If this says the bucket is missing, create a private bucket named "${BUCKET}".`
    );
  }

  const { error: rowErr } = await supabase.from("uploads").insert({
    id: uploadId,
    child_id: childId,
    file_name: file.name.slice(-120),
    file_type: file.type,
    storage_path: path,
    processing_status: "processing",
  });
  if (rowErr) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(`Could not record the upload: ${rowErr.message}`);
  }

  // From here on, any failure has to clean up after itself: a stored file
  // with no session is exactly the orphan the privacy page promises not to
  // keep.
  const fail = async (status: "failed") => {
    await supabase.from("uploads").update({ processing_status: status }).eq("id", uploadId);
    await supabase.storage.from(BUCKET).remove([path]);
  };

  const childForPrompt = {
    grade: child.grade as Grade,
    age: child.age ?? null,
    curriculum: child.curriculum as "ontario" | "common-core" | "other",
    learningNeeds: (child.learning_needs ?? []) as LearningNeed[],
    strengths: child.strengths ?? null,
    weaknesses: child.weaknesses ?? null,
    parentGoal: child.parent_goal ?? null,
  };

  // A .txt file is already text, so it goes in the prompt rather than as an
  // attachment — cheaper, and the model reads it identically.
  const asText = kind === "text" ? bytes.toString("utf8").slice(0, 8000).trim() : "";

  const prompt = buildReportCardPrompt({
    child: childForPrompt,
    reportText: asText,
    attached: kind !== "text",
    role: getRole(),
  });

  try {
    await consumeAIQuota();
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      await logAICall({
        childId,
        promptVersion: prompt.version,
        model: currentModel(),
        status: "quota_exceeded",
        errorClass: "QuotaExceededError",
        latencyMs: 0,
      });
    }
    await fail("failed");
    throw err;
  }

  const startedAt = Date.now();
  let aiResponse;
  try {
    aiResponse = await generate<AnalysisResult>({
      system: prompt.system,
      user: prompt.user,
      promptVersion: prompt.version,
      attachment:
        kind === "text"
          ? undefined
          : { kind, mediaType: file.type, data: bytes.toString("base64") },
    });
  } catch (err) {
    await logAICall({
      childId,
      promptVersion: prompt.version,
      model: currentModel(),
      status: "error",
      errorClass: classifyError(err),
      latencyMs: Date.now() - startedAt,
    });
    await fail("failed");
    throw err;
  }

  await logAICall({
    childId,
    promptVersion: prompt.version,
    model: aiResponse.model,
    status: "ok",
    latencyMs: Date.now() - startedAt,
    usage: aiResponse.usage,
  });

  const result = aiResponse.result;
  const skillIds = mapToSkillIds(result);

  const { data: inserted, error: insertErr } = await supabase
    .from("learning_sessions")
    .insert({
      child_id: childId,
      input_type: "upload",
      subject: "language",
      // The file is about to be deleted, so the row records what was read
      // rather than the contents — CLAUDE.md §3: never log file contents.
      raw_input: null,
      upload_id: uploadId,
      analysis_result: result,
      top_skill_gaps: skillIds.length > 0 ? skillIds : result.whatToTeachNext,
      worksheet: result.practiceWorksheet,
      answer_key: result.answerKey,
      difficulty: result.practiceWorksheet.difficulty,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    await fail("failed");
    throw new Error(`Could not save the analysis: ${insertErr?.message ?? "unknown error"}`);
  }

  // The promise on the privacy page, kept in code.
  await supabase.storage.from(BUCKET).remove([path]);
  await supabase
    .from("uploads")
    .update({ processing_status: "done", deleted_after_processing: true })
    .eq("id", uploadId);

  revalidatePath("/dashboard");
  revalidatePath(`/progress/${childId}`);
  redirect(`/results/${inserted.id}`);
}
