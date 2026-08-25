"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { ParentFeedback, SkillStatus } from "@/types/progress";
import type { Difficulty } from "@/types/session";

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
