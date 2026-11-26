import { describe, expect, it } from "vitest";
import {
  CalendarPatternError,
  calendarPattern,
  calendarPatternItem,
  utcDay,
} from "@/lib/calendarPattern";

/**
 * Scenario SU-03, and acceptance row 1 of the handoff — one of the rows
 * nothing in the codebase had claimed until now.
 */
describe("calendar patterns", () => {
  it("the handoff's fixture, exactly", () => {
    // "ISO calendar fixture starts 2026-11-02, interval 6, three shown,
    //  target term 4 | Answer 2026-11-20, proof dates 02, 08, 14, 20."
    const p = calendarPattern({
      firstDate: "2026-11-02",
      stepDays: 6,
      shownCount: 3,
      targetTerm: 4,
    });
    expect(p.shown).toEqual(["2026-11-02", "2026-11-08", "2026-11-14"]);
    expect(p.answer).toBe("2026-11-20");
    expect(p.proof).toEqual(["2026-11-02", "2026-11-08", "2026-11-14", "2026-11-20"]);
  });

  it("crosses a leap-year February correctly", () => {
    // 2028 is a leap year, so the 29th exists and the hop lands on March 3.
    const p = calendarPattern({
      firstDate: "2028-02-26",
      stepDays: 6,
      shownCount: 2,
      targetTerm: 3,
    });
    expect(p.proof).toEqual(["2028-02-26", "2028-03-03", "2028-03-09"]);

    // 2027 is not. Same start date, one day earlier in the month, and the
    // hop lands a day further into March.
    const common = calendarPattern({
      firstDate: "2027-02-26",
      stepDays: 6,
      shownCount: 2,
      targetTerm: 3,
    });
    expect(common.proof).toEqual(["2027-02-26", "2027-03-04", "2027-03-10"]);
  });

  it("crosses December into January correctly", () => {
    const p = calendarPattern({
      firstDate: "2026-12-22",
      stepDays: 6,
      shownCount: 2,
      targetTerm: 4,
    });
    expect(p.proof).toEqual(["2026-12-22", "2026-12-28", "2027-01-03", "2027-01-09"]);
    expect(p.answer).toBe("2027-01-09");
  });

  it("rejects a date that is not on the calendar", () => {
    // new Date() rolls 2026-02-30 forward to March 2 without complaint. A
    // question built on a date that does not exist has no answer.
    expect(() => utcDay("2026-02-30")).toThrow(CalendarPatternError);
    expect(() => utcDay("2026-13-01")).toThrow(CalendarPatternError);
    expect(() => utcDay("2027-02-29")).toThrow(CalendarPatternError); // not a leap year
    expect(() => utcDay("2026-11-2")).toThrow(CalendarPatternError);
    expect(() => utcDay("not a date")).toThrow(CalendarPatternError);
    // And the leap day that does exist is fine.
    expect(() => utcDay("2028-02-29")).not.toThrow();
  });

  it("rejects a pattern whose answer is already printed on the page", () => {
    expect(() =>
      calendarPattern({ firstDate: "2026-11-02", stepDays: 6, shownCount: 3, targetTerm: 3 }),
    ).toThrow(/after the dates shown/);
  });

  it("rejects nonsense steps and counts", () => {
    const base = { firstDate: "2026-11-02", shownCount: 3, targetTerm: 4 };
    expect(() => calendarPattern({ ...base, stepDays: 0 })).toThrow(CalendarPatternError);
    expect(() => calendarPattern({ ...base, stepDays: 1.5 })).toThrow(CalendarPatternError);
    expect(() => calendarPattern({ ...base, stepDays: 400 })).toThrow(CalendarPatternError);
    expect(() =>
      calendarPattern({ firstDate: "2026-11-02", stepDays: 6, shownCount: 1, targetTerm: 4 }),
    ).toThrow(CalendarPatternError);
    expect(() =>
      calendarPattern({ firstDate: "2026-11-02", stepDays: 6, shownCount: 3, targetTerm: 31 }),
    ).toThrow(CalendarPatternError);
  });

  it("the question and its key come from one calculation", () => {
    // SU-03: the printed key and the on-screen key must match, which they
    // cannot fail to do if there is only ever one of them.
    const item = calendarPatternItem({
      firstDate: "2026-11-02",
      stepDays: 6,
      shownCount: 3,
      targetTerm: 4,
    });
    expect(item.prompt).toContain("2026-11-02, 2026-11-08, 2026-11-14");
    expect(item.prompt).toContain("the very next");
    expect(item.answer).toBe("2026-11-20");
    expect(item.workingOut).toEqual([
      "2026-11-02",
      "2026-11-08",
      "2026-11-14",
      "2026-11-20",
    ]);
    // The answer is the last step of the working, not a second calculation.
    expect(item.workingOut[item.workingOut.length - 1]).toBe(item.answer);
  });

  it("does not drift across a daylight-saving boundary", () => {
    // Canada springs forward on 2027-03-14. In local time a naive 24h hop
    // across it lands an hour short and can report the previous day.
    const p = calendarPattern({
      firstDate: "2027-03-08",
      stepDays: 6,
      shownCount: 2,
      targetTerm: 4,
    });
    expect(p.proof).toEqual(["2027-03-08", "2027-03-14", "2027-03-20", "2027-03-26"]);
  });

  it("the working is not reorderable by a caller", () => {
    const p = calendarPattern({
      firstDate: "2026-11-02",
      stepDays: 6,
      shownCount: 3,
      targetTerm: 4,
    });
    expect(() => (p.proof as string[]).reverse()).toThrow();
  });
});
