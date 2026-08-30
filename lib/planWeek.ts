import type { PlanWeek, WeeklyPlan } from "@/types/plan";

/**
 * Which week of a plan you are actually in.
 *
 * A four-week plan is a month of intent; what an adult wants on a Tuesday is
 * this week. The week is chosen by progress rather than by the calendar,
 * because a plan is not a schedule: someone who starts on a Thursday, or
 * skips a week over half term, is still on week one until week one is done.
 *
 * The first week with anything left is the current one. A finished plan
 * stays on its last week rather than falling off the end.
 */
export function sessionKey(week: number, day: string): string {
  return `${week}:${day}`;
}

export function isDone(completed: string[], week: number, day: string): boolean {
  return completed.includes(sessionKey(week, day));
}

export interface WeekProgress {
  week: PlanWeek;
  done: number;
  total: number;
  /** True when every session in the week is ticked. */
  complete: boolean;
}

export function weekProgress(week: PlanWeek, completed: string[]): WeekProgress {
  const done = week.sessions.filter((s) => isDone(completed, week.week, s.day)).length;
  return {
    week,
    done,
    total: week.sessions.length,
    complete: done === week.sessions.length && week.sessions.length > 0,
  };
}

export function currentWeek(plan: WeeklyPlan, completed: string[]): PlanWeek | null {
  if (plan.weeks.length === 0) return null;
  const unfinished = plan.weeks.find((w) => !weekProgress(w, completed).complete);
  return unfinished ?? plan.weeks[plan.weeks.length - 1];
}

/** How far through the whole month, for a line the adult can read at a glance. */
export function planProgress(plan: WeeklyPlan, completed: string[]) {
  const total = plan.weeks.reduce((n, w) => n + w.sessions.length, 0);
  const done = plan.weeks.reduce((n, w) => n + weekProgress(w, completed).done, 0);
  return { done, total, complete: total > 0 && done === total };
}
