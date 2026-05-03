"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generate, currentModel } from "@/lib/aiService";
import { classifyError, logAICall } from "@/lib/observability";
import {
  buildAnalysisPrompt,
  buildHomeschoolPrompt,
  buildReportCardPrompt,
  buildTeacherPrompt,
  type RecentFeedbackEntry,
} from "@/lib/prompts";
import { QuotaExceededError, consumeAIQuota } from "@/lib/quota";
import { mapToSkillIds } from "@/lib/skillGapEngine";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { Grade, LearningNeed, Subject } from "@/types/child";
import type {
  Difficulty,
  HomeschoolResult,
  Mode,
  ParentResult,
  SessionInputType,
  TeacherResult,
  Worksheet,
} from "@/types/session";
import type { ParentFeedback } from "@/types/progress";

/**
 * Single end-to-end MVP path for all three modes:
 *
 *   pick mode → text in → call generate() → save the session → /results/[id]
 *
 * The mode chooses the prompt + the expected output shape. Page code stays
 * uniform; this action is the routing seam.
 */
const InputSchema = z.object({
  childId: z.string().uuid(),
  mode: z.enum(["parent", "homeschool", "teacher"]),
  inputType: z.enum(["paste", "upload", "description", "plan"]),
  subject: z.enum(["language", "reading", "writing", "math"]),
  text: z.string().min(5).max(8000),
});

export async function createLearningSession(input: {
  childId: string;
  mode: Mode;
  inputType: SessionInputType;
  subject: Subject;
  text: string;
}) {
  const parsed = InputSchema.parse(input);

  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

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

  const prompt = pickPrompt({
    mode: parsed.mode,
    inputType: parsed.inputType,
    subject: parsed.subject,
    text: parsed.text,
    child: childForPrompt,
    recentFeedback,
  });

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

  const startedAt = Date.now();
  let aiResponse;
  try {
    aiResponse = await generate<ParentResult | HomeschoolResult | TeacherResult>({
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
  const skillIds = mapToSkillIds(result, parsed.mode);
  const { worksheet, answerKey, difficulty } = extractStorableWorksheet(result, parsed.mode);

  const { data: inserted, error: insertErr } = await supabase
    .from("learning_sessions")
    .insert({
      child_id: parsed.childId,
      mode: parsed.mode,
      input_type: parsed.inputType,
      subject: parsed.subject,
      raw_input: parsed.text,
      analysis_result: result,
      top_skill_gaps: skillIds.length > 0 ? skillIds : fallbackSkills(result, parsed.mode),
      worksheet,
      answer_key: answerKey,
      difficulty,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    throw new Error(`Could not save session: ${insertErr?.message ?? "unknown error"}`);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/progress/${parsed.childId}`);

  redirect(`/results/${inserted.id}`);
}

function pickPrompt(args: {
  mode: Mode;
  inputType: SessionInputType;
  subject: Subject;
  text: string;
  child: Parameters<typeof buildAnalysisPrompt>[0]["child"];
  recentFeedback: RecentFeedbackEntry[];
}) {
  const { mode, inputType, subject, text, child, recentFeedback } = args;

  if (mode === "homeschool") {
    return buildHomeschoolPrompt({
      child,
      subject,
      inputType,
      inputText: text,
      recentFeedback,
    });
  }

  if (mode === "teacher") {
    return buildTeacherPrompt({
      child,
      subject,
      inputType,
      inputText: text,
      recentFeedback,
    });
  }

  // Parent mode keeps the original two-prompt routing: paste vs description.
  if (inputType === "paste") {
    return buildReportCardPrompt({
      child,
      reportText: text,
      recentFeedback,
    });
  }
  return buildAnalysisPrompt({
    child,
    subject,
    parentInput: text,
    recentFeedback,
  });
}

/**
 * Pull a single representative worksheet for the storage convenience columns.
 * Parent: the one practice worksheet. Homeschool/Teacher: first of the set
 * (the full set lives inside analysis_result for the renderer).
 */
function extractStorableWorksheet(
  result: ParentResult | HomeschoolResult | TeacherResult,
  mode: Mode,
): {
  worksheet: Worksheet | null;
  answerKey: { questionId: string; answer: string }[] | null;
  difficulty: Difficulty | null;
} {
  if (mode === "parent") {
    const r = result as ParentResult;
    return {
      worksheet: r.practiceWorksheet,
      answerKey: r.answerKey,
      difficulty: r.practiceWorksheet.difficulty,
    };
  }

  const r = result as HomeschoolResult | TeacherResult;
  const first = r.worksheetSet?.[0] ?? null;
  const firstKey = first
    ? r.answerKeys.find((k) => k.worksheetTitle === first.title)?.answers ?? null
    : null;
  return {
    worksheet: first,
    answerKey: firstKey,
    difficulty: first?.difficulty ?? null,
  };
}

function fallbackSkills(
  result: ParentResult | HomeschoolResult | TeacherResult,
  mode: Mode,
): string[] {
  if (mode === "parent") return (result as ParentResult).whatToTeachNext;
  return result.keySkillGaps;
}
