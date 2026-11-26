"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabaseServer";
import { skillById } from "@/lib/skills";
import { aggregateMode, verdictToObservation } from "@/types/progress";

/**
 * Record how each question actually went.
 *
 * progress_records already says how a SESSION went — one row per skill,
 * every row carrying the same verdict. That can say "this went badly" and
 * never "she can multiply by ten and cannot break a number apart", which
 * is the sentence a next step has to be chosen from.
 *
 * Adult-only. The learner never sees this screen and never signs in; an
 * adult sits with the work and records what they saw. Saving closes the
 * session, and only closed sessions are evidence.
 */

const MODES = ["independent", "prompted", "modelled", "accommodated"] as const;

const CaptureItemSchema = z.object({
  itemId: z.string().min(1).max(64),
  /**
   * "unsure" is the adult admitting she could not tell — a mumbled answer,
   * a page she cannot read back. It saves as pending_review and carries no
   * score, so it stays out of the decision until she confirms it. A guess
   * is worse evidence than an admission (scenario LC-07).
   */
  verdict: z.enum(["correct", "wrong", "skipped", "unsure"]),
  mode: z.enum(MODES),
  /** "this question doesn't measure the skill" — kept, but not counted. */
  excluded: z.boolean().default(false),
  answer: z.string().max(2000).optional(),
});

const CaptureSchema = z.object({
  sessionId: z.string().uuid(),
  /**
   * Made once by the client for this filled-in form. The same key twice is
   * the same save — a double tap, a resubmit, a restored tab — and writes
   * nothing the second time. A new key is a deliberate recapture and becomes
   * attempt 2. Without it the two are indistinguishable (scenario C-08).
   */
  captureKey: z.string().uuid(),
  items: z.array(CaptureItemSchema).min(1).max(40),
});

export type CaptureItem = z.infer<typeof CaptureItemSchema>;

/** Column names for the shared verdict mapping in types/progress.ts. */
function toRow(item: CaptureItem) {
  const { status, score, maxPoints } = verdictToObservation(item.verdict);
  return { status, score, max_points: maxPoints };
}

export async function saveCapture(input: {
  sessionId: string;
  captureKey: string;
  items: CaptureItem[];
}): Promise<{ attempt: number; saved: number; replayed: boolean }> {
  const parsed = CaptureSchema.parse(input);
  const supabase = getServerSupabase();

  // RLS does the proving; this read fails for anyone else's session.
  const { data: session, error: loadErr } = await supabase
    .from("learning_sessions")
    .select("id, child_id, top_skill_gaps, closed_at, children!inner(kind)")
    .eq("id", parsed.sessionId)
    .single();
  if (loadErr || !session) throw new Error("Session not found.");

  // A class profile has no individual items to observe. The database
  // trigger enforces this too; this is the message a person can read.
  const kind = (session.children as unknown as { kind: string } | { kind: string }[]);
  const kindValue = Array.isArray(kind) ? kind[0]?.kind : kind?.kind;
  if (kindValue === "class") {
    throw new Error(
      "This profile is a class. Record results against an individual student instead.",
    );
  }

  // The session's primary skill, from mapToSkillIds, which matches the
  // analysis against data/skill-map.json. skill_id is set only when the
  // id is actually in the graph, because recommend() uses it to look up
  // a prerequisite and a key that resolves to nothing is worse than
  // none. topic_id keeps the raw value either way, as the fallback
  // grouping key for anything the graph does not yet know about.
  const gaps = (session.top_skill_gaps ?? []) as string[];
  const primary = gaps.length > 0 ? gaps[0] : null;
  const topicId = primary;
  const skillId = primary && skillById(primary) ? primary : null;

  // Attempt numbers, the insert, closing the session and syncing the
  // per-session summary all happen inside save_capture_rows (migration
  // 0009), as one transaction. They used to be four separate writes with
  // nothing tying them together, so a dropped connection could leave some
  // items saved and the session still open — a session that happened and
  // never finished. The function is SECURITY INVOKER, so row-level
  // security still proves ownership exactly as it did before.
  const rows = parsed.items.map((item) => ({
    item_id: item.itemId,
    skill_id: skillId,
    topic_id: topicId,
    answer: item.answer ?? null,
    mode_of_support: item.mode,
    exclude_from_adaptation: item.excluded,
    ...toRow(item),
  }));

  const aggregate = aggregateMode(parsed.items.map((i) => i.mode));

  const { data: result, error: saveErr } = await supabase.rpc("save_capture_rows", {
    p_session_id: session.id,
    p_capture_key: parsed.captureKey,
    p_rows: rows,
    p_mode: aggregate,
  });
  if (saveErr) throw new Error(`Could not save results: ${saveErr.message}`);

  const saved = (result as { saved?: number } | null)?.saved ?? 0;
  const attempt = (result as { attempt?: number } | null)?.attempt ?? 1;
  const replayed = Boolean((result as { replayed?: boolean } | null)?.replayed);

  revalidatePath(`/results/${session.id}`);
  revalidatePath(`/progress/${session.child_id}`);
  revalidatePath("/dashboard");

  return { attempt, saved, replayed };
}

/**
 * Set a whole sitting aside, or put it back.
 *
 * A meltdown halfway through, or a child who was ill: the session says
 * nothing about the skill. Ticking "doesn't measure this skill" on each
 * question in turn is both tedious and the wrong shape — it was not six bad
 * questions, it was one bad day (scenario LC-15).
 *
 * The session stays in history either way. It is still a thing that
 * happened; it just stops being counted.
 */
export async function setSessionExcluded(input: {
  sessionId: string;
  excluded: boolean;
  reason?: string;
}): Promise<{ excluded: boolean }> {
  const parsed = z
    .object({
      sessionId: z.string().uuid(),
      excluded: z.boolean(),
      reason: z.string().trim().max(300).optional(),
    })
    .parse(input);

  const supabase = getServerSupabase();

  // RLS proves ownership; this returns nothing for anyone else's session.
  const { data: session, error: loadErr } = await supabase
    .from("learning_sessions")
    .select("id, child_id")
    .eq("id", parsed.sessionId)
    .single();
  if (loadErr || !session) throw new Error("Session not found.");

  const { error } = await supabase
    .from("learning_sessions")
    .update({
      excluded_from_adaptation: parsed.excluded,
      // A reason without the exclusion is a note nobody acts on, and the
      // database refuses that pairing, so clear it on the way back.
      excluded_reason: parsed.excluded ? (parsed.reason?.trim() || null) : null,
    })
    .eq("id", session.id);
  if (error) throw new Error(`Could not update the session: ${error.message}`);

  revalidatePath(`/results/${session.id}`);
  revalidatePath(`/progress/${session.child_id}`);
  revalidatePath("/dashboard");

  return { excluded: parsed.excluded };
}
