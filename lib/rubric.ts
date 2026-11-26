/**
 * Marking an open response on criteria, not as one right or wrong.
 *
 * Adapted from `markRubric` in the handoff's reference module
 * (docs/assessment/). What changed from the original:
 *
 *  · It reports WHICH criteria are still unmarked, instead of only that
 *    something is. The adult needs to know what is left to look at.
 *  · It carries a suggestion alongside, so the app can propose a mark and
 *    a person can disagree with it on the record.
 *  · The original threw a TypeError when handed null scores; this treats
 *    "nothing confirmed yet" as the ordinary opening state, because it is.
 *
 * Pure. No database, no model.
 */

export interface RubricCriterion {
  id: string;
  /** What the adult is deciding, in their words. */
  label: string;
  maxPoints: number;
}

export type RubricScores = Record<string, number | null>;

export type RubricStatus = "scored" | "pending_review";

export interface RubricResult {
  status: RubricStatus;
  /** Null until every criterion has a number. */
  score: number | null;
  maxPoints: number;
  /** Criterion ids still waiting on a person. */
  awaiting: string[];
}

export class RubricShapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RubricShapeError";
  }
}

function validate(criteria: RubricCriterion[]): void {
  if (!Array.isArray(criteria) || criteria.length === 0) {
    throw new RubricShapeError("A rubric needs at least one criterion.");
  }
  const ids = new Set<string>();
  for (const c of criteria) {
    if (!c.id) throw new RubricShapeError("Every criterion needs an id.");
    if (ids.has(c.id)) throw new RubricShapeError(`Duplicate criterion id: ${c.id}`);
    ids.add(c.id);
    if (!Number.isInteger(c.maxPoints) || c.maxPoints < 1) {
      throw new RubricShapeError(`${c.id} must be worth at least one whole point.`);
    }
  }
}

/** Total available, whatever has been marked so far. */
export function rubricMaxPoints(criteria: RubricCriterion[]): number {
  validate(criteria);
  return criteria.reduce((n, c) => n + c.maxPoints, 0);
}

/**
 * Mark what has been confirmed.
 *
 * A criterion left unmarked keeps the whole item at pending_review — a
 * missing judgement is not a zero, and recording it as one would quietly
 * count a thing nobody looked at. Zero is a mark; it has to be chosen.
 */
export function markRubric(
  criteria: RubricCriterion[],
  confirmed: RubricScores | null | undefined,
): RubricResult {
  validate(criteria);
  const scores = confirmed ?? {};
  const maxPoints = criteria.reduce((n, c) => n + c.maxPoints, 0);
  const awaiting: string[] = [];
  let total = 0;

  for (const c of criteria) {
    const v = Object.prototype.hasOwnProperty.call(scores, c.id) ? scores[c.id] : null;
    if (v === null || v === undefined) {
      awaiting.push(c.id);
      continue;
    }
    if (!Number.isInteger(v) || v < 0 || v > c.maxPoints) {
      throw new RubricShapeError(
        `${c.id}: ${v} is not a whole number between 0 and ${c.maxPoints}.`,
      );
    }
    total += v;
  }

  if (awaiting.length > 0) {
    return { status: "pending_review", score: null, maxPoints, awaiting };
  }
  return { status: "scored", score: total, maxPoints, awaiting: [] };
}

/**
 * Did the adult change the app's mind?
 *
 * Returned so a divergence can be noticed rather than discovered. If the
 * suggestion is routinely overruled, the suggestion is the thing to fix.
 */
export function suggestionDiverged(
  suggested: number | null | undefined,
  confirmedScore: number | null,
): boolean {
  if (suggested === null || suggested === undefined) return false;
  if (confirmedScore === null) return false;
  return suggested !== confirmedScore;
}
