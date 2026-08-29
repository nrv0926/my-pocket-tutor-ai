import { describe, expect, it } from "vitest";
import {
  objectiveTopic,
  objectivesFor,
  expectationOptions,
  findExpectation,
} from "@/lib/curriculum";
import { emptyKind } from "@/lib/emptyReason";
import { planGradeContext } from "@/lib/prompts";
import type { GradeId } from "@/types/curriculum";

/**
 * The picker narrows grade → topic → item. Everything it shows has to come
 * from the transcription, including the topic names: an invented label is
 * the same sin as an invented code (CLAUDE.md §6), just quieter.
 */
describe("objectiveTopic", () => {
  it("takes the short name Ontario writes before the colon", () => {
    expect(
      objectiveTopic("Oral and Non-Verbal Communication: apply listening skills")
    ).toBe("Oral and Non-Verbal Communication");
  });

  it("returns nothing when Ontario gives no short name", () => {
    expect(
      objectiveTopic("demonstrate an understanding of numbers and make connections")
    ).toBeNull();
  });

  it("refuses a grade band as a topic", () => {
    // Financial Literacy really is written this way; "Grades 1 and 2" names
    // who the expectation applies to, not what it is about.
    expect(objectiveTopic("Grades 1 and 2: demonstrate an understanding of currency")).toBeNull();
    expect(objectiveTopic("Grade 3: demonstrate an understanding of currency")).toBeNull();
  });

  it("never invents one for an empty or code-only overall", () => {
    expect(objectiveTopic("")).toBeNull();
    expect(objectiveTopic("B1")).toBeNull();
  });

  it("labels every Language objective, because Ontario labels them all", () => {
    const objectives = objectivesFor("language", "3");
    expect(objectives.length).toBeGreaterThan(0);
    for (const o of objectives) {
      expect(objectiveTopic(o.text), `${o.code} has no topic`).toBeTruthy();
    }
  });

  it("falls back to the wording rather than a blank for Mathematics", () => {
    // Nothing to extract there, so the picker shows the published text. The
    // test exists to catch a "fix" that starts writing math topics for us.
    for (const o of objectivesFor("mathematics", "3")) {
      const label = objectiveTopic(o.text) ?? o.text;
      expect(label.length, `${o.code} unlabelled`).toBeGreaterThan(0);
    }
  });
});

describe("topic narrowing", () => {
  it("loses no expectation between the flat list and the topics", () => {
    for (const [subject, grade] of [
      ["language", "3"],
      ["mathematics", "5"],
      ["language", "8"],
    ] as const) {
      const viaTopics = objectivesFor(subject, grade).flatMap((o) =>
        o.specifics.map((s) => s.code)
      );
      const flat = expectationOptions(subject, grade).map((o) => o.code);
      expect(viaTopics.sort(), `${subject} G${grade}`).toEqual(flat.sort());
    }
  });

  it("keeps every topic small enough to read without scrolling", () => {
    for (const grade of ["1", "3", "6", "8"] as GradeId[]) {
      for (const o of objectivesFor("language", grade)) {
        expect(o.specifics.length, `${o.code} at G${grade}`).toBeLessThanOrEqual(20);
      }
    }
  });
});

/**
 * The step down is the reason the grade is choosable at all, and it is also
 * where a lookup can go silently wrong: B1.1 at Grade 1 is a different
 * expectation from B1.1 at Grade 3, so resolving against the profile's grade
 * would quietly hand the model the wrong wording.
 */
describe("planning at a grade other than the profile's", () => {
  it("resolves a code against the grade being planned, not the profile's", () => {
    const g1 = findExpectation("language", "1", "B1.1");
    const g3 = findExpectation("language", "3", "B1.1");
    expect(g1).not.toBeNull();
    expect(g3).not.toBeNull();
    expect(g1!.text).not.toBe(g3!.text);
  });

  it("says nothing when the plan sits at the profile's own grade", () => {
    expect(planGradeContext("3", "3")).toBe("");
    expect(planGradeContext(null, "3")).toBe("");
  });

  it("names both grades so the plan does not read as a filing error", () => {
    const ctx = planGradeContext("1", "3");
    expect(ctx).toContain("Grade 1");
    expect(ctx).toContain("Grade 3");
  });

  it("describes the work, never the child", () => {
    const ctx = planGradeContext("1", "4");
    expect(ctx).toMatch(/never describe the learner as/i);
    // CLAUDE.md §7: we adapt the plan, we do not label the child.
    expect(ctx).not.toMatch(/\bthe (child|learner) is (behind|below|delayed)/i);
  });

  it("handles Kindergarten on either side without NaN arithmetic", () => {
    expect(planGradeContext("K", "2")).toContain("Kindergarten");
    expect(planGradeContext("2", "K")).toContain("Kindergarten");
  });
});

describe("emptyKind", () => {
  it("blames the source document, not our work, where the source is the reason", () => {
    expect(emptyKind("language", "K")).toBe("kindergarten");
    expect(emptyKind("french", "2")).toBe("fsl-starts-later");
    expect(emptyKind("science-technology", "3")).toBe("not-transcribed");
  });
});
