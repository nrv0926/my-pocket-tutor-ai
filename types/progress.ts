import type { Difficulty } from "./session";

export type SkillStatus = "practiced" | "mastered" | "struggling";

export type ParentFeedback = "too_easy" | "just_right" | "too_hard";

/**
 * How much help a learner had.
 *
 * "accommodated" is help that did NOT supply the skill being measured —
 * reading a maths story aloud to a child whose decoding is weak leaves the
 * arithmetic entirely theirs. Reading aloud a word whose decoding IS the
 * thing being tested hands them the answer, and that is "prompted".
 * Adaptation counts accommodated work as independent; it is the only
 * reason this is four values and not a boolean.
 */
export type ModeOfSupport = "independent" | "prompted" | "modelled" | "accommodated";

/** The two values adaptation will count. */
export const INDEPENDENT_MODES: ModeOfSupport[] = ["independent", "accommodated"];

/** Dual-write bridge to the deprecated boolean. */
export function modeToBoolean(mode: ModeOfSupport): boolean {
  return mode === "independent" || mode === "accommodated";
}

/**
 * One verdict for a whole session, from its items.
 *
 * The weakest claim wins: if any question needed showing, the session was
 * modelled. This keeps the per-session summary from flattering the record
 * that progress_records has always carried.
 */
export function aggregateMode(modes: ModeOfSupport[]): ModeOfSupport {
  if (modes.includes("modelled")) return "modelled";
  if (modes.includes("prompted")) return "prompted";
  return "independent";
}

/** Dual-write bridge from the deprecated boolean. The weaker claim wins. */
export function booleanToMode(independent: boolean | null): ModeOfSupport | null {
  if (independent === null) return null;
  return independent ? "independent" : "prompted";
}

export interface ProgressRecord {
  id: string;
  childId: string;
  sessionId: string | null;
  skill: string;
  status: SkillStatus;
  difficulty: Difficulty | null;
  parentFeedback: ParentFeedback | null;
  /** @deprecated superseded by modeOfSupport; still dual-written. */
  completedIndependently: boolean | null;
  modeOfSupport: ModeOfSupport | null;
  notes: string | null;
  createdAt: string;
}

export interface ProgressSummary {
  practicedCount: number;
  masteredCount: number;
  strugglingCount: number;
  recentSkills: { skill: string; status: SkillStatus; lastSeen: string }[];
}

/** What the adult tapped for one question on the capture screen. */
export type CaptureVerdict = "correct" | "wrong" | "skipped" | "unsure";

/**
 * How a verdict becomes evidence. One mapping, shared.
 *
 * It lives here rather than in lib/actions/observations.ts because a
 * "use server" file may only export async functions, and because there are
 * two callers: the real capture action and the /demo/loop page. They had
 * drifted — the demo scored an "unsure" answer as zero, which is the exact
 * mistake scenario LC-07 exists to prevent. A missing judgement is not a
 * zero; zero is a mark, and it has to be chosen.
 *
 * The four statuses are four different facts:
 *   correct / wrong  scored, out of 1
 *   skipped          nobody answered
 *   unsure           somebody answered and the adult could not judge it,
 *                    so it waits at pending_review and is not counted
 */
export function verdictToObservation(verdict: CaptureVerdict): {
  status: "scored" | "skipped" | "pending_review";
  score: number | null;
  maxPoints: number | null;
} {
  switch (verdict) {
    case "skipped":
      return { status: "skipped", score: null, maxPoints: null };
    case "unsure":
      return { status: "pending_review", score: null, maxPoints: null };
    case "correct":
      return { status: "scored", score: 1, maxPoints: 1 };
    case "wrong":
      return { status: "scored", score: 0, maxPoints: 1 };
  }
}
