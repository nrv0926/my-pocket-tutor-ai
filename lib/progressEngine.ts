import type { Difficulty } from "@/types/session";
import type {
  ParentFeedback,
  ProgressRecord,
  ProgressSummary,
  SkillStatus,
} from "@/types/progress";

/**
 * Pure functions used by the progress dashboard and the difficulty router.
 * No Supabase calls in here — DB IO is the caller's job.
 */

const ORDER: Difficulty[] = ["easy", "medium", "hard"];

/**
 * Decide the difficulty of the NEXT session for a given skill, based on the
 * parent's feedback on the most recent one.
 *
 *  too_easy   -> step UP one level
 *  just_right -> stay on the current level
 *  too_hard   -> step DOWN one level
 *
 *  If the same skill has been "struggling" multiple times in a row, the
 *  caller should swap in a smaller micro-skill instead — see CLAUDE.md.
 */
export function nextDifficulty(
  current: Difficulty,
  feedback: ParentFeedback | null
): Difficulty {
  const idx = ORDER.indexOf(current);
  if (feedback === "too_easy") return ORDER[Math.min(idx + 1, ORDER.length - 1)];
  if (feedback === "too_hard") return ORDER[Math.max(idx - 1, 0)];
  return current;
}

/**
 * Detects a "repeated struggle" pattern across the last `windowSize` records
 * for a single skill. Used to recommend a micro-skill swap.
 */
export function isRepeatedStruggle(
  records: ProgressRecord[],
  skill: string,
  windowSize = 3
): boolean {
  const recent = records
    .filter((r) => r.skill === skill)
    .slice(-windowSize);
  if (recent.length < windowSize) return false;
  return recent.every((r) => r.status === "struggling" || r.parentFeedback === "too_hard");
}

/**
 * Produce a small object the dashboard can render directly.
 */
export function summarize(records: ProgressRecord[]): ProgressSummary {
  let practiced = 0;
  let mastered = 0;
  let struggling = 0;
  const seen = new Map<string, { status: SkillStatus; lastSeen: string }>();

  for (const r of records) {
    if (r.status === "practiced") practiced++;
    else if (r.status === "mastered") mastered++;
    else struggling++;

    const prev = seen.get(r.skill);
    if (!prev || r.createdAt > prev.lastSeen) {
      seen.set(r.skill, { status: r.status, lastSeen: r.createdAt });
    }
  }

  const recentSkills = [...seen.entries()]
    .map(([skill, v]) => ({ skill, ...v }))
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
    .slice(0, 8);

  return {
    practicedCount: practiced,
    masteredCount: mastered,
    strugglingCount: struggling,
    recentSkills,
  };
}
