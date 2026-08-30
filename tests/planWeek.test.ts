import { describe, expect, it } from "vitest";
import { currentWeek, isDone, planProgress, sessionKey, weekProgress } from "@/lib/planWeek";
import { PLAN_DAYS } from "@/types/plan";
import type { WeeklyPlan } from "@/types/plan";

const plan: WeeklyPlan = {
  weeks: ([1, 2, 3, 4] as const).map((n) => ({
    week: n,
    focus: `Week ${n}`,
    sessions: PLAN_DAYS.map((day) => ({
      day,
      minutes: 10 as const,
      skill: "s",
      activity: "a",
      parentTip: "t",
    })),
  })),
};

const allOf = (week: number) => PLAN_DAYS.map((d) => sessionKey(week, d));

/**
 * The week is chosen by progress, not by the calendar. A plan is not a
 * schedule: someone who starts on a Thursday, or skips a week over half
 * term, is still on week one until week one is done.
 */
describe("which week you are in", () => {
  it("starts at week one with nothing done", () => {
    expect(currentWeek(plan, [])?.week).toBe(1);
  });

  it("stays on a week while anything in it is left", () => {
    expect(currentWeek(plan, ["1:Mon", "1:Tue", "1:Wed", "1:Thu"])?.week).toBe(1);
  });

  it("moves on only when the week is finished", () => {
    expect(currentWeek(plan, allOf(1))?.week).toBe(2);
  });

  it("does not skip a week that was left behind", () => {
    // Week two done, week one not: there is still work in week one.
    expect(currentWeek(plan, allOf(2))?.week).toBe(1);
  });

  it("rests on the last week rather than falling off the end", () => {
    const all = [1, 2, 3, 4].flatMap(allOf);
    expect(currentWeek(plan, all)?.week).toBe(4);
  });

  it("has nothing to show for an empty plan", () => {
    expect(currentWeek({ weeks: [] }, [])).toBeNull();
  });
});

describe("counting a week", () => {
  it("counts only that week's own sessions", () => {
    const p = weekProgress(plan.weeks[0], ["1:Mon", "2:Mon", "2:Tue"]);
    expect(p.done).toBe(1);
    expect(p.total).toBe(5);
    expect(p.complete).toBe(false);
  });

  it("knows a finished week", () => {
    expect(weekProgress(plan.weeks[0], allOf(1)).complete).toBe(true);
  });

  it("ignores a key for a day that is not in the week", () => {
    expect(weekProgress(plan.weeks[0], ["1:Sat"]).done).toBe(0);
  });
});

describe("the whole month", () => {
  it("counts across every week", () => {
    expect(planProgress(plan, [...allOf(1), "3:Mon"])).toEqual({
      done: 6,
      total: 20,
      complete: false,
    });
  });

  it("is only complete when all twenty are", () => {
    const all = [1, 2, 3, 4].flatMap(allOf);
    expect(planProgress(plan, all).complete).toBe(true);
    expect(planProgress(plan, all.slice(0, 19)).complete).toBe(false);
  });

  it("is not complete when there is nothing to complete", () => {
    expect(planProgress({ weeks: [] }, []).complete).toBe(false);
  });
});

describe("keys", () => {
  it("identifies a session by week and day", () => {
    expect(sessionKey(2, "Wed")).toBe("2:Wed");
    expect(isDone(["2:Wed"], 2, "Wed")).toBe(true);
    expect(isDone(["2:Wed"], 3, "Wed")).toBe(false);
  });
});
