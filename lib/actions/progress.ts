"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import type { ParentFeedback, SkillStatus } from "@/types/progress";
import type { Difficulty } from "@/types/session";

/**
 * Insert a single, ad-hoc progress record. Used by callers that need to log
 * a skill outside the parent-feedback flow (e.g. an admin import later).
 */
const ProgressInputSchema = z.object({
  childId: z.string().uuid(),
  sessionId: z.string().uuid().nullable().optional(),
  skill: z.string().min(1),
  status: z.enum(["practiced", "mastered", "struggling"]),
  difficulty: z.enum(["easy", "medium", "hard"]).nullable().optional(),
  parentFeedback: z.enum(["too_easy", "just_right", "too_hard"]).nullable().optional(),
  completedIndependently: z.boolean().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function createProgressRecord(input: {
  childId: string;
  sessionId?: string | null;
  skill: string;
  status: SkillStatus;
  difficulty?: Difficulty | null;
  parentFeedback?: ParentFeedback | null;
  completedIndependently?: boolean | null;
  notes?: string | null;
}) {
  const parsed = ProgressInputSchema.parse(input);
  const supabase = getServerSupabase();

  const { error } = await supabase.from("progress_records").insert({
    child_id: parsed.childId,
    session_id: parsed.sessionId ?? null,
    skill: parsed.skill,
    status: parsed.status,
    difficulty: parsed.difficulty ?? null,
    parent_feedback: parsed.parentFeedback ?? null,
    completed_independently: parsed.completedIndependently ?? null,
    notes: parsed.notes ?? null,
  });

  if (error) throw new Error(`Could not save progress: ${error.message}`);
  revalidatePath(`/progress/${parsed.childId}`);
}

/**
 * Save the parent's feedback after a worksheet session.
 * Writes one progress_records row per top skill identified by the analysis,
 * tagging each with the same feedback + completedIndependently signal.
 *
 * Difficulty router rules (see lib/progressEngine.ts):
 *   too_easy   -> next session steps UP one level
 *   just_right -> stays
 *   too_hard   -> next session steps DOWN one level
 */
const FeedbackInputSchema = z.object({
  sessionId: z.string().uuid(),
  feedback: z.enum(["too_easy", "just_right", "too_hard"]),
  completedIndependently: z.boolean(),
});

export async function saveParentFeedback(input: {
  sessionId: string;
  feedback: ParentFeedback;
  completedIndependently: boolean;
}) {
  const parsed = FeedbackInputSchema.parse(input);
  const supabase = getServerSupabase();

  // Load the session via RLS so we can fan out one record per skill.
  const { data: session, error: loadErr } = await supabase
    .from("learning_sessions")
    .select("id, child_id, top_skill_gaps, difficulty")
    .eq("id", parsed.sessionId)
    .single();
  if (loadErr || !session) throw new Error("Session not found.");

  const skills: string[] = Array.isArray(session.top_skill_gaps) && session.top_skill_gaps.length
    ? session.top_skill_gaps
    : ["unspecified"];

  const status: SkillStatus =
    parsed.feedback === "too_easy" ? "mastered"
      : parsed.feedback === "too_hard" ? "struggling"
      : "practiced";

  const rows = skills.map((skill) => ({
    child_id: session.child_id,
    session_id: session.id,
    skill,
    status,
    difficulty: session.difficulty ?? null,
    parent_feedback: parsed.feedback,
    completed_independently: parsed.completedIndependently,
    notes: null,
  }));

  const { error: insertErr } = await supabase.from("progress_records").insert(rows);
  if (insertErr) throw new Error(`Could not save feedback: ${insertErr.message}`);

  revalidatePath(`/progress/${session.child_id}`);
  revalidatePath("/dashboard");
}
