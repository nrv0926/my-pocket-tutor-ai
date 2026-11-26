import { ASSESSMENT_DEFAULTS, type AssessmentConfig } from "@/lib/config/assessment";
import { prerequisiteFor } from "@/lib/skills";
import { INDEPENDENT_MODES, type ModeOfSupport } from "@/types/progress";

/**
 * What to practise next, from counted evidence.
 *
 * Adapted from the reference module in
 * docs/assessment/Pocket_Tutor_Assessment_Handoff.md (the `recommend`
 * export). What changed from the original, and why:
 *
 *  · Shape. The original took pre-filtered sessions already narrowed to
 *    one skill and one difficulty band, and returned a bare decision.
 *    This takes raw observation rows for a child, does its own filtering
 *    and grouping, and returns the skill it chose plus the exact rows it
 *    used, so the page can show its work.
 *
 *  · Window instead of "the last two". The original sliced the two most
 *    recent qualifying sessions. This counts every qualifying session
 *    inside `windowDays`, per the blueprint. Where a child has exactly
 *    two, the two agree.
 *
 *  · Four modes of support, not a boolean. 'accommodated' counts as the
 *    learner's own work; 'prompted' and 'modelled' are excluded. The
 *    original had no equivalent.
 *
 *  · Partial credit. The original counted whole-item correctness
 *    (score === maxPoints). This sums score over maxPoints, per the
 *    blueprint. With every item out of 1 — which is all the capture
 *    screen writes today — the two are identical.
 *
 *  · Thresholds moved to lib/config/assessment.ts.
 *
 * Pure: no database, no clock of its own unless you let it default, no
 * model calls. Everything it decides from is in its arguments.
 */

export type Decision =
  | "collect_more_evidence"
  | "check_prerequisite"
  | "practise_same_skill"
  | "try_transfer";

export interface ObservationRow {
  itemId: string;
  sessionId: string;
  /** Null means the adult never finished the session. Never evidence. */
  sessionClosedAt: string | null;
  skillId: string | null;
  topicId: string | null;
  modeOfSupport: ModeOfSupport;
  status: "scored" | "skipped" | "pending_review";
  score: number | null;
  maxPoints: number | null;
  attempt: number;
  excludeFromAdaptation: boolean;
  createdAt: string;
}

export interface Evidence {
  /** The exact rows counted, so the page can list them. */
  items: ObservationRow[];
  sessionIds: string[];
  score: number;
  maxPoints: number;
  /** 0 to 1. Null when nothing was counted. */
  percent: number | null;
}

export interface Recommendation {
  decision: Decision;
  /** The skill or topic chosen. Null when there is nothing to name yet. */
  skillKey: string | null;
  evidence: Evidence;
  /**
   * Only on check_prerequisite: the skill to check underneath this one.
   * Still null where the graph has no edge — a root skill has nothing
   * beneath it, and saying so is better than inventing a step.
   */
  prerequisite?: string | null;
  /** That prerequisite's plain-English name, for the page. */
  prerequisiteLabel?: string | null;
  /** Why, in words, when the decision needs one. */
  reason?: string;
}

export interface RecommendOptions extends Partial<AssessmentConfig> {
  /** Defaults to now. Passed in by tests so they do not depend on a clock. */
  now?: Date;
  /**
   * How to find what sits underneath a skill. Defaults to the real graph
   * in lib/skills.ts; injected by tests so they do not depend on the data
   * file, and overridable if a caller ever needs a different ordering.
   */
  prerequisiteLookup?: (skillKey: string) => { id: string; label: string } | null;
}

const emptyEvidence = (items: ObservationRow[] = []): Evidence => ({
  items,
  sessionIds: [...new Set(items.map((i) => i.sessionId))],
  score: items.reduce((n, i) => n + (i.score ?? 0), 0),
  maxPoints: items.reduce((n, i) => n + (i.maxPoints ?? 0), 0),
  percent: null,
});

/** skill_id if we have one, else topic_id. Null means unattributable. */
export function groupKey(row: ObservationRow): string | null {
  return row.skillId ?? row.topicId ?? null;
}

/**
 * Does this row count? Everything here is a reason evidence can be real
 * but still not usable for choosing the next step.
 */
export function qualifies(row: ObservationRow, cutoff: Date): boolean {
  if (row.attempt !== 1) return false;                       // retries are history
  if (row.status !== "scored") return false;                 // skipped says nothing
  if (row.excludeFromAdaptation) return false;               // adult said it is off-target
  if (!INDEPENDENT_MODES.includes(row.modeOfSupport)) return false;
  if (!row.sessionClosedAt) return false;                    // never finished
  if (row.score === null || row.maxPoints === null) return false;
  if (row.maxPoints <= 0) return false;
  return new Date(row.sessionClosedAt) >= cutoff;
}

