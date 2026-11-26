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
