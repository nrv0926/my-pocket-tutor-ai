import type { AnalysisResult } from "@/types/session";
import type { ParentFeedback } from "@/types/progress";

/**
 * What happened last time, per learner — so the app can open with the thread
 * rather than with an empty form.
 *
 * The prompt has continued the previous session since the beginning
 * (`continuityContext` in lib/prompts.ts feeds it what was taught and what
 * was promised next). The adult could not see any of that: the dashboard
 * listed sessions as truncated strings, so the one thing the product knows
 * best about a child was the one thing it never said out loud.
 *
 * Shaped from rows the dashboard already loads, so this costs no extra query
 * and no AI call. Nothing here is generated — every field is either read from
 * the stored plan or left null. A "recommended next" we made up would be the
 * same sin as an invented expectation (CLAUDE.md §6): there is a real child
 * on the other end of it.
 */

export interface SessionRow {
  id: string;
  child_id: string;
  subject: string;
  created_at: string;
  analysis_result: unknown;
}

export interface ProgressRow {
  sessionId: string | null;
  childId: string;
  parentFeedback: ParentFeedback | null;
  notes: string | null;
}

export interface Continuity {
  childId: string;
  /** How many sessions this learner has had, in the rows we were given. */
  sessionCount: number;
  last: {
    id: string;
    subject: string;
    createdAt: string;
    /** The top priorities that plan set, at most three. */
    taught: string[];
    /** What that plan promised to do next. Null when the plan had none. */
    nextStepPlan: string | null;
  } | null;
  /** How the adult said it went, if they said. */
  feedback: ParentFeedback | null;
  /** Anything they typed alongside the rating. */
  note: string | null;
}

/**
 * The most recent session for one child, plus how it went.
 *
 * `sessions` is expected newest-first, which is how every caller queries it;
 * we do not re-sort, so a caller that changes the order changes the answer.
 */
export function continuityFor(
  childId: string,
  sessions: SessionRow[],
  progress: ProgressRow[]
): Continuity {
  const mine = sessions.filter((s) => s.child_id === childId);
  const row = mine[0] ?? null;

  if (!row) {
    return { childId, sessionCount: 0, last: null, feedback: null, note: null };
  }

  const analysis = row.analysis_result as Partial<AnalysisResult> | null;
  const plan = analysis?.nextStepPlan?.trim();

  // Feedback is recorded against the session it was given for, so an older
  // rating never gets attached to a newer plan.
  const rating = progress.find((p) => p.sessionId === row.id) ?? null;

  return {
    childId,
    sessionCount: mine.length,
    last: {
      id: row.id,
      subject: row.subject,
      createdAt: row.created_at,
      taught: (analysis?.whatToTeachNext ?? []).slice(0, 3),
      nextStepPlan: plan ? plan : null,
    },
    feedback: rating?.parentFeedback ?? null,
    note: rating?.notes?.trim() || null,
  };
}

/**
 * How the last session landed, in the adult's words rather than the
 * database's. Returns null when nobody said — an unanswered question is not
 * the same as "it went fine", and guessing would put words in their mouth.
 */
export function feedbackLabel(f: ParentFeedback | null): string | null {
  switch (f) {
    case "too_easy":
      return "Too easy";
    case "just_right":
      return "Just right";
    case "too_hard":
      return "Too hard";
    default:
      return null;
  }
}

/**
 * What to do about that rating, said plainly. This is a rule, not a
 * prediction: the model still decides the actual lesson.
 */
export function feedbackSteer(f: ParentFeedback | null): string | null {
  switch (f) {
    case "too_easy":
      return "We'll step it up.";
    case "just_right":
      return "We'll keep the level and move on.";
    case "too_hard":
      return "We'll go back a step before moving on.";
    default:
      return null;
  }
}
