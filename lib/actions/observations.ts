"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabaseServer";
import { skillById } from "@/lib/skills";
import { aggregateMode } from "@/types/progress";

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
  verdict: z.enum(["correct", "wrong", "skipped"]),
  mode: z.enum(MODES),
  /** "this question doesn't measure the skill" — kept, but not counted. */
  excluded: z.boolean().default(false),
  answer: z.string().max(2000).optional(),
});

const CaptureSchema = z.object({
  sessionId: z.string().uuid(),
  items: z.array(CaptureItemSchema).min(1).max(40),
});

export type CaptureItem = z.infer<typeof CaptureItemSchema>;

/** correct/wrong are both scored out of 1; skipped carries no score at all. */
function toRow(item: CaptureItem) {
  const scored = item.verdict !== "skipped";
  return {
    status: scored ? "scored" : "skipped",
    score: scored ? (item.verdict === "correct" ? 1 : 0) : null,
    max_points: scored ? 1 : null,
  };
}

export async function saveCapture(input: {
  sessionId: string;
  items: CaptureItem[];
}): Promise<{ attempt: number; saved: number }> {
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

  // Retries never overwrite attempt 1: they become attempt 2, 3, …
  const { data: prior } = await supabase
    .from("item_observations")
    .select("item_id, attempt")
    .eq("session_id", parsed.sessionId);

  const highest = new Map<string, number>();
  for (const row of prior ?? []) {
    const id = row.item_id as string;
    const n = row.attempt as number;
    if (!highest.has(id) || n > (highest.get(id) ?? 0)) highest.set(id, n);
  }

  const rows = parsed.items.map((item) => ({
    child_id: session.child_id,
    session_id: session.id,
    item_id: item.itemId,
    skill_id: skillId,
    topic_id: topicId,
    answer: item.answer ?? null,
    mode_of_support: item.mode,
    exclude_from_adaptation: item.excluded,
    attempt: (highest.get(item.itemId) ?? 0) + 1,
    ...toRow(item),
  }));

  const { error: insertErr } = await supabase.from("item_observations").insert(rows);
  if (insertErr) throw new Error(`Could not save results: ${insertErr.message}`);

  // Saving is what closes a session. Only closed sessions are evidence.
  if (!session.closed_at) {
    const { error: closeErr } = await supabase
      .from("learning_sessions")
      .update({ closed_at: new Date().toISOString() })
      .eq("id", session.id);
    if (closeErr) throw new Error(`Could not close the session: ${closeErr.message}`);
  }

  // Keep the per-session summary in step with the per-item truth.
  const aggregate = aggregateMode(parsed.items.map((i) => i.mode));
  await supabase
    .from("progress_records")
    .update({
      mode_of_support: aggregate,
      completed_independently: aggregate === "independent",
    })
    .eq("session_id", session.id);

  revalidatePath(`/results/${session.id}`);
  revalidatePath(`/progress/${session.child_id}`);
  revalidatePath("/dashboard");

  const attempt = Math.max(...rows.map((r) => r.attempt));
  return { attempt, saved: rows.length };
}
