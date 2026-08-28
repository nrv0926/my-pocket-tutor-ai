import { describe, expect, it } from "vitest";
import { objectivesFor, expectationOptions } from "@/lib/curriculum";

/**
 * Browsing groups the curriculum the way Ontario publishes it: strand, then
 * objective (the overall expectation), then the specifics beneath it. The
 * grouping is Ontario's own numbering — B1.3 sits under B1 — never a mapping
 * we invent.
 */
describe("objectivesFor", () => {
  it("keeps every specific, losing none to grouping", () => {
    for (const [subject, grade] of [
      ["language", "3"],
      ["mathematics", "3"],
      ["mathematics", "8"],
    ] as const) {
      const grouped = objectivesFor(subject, grade).reduce(
        (n, o) => n + o.specifics.length,
        0
      );
      expect(grouped, `${subject} G${grade}`).toBe(
        expectationOptions(subject, grade).length
      );
    }
  });

  it("files each specific under the overall its code extends", () => {
    for (const o of objectivesFor("language", "3")) {
      for (const s of o.specifics) {
        expect(s.code.split(".")[0], `${s.code} filed under ${o.code}`).toBe(o.code);
      }
    }
  });

  it("never shows more than a dozen objectives at once — the point of browsing", () => {
    for (const grade of ["1", "3", "6", "8"] as const) {
      for (const subject of ["language", "mathematics"] as const) {
        const n = objectivesFor(subject, grade).length;
        expect(n, `${subject} G${grade} has ${n}`).toBeLessThanOrEqual(14);
        expect(n).toBeGreaterThan(0);
      }
    }
  });

  it("carries the strand each objective belongs to", () => {
    for (const o of objectivesFor("language", "3")) {
      expect(o.strandCode).toMatch(/^[A-D]$/);
      expect(o.strandName.length).toBeGreaterThan(3);
      expect(o.code.startsWith(o.strandCode)).toBe(true);
    }
  });

  it("returns nothing where the curriculum has nothing, rather than a stub", () => {
    expect(objectivesFor("science-technology", "3")).toEqual([]);
    expect(objectivesFor("language", "K")).toEqual([]);
    expect(objectivesFor("french", "2", "core")).toEqual([]);
    expect(objectivesFor("french", "2", "immersion").length).toBeGreaterThan(0);
  });

  it("drops no objective that has specifics behind it", () => {
    for (const o of objectivesFor("mathematics", "5")) {
      expect(o.specifics.length, `${o.code} is empty`).toBeGreaterThan(0);
    }
  });
});