export function recommend(
  observations: ObservationRow[],
  options: RecommendOptions = {},
): Recommendation {
  const cfg: AssessmentConfig = { ...ASSESSMENT_DEFAULTS, ...options };
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - cfg.windowDays * 86_400_000);

  const counted = observations.filter((r) => qualifies(r, cutoff));

  // Group by skill, falling back to topic. A row with neither cannot
  // name a next step, so it is shown but never chosen from.
  const groups = new Map<string, ObservationRow[]>();
  for (const row of counted) {
    const key = groupKey(row);
    if (key === null) continue;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  // A group is eligible only if enough separate closed sessions each
  // carried enough items. One good day is not evidence.
  const eligible: { key: string; items: ObservationRow[]; percent: number }[] = [];
  for (const [key, items] of groups) {
    const perSession = new Map<string, ObservationRow[]>();
    for (const row of items) {
      perSession.set(row.sessionId, [...(perSession.get(row.sessionId) ?? []), row]);
    }
    const deep = [...perSession.values()].filter((rows) => rows.length >= cfg.minItemsPerSession);
    if (deep.length < cfg.minSessions) continue;

    const used = deep.flat();
    const score = used.reduce((n, i) => n + (i.score ?? 0), 0);
    const maxPoints = used.reduce((n, i) => n + (i.maxPoints ?? 0), 0);
    if (maxPoints <= 0) continue;
    eligible.push({ key, items: used, percent: score / maxPoints });
  }

  if (eligible.length === 0) {
    return {
      decision: "collect_more_evidence",
      skillKey: null,
      evidence: emptyEvidence(counted),
      reason:
        counted.length === 0
          ? "Nothing has been recorded yet that they did on their own in a finished session."
          : `Not enough yet. Two finished sessions with at least ${cfg.minItemsPerSession} questions each are needed before this can suggest a next step.`,
    };
  }

  // Weakest first: where a child is struggling is where to start. Ties
  // broken by most recent, then by name, so the answer is deterministic.
  eligible.sort(
    (a, b) =>
      a.percent - b.percent ||
      Math.max(...b.items.map((i) => Date.parse(i.createdAt))) -
        Math.max(...a.items.map((i) => Date.parse(i.createdAt))) ||
      a.key.localeCompare(b.key),
  );

  const pick = eligible[0];
  const score = pick.items.reduce((n, i) => n + (i.score ?? 0), 0);
  const maxPoints = pick.items.reduce((n, i) => n + (i.maxPoints ?? 0), 0);
  const evidence: Evidence = {
    items: pick.items,
    sessionIds: [...new Set(pick.items.map((i) => i.sessionId))],
    score,
    maxPoints,
    percent: pick.percent,
  };

  if (pick.percent < cfg.prerequisiteBelow) {
    const lookup =
      options.prerequisiteLookup ??
      ((key: string) => {
        const node = prerequisiteFor(key);
        return node ? { id: node.id, label: node.label } : null;
      });
    const under = lookup(pick.key);
    return {
      decision: "check_prerequisite",
      skillKey: pick.key,
      evidence,
      prerequisite: under?.id ?? null,
      prerequisiteLabel: under?.label ?? null,
      reason: under
        ? `Check ${under.label} first — a gap underneath is usually the real cause.`
        : "no prerequisite mapped",
    };
  }

  if (pick.percent >= cfg.transferAtOrAbove) {
    // See AssessmentConfig.requireSuccessInEverySession: the reference
    // module gates transfer on this and the blueprint's thresholds do not.
    if (cfg.requireSuccessInEverySession) {
      const bySession = new Map<string, ObservationRow[]>();
      for (const row of pick.items) {
        bySession.set(row.sessionId, [...(bySession.get(row.sessionId) ?? []), row]);
      }
      const everySessionLanded = [...bySession.values()].every((rows) =>
        rows.some((r) => (r.score ?? 0) === r.maxPoints),
      );
      if (!everySessionLanded) {
        return {
          decision: "practise_same_skill",
          skillKey: pick.key,
          evidence,
          reason: "Strong overall, but one whole session had nothing right on their own.",
        };
      }
    }
    return { decision: "try_transfer", skillKey: pick.key, evidence };
  }

  return { decision: "practise_same_skill", skillKey: pick.key, evidence };
}
