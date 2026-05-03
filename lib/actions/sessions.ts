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
 * Async generation. The session is split across two server entry points:
 *
 *   createLearningSession()  — validate input, charge quota, insert a
 *                              `pending` row, redirect to /results/[id].
 *                              Cheap; returns in <100ms.
 *
 *   processLearningSession() — pulls the pending row, calls Claude,
 *                              writes the result back. Several seconds.
 *                              Called by the /results page after
 *                              redirect, via /api/sessions/[id]/process.
 *
 * Quota is consumed up front so an attacker can't spam pending rows
 * without paying the rate-limit cost.
 */

const InputSchema = z.object({
  childId: z.string().uuid(),
  mode: z.enum(["parent", "homeschool", "teacher"]),
  inputType: z.enum(["paste", "upload", "description", "plan"]),
  subject: z.enum(["language", "reading", "writing", "math"]),
  text: z.string().min(5).max(8000),
});

type ChildForPrompt = Parameters<typeof buildAnalysisPrompt>[0]["child"];

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

  // Confirm the child belongs to this user (RLS would also block, but a
  // friendly error beats a silent insert failure).
  const { data: child, error: childErr } = await supabase
    .from("children")
    .select("id")
    .eq("id", parsed.childId)
    .single();
  if (childErr || !child) throw new Error("Child not found.");

  // Charge quota BEFORE inserting the pending row. If we did it the
  // other way around an over-quota user could keep creating pending
  // rows that the dashboard then has to filter out.
  try {
    await consumeAIQuota();
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      await logAICall({
        childId: parsed.childId,
        promptVersion: `pending@${parsed.mode}`,
        model: currentModel(),
        status: "quota_exceeded",
        errorClass: "QuotaExceededError",
        latencyMs: 0,
      });
    }
    throw err;
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("learning_sessions")
    .insert({
      child_id: parsed.childId,
      mode: parsed.mode,
      input_type: parsed.inputType,
      subject: parsed.subject,
      raw_input: parsed.text,
      analysis_result: null,
      top_skill_gaps: [],
      worksheet: null,
      answer_key: null,
      difficulty: null,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    throw new Error(`Could not create session: ${insertErr?.message ?? "unknown error"}`);
  }

  redirect(`/results/${inserted.id}`);
}

/**
 * Pull the pending row and run the AI. Idempotent on already-completed
 * sessions: if status is anything other than 'pending', this is a
 * no-op. Concurrent callers race to flip pending → processing via a
 * conditional UPDATE; only the winner runs the AI.
 *
 * Returns the final status so the caller (the API route) can shape its
 * HTTP response.
 */
export async function processLearningSession(
  sessionId: string,
): Promise<"done" | "error" | "already_done" | "in_flight"> {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  // Atomic status flip. RLS scopes this to sessions whose child belongs
  // to the caller. If 0 rows come back, either the session doesn't
  // belong to us, it's already finished, or another worker took it.
  const { data: claimed } = await supabase
    .from("learning_sessions")
    .update({ status: "processing" })
    .eq("id", sessionId)
    .eq("status", "pending")
    .select("id, child_id, mode, input_type, subject, raw_input")
    .maybeSingle();

  if (!claimed) {
    const { data: current } = await supabase
      .from("learning_sessions")
      .select("status")
      .eq("id", sessionId)
      .maybeSingle();
    if (current?.status === "done") return "already_done";
    return "in_flight";
  }

  const childForPrompt = await loadChildForPrompt(claimed.child_id);
  if (!childForPrompt) {
    await markError(sessionId, "Child profile not found.");
    return "error";
  }

  const recentFeedback = await loadRecentFeedback(claimed.child_id);

  const prompt = pickPrompt({
    mode: claimed.mode as Mode,
    inputType: claimed.input_type as SessionInputType,
    subject: claimed.subject as Subject,
    text: claimed.raw_input ?? "",
    child: childForPrompt,
    recentFeedback,
  });

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
      childId: claimed.child_id,
      promptVersion: prompt.version,
      model: currentModel(),
      status: "error",
      errorClass: classifyError(err),
      latencyMs: Date.now() - startedAt,
    });
    await markError(
      sessionId,
      err instanceof Error ? err.message : "Generation failed.",
    );
    return "error";
  }

  await logAICall({
    childId: claimed.child_id,
    promptVersion: prompt.version,
    model: aiResponse.model,
    status: "ok",
    latencyMs: Date.now() - startedAt,
    usage: aiResponse.usage,
  });

  const result = aiResponse.result;
  const skillIds = mapToSkillIds(result, claimed.mode as Mode);
  const { worksheet, answerKey, difficulty } = extractStorableWorksheet(
    result,
    claimed.mode as Mode,
  );

  const { error: updateErr } = await supabase
    .from("learning_sessions")
    .update({
      analysis_result: result,
      top_skill_gaps:
        skillIds.length > 0 ? skillIds : fallbackSkills(result, claimed.mode as Mode),
      worksheet,
      answer_key: answerKey,
      difficulty,
      status: "done",
    })
    .eq("id", sessionId);

  if (updateErr) {
    await markError(sessionId, `Could not save session: ${updateErr.message}`);
    return "error";
  }

  revalidatePath("/dashboard");
  revalidatePath(`/progress/${claimed.child_id}`);
  revalidatePath(`/results/${sessionId}`);

  return "done";
}

async function loadChildForPrompt(childId: string): Promise<ChildForPrompt | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("children")
    .select("grade, age, curriculum, learning_needs, strengths, weaknesses, parent_goal")
    .eq("id", childId)
    .single();
  if (error || !data) return null;
  return {
    grade: data.grade as Grade,
    age: data.age ?? null,
    curriculum: data.curriculum as "ontario" | "common-core" | "other",
    learningNeeds: (data.learning_needs ?? []) as LearningNeed[],
    strengths: data.strengths ?? null,
    weaknesses: data.weaknesses ?? null,
    parentGoal: data.parent_goal ?? null,
  };
}

async function loadRecentFeedback(childId: string): Promise<RecentFeedbackEntry[]> {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("progress_records")
    .select("created_at, skill, difficulty, parent_feedback, completed_independently")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(5);
  return (data ?? []).map((r) => ({
    createdAt: r.created_at as string,
    skill: r.skill as string,
    difficulty: (r.difficulty ?? null) as Difficulty | null,
    parentFeedback: (r.parent_feedback ?? null) as ParentFeedback | null,
    completedIndependently: (r.completed_independently ?? null) as boolean | null,
  }));
}

async function markError(sessionId: string, message: string): Promise<void> {
  const supabase = getServerSupabase();
  // Truncate so a leaky upstream message doesn't blow the column up.
  const trimmed = message.slice(0, 500);
  await supabase
    .from("learning_sessions")
    .update({ status: "error", error_message: trimmed })
    .eq("id", sessionId);
}

function pickPrompt(args: {
  mode: Mode;
  inputType: SessionInputType;
  subject: Subject;
  text: string;
  child: ChildForPrompt;
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
