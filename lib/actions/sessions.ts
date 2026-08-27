"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generate, currentModel } from "@/lib/aiService";
import { classifyError, logAICall } from "@/lib/observability";
import {
  buildAnalysisPrompt,
  buildReportCardPrompt,
  type RecentFeedbackEntry,
} from "@/lib/prompts";
import { QuotaExceededError, consumeAIQuota } from "@/lib/quota";
import { getRole } from "@/lib/role";
import { mapToSkillIds } from "@/lib/skillGapEngine";
import { getServerSupabase } from "@/lib/supabaseServer";
import { findExpectation } from "@/lib/curriculum";
import type { GradeId } from "@/types/curriculum";
import type { Grade, LearningNeed, Subject } from "@/types/child";
import { STORED_SUBJECTS, normalizeSubject, type StoredSubject } from "@/types/child";
import type {
  AnalysisResult,
  Difficulty,
  SessionInputType,
} from "@/types/session";
import type { ParentFeedback } from "@/types/progress";

/**
 * Single end-to-end MVP path:
 *
 *   paste text  →  call generate()  →  save the session  →  /results/[id]
 *
 * Inputs validated. RLS scopes child reads to the parent. Uploaded files
 * are not handled here — the input is plain text only at MVP.
 *
 * TODO (post-MVP): replace the manual JSON.parse in aiService.generate()
 * with a Zod-validated structured output (output_config.format /
 * client.messages.parse). Also turn this AnalysisResultSchema into the
 * source of truth for the prompt's expected shape.
 */
const InputSchema = z.object({
  childId: z.string().uuid(),
  inputType: z.enum(["paste", "upload", "description", "plan"]),
  subject: z.enum(STORED_SUBJECTS),
  expectationCode: z.string().max(12).nullable().optional(),
  expectationProgram: z.enum(["core", "extended", "immersion"]).nullable().optional(),
  text: z.string().min(5).max(8000),
});

export async function createLearningSession(input: {
  childId: string;
  inputType: SessionInputType;
  /** Accepts the legacy names too; normalised before anything downstream. */
  subject: StoredSubject;
  /** Optional Ontario expectation code the adult chose to target, e.g. "B2.1". */
  expectationCode?: string | null;
  /** FSL only — which program that code belongs to. */
  expectationProgram?: "core" | "extended" | "immersion" | null;
  text: string;
}) {
  const parsed = InputSchema.parse(input);

  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  // RLS: this select returns no rows if the child isn't this parent's, so
  // we don't need a separate ownership check.
  const { data: child, error: childErr } = await supabase
    .from("children")
    .select("grade, age, curriculum, learning_needs, strengths, weaknesses, parent_goal")
    .eq("id", parsed.childId)
    .single();
  if (childErr || !child) throw new Error("Child not found.");

  const childForPrompt = {
    grade: child.grade as Grade,
    age: child.age ?? null,
    curriculum: child.curriculum as "ontario" | "common-core" | "other",
    learningNeeds: (child.learning_needs ?? []) as LearningNeed[],
    strengths: child.strengths ?? null,
    weaknesses: child.weaknesses ?? null,
    parentGoal: child.parent_goal ?? null,
  };

  // Pull the most recent progress rows so the model can calibrate difficulty
  // against the parent's actual reactions, not just the current input. RLS
  // already restricts this to the signed-in parent's children.
  const { data: recentRows } = await supabase
    .from("progress_records")
    .select("created_at, skill, difficulty, parent_feedback, completed_independently")
    .eq("child_id", parsed.childId)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentFeedback: RecentFeedbackEntry[] = (recentRows ?? []).map((r) => ({
    createdAt: r.created_at as string,
    skill: r.skill as string,
    difficulty: (r.difficulty ?? null) as Difficulty | null,
    parentFeedback: (r.parent_feedback ?? null) as ParentFeedback | null,
    completedIndependently: (r.completed_independently ?? null) as boolean | null,
  }));

  const role = getRole();

  // Rows written before the taxonomy fix stored Reading/Writing as subjects.
  const subject = normalizeSubject(parsed.subject);

  // Resolve the chosen code to its published wording. Looked up rather than
  // passed through, so the prompt can never carry a code the curriculum does
  // not actually contain (CLAUDE.md §6).
  const expectation = parsed.expectationCode
    ? findExpectation(
        subject,
        child.grade as GradeId,
        parsed.expectationCode,
        parsed.expectationProgram ?? undefined
      )
    : null;

  const prompt =
    parsed.inputType === "paste"
      ? buildReportCardPrompt({
          child: childForPrompt,
          reportText: parsed.text,
          role,
          recentFeedback,
        })
      : buildAnalysisPrompt({
          child: childForPrompt,
          subject: subject,
          parentInput: parsed.text,
          role,
          expectation,
          recentFeedback,
        });

  // Per-user daily cap. Throws QuotaExceededError with a friendly message
  // that the form already surfaces via err.message — no UI changes needed.
  try {
    await consumeAIQuota();
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      await logAICall({
        childId: parsed.childId,
        promptVersion: prompt.version,
        model: currentModel(),
        status: "quota_exceeded",
        errorClass: "QuotaExceededError",
        latencyMs: 0,
      });
    }
    throw err;
  }

  // TODO (post-MVP): pass a Zod schema here so generate() returns a
  // type-safe AnalysisResult instead of the manual cast below.
  const startedAt = Date.now();
  let aiResponse;
  try {
    aiResponse = await generate<AnalysisResult>({
      system: prompt.system,
      user: prompt.user,
      promptVersion: prompt.version,
    });
  } catch (err) {
    await logAICall({
      childId: parsed.childId,
      promptVersion: prompt.version,
      model: currentModel(),
      status: "error",
      errorClass: classifyError(err),
      latencyMs: Date.now() - startedAt,
    });
    throw err;
  }

  await logAICall({
    childId: parsed.childId,
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
      child_id: parsed.childId,
      input_type: parsed.inputType,
      subject,
      raw_input: parsed.text,
      analysis_result: result,
      top_skill_gaps: skillIds.length > 0 ? skillIds : result.whatToTeachNext,
      worksheet: result.practiceWorksheet,
      answer_key: result.answerKey,
      difficulty: result.practiceWorksheet.difficulty,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    throw new Error(`Could not save session: ${insertErr?.message ?? "unknown error"}`);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/progress/${parsed.childId}`);

  // redirect() throws an internal NEXT_REDIRECT signal — the calling
  // client component must rethrow it (see NewSessionForm catch block).
  redirect(`/results/${inserted.id}`);
}
