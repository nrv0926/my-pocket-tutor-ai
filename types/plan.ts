/**
 * A four-week learning plan.
 *
 * Distinct from a session: a session is one sitting, this is the shape of a
 * month. The generator has existed since April and had no route to it — the
 * prompt writes five short sessions a week, Friday kept for review plus one
 * small win, sequenced so phonics never skips a stage.
 *
 * Built from a child's most recent skill gaps, which means it needs at least
 * one session to exist first. There is no plan without something to plan
 * from, and inventing the gaps would make the whole month fiction.
 */

export type PlanDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

export interface PlanSession {
  day: PlanDay;
  minutes: 10 | 15;
  skill: string;
  /** One short sentence: what the adult and child actually do. */
  activity: string;
  /** One short sentence the adult can act on while it happens. */
  parentTip: string;
}

export interface PlanWeek {
  week: 1 | 2 | 3 | 4;
  /** The thread running through the week, e.g. "Decoding short-vowel words". */
  focus: string;
  sessions: PlanSession[];
}

export interface WeeklyPlan {
  weeks: PlanWeek[];
}

export interface StoredPlan {
  id: string;
  childId: string;
  /** The gaps it was built from, kept so the plan can explain itself later. */
  sourceGaps: string[];
  plan: WeeklyPlan;
  createdAt: string;
}

export const PLAN_DAYS: PlanDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
