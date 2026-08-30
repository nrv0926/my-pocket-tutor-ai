import { describe, expect, it } from "vitest";
import vocabulary from "@/data/topics.json";
import { hasPlainTopics, plainTopicsFor } from "@/lib/plainTopics";
import { expectationOptions } from "@/lib/curriculum";
import type { GradeId, SubjectId } from "@/types/curriculum";

/**
 * The labels are ours; the membership is not. A topic collects the
 * transcribed expectations whose own published wording matches it, so no
 * expectation is ever filed under a topic by hand — which is the same rule
 * that stops us writing codes from memory (CLAUDE.md §6).
 */
const GRADES: GradeId[] = ["1", "2", "3", "4", "5", "6", "7", "8"];

describe("plain topics are derived, never assigned", () => {
  it("only returns codes that exist at that grade", () => {
    for (const grade of GRADES) {
      const real = new Set(expectationOptions("mathematics", grade).map((e) => e.code));
      for (const t of plainTopicsFor("mathematics", grade)) {
        for (const code of t.codes) {
          expect(real.has(code), `${t.id} claims ${code} at G${grade}`).toBe(true);
        }
      }
    }
  });

  it("puts an expectation in a topic only when its own text says so", () => {
    const terms = vocabulary.subjects.mathematics.find((t) => t.id === "fractions")!.terms;
    const byText = expectationOptions("mathematics", "6")
      .filter((e) => terms.some((t) => new RegExp(`\\b${t}`, "i").test(e.text)))
      .map((e) => e.code);
    const byTopic = plainTopicsFor("mathematics", "6").find((t) => t.id === "fractions")!.codes;
    expect(byTopic.sort()).toEqual(byText.sort());
  });

  it("never returns an empty topic, because that is a promise not kept", () => {
    for (const subject of ["mathematics", "language"] as SubjectId[]) {
      for (const grade of GRADES) {
        for (const t of plainTopicsFor(subject, grade)) {
          expect(t.codes.length, `${subject} ${t.id} G${grade}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("hides a topic at a grade that does not teach it", () => {
    // Integers and exponents are not Grade 1 mathematics.
    const g1 = plainTopicsFor("mathematics", "1").map((t) => t.id);
    expect(g1).not.toContain("integers-exponents");
    expect(plainTopicsFor("mathematics", "8").map((t) => t.id)).toContain("integers-exponents");
  });
});

describe("the matching is anchored", () => {
  it("does not let 'rate' match 'demonstrate'", () => {
    // This was a real bug: a third of Grade 8 landed under Ratios because
    // the match was a bare substring.
    const ratio = plainTopicsFor("mathematics", "8").find((t) => t.id === "ratio-rate");
    const wrong = expectationOptions("mathematics", "8").filter(
      (e) => /demonstrate|separate|accurate/i.test(e.text) && !/\brat(io|es|e of)/i.test(e.text)
    );
    for (const e of wrong) {
      expect(ratio?.codes ?? [], `${e.code} matched on a substring`).not.toContain(e.code);
    }
  });

  it("does not let 'code' match 'decode'", () => {
    const coding = plainTopicsFor("mathematics", "3").find((t) => t.id === "coding");
    expect(coding).toBeTruthy();
    // Every coding hit is a C3 expectation, which is Ontario's coding strand.
    for (const c of coding!.codes) expect(c.startsWith("C3")).toBe(true);
  });
});

describe("coverage is real, not decorative", () => {
  it("offers a useful number of topics at every grade", () => {
    for (const grade of GRADES) {
      const n = plainTopicsFor("mathematics", grade).length;
      expect(n, `mathematics G${grade}`).toBeGreaterThanOrEqual(8);
      expect(n, `mathematics G${grade} is a scroll`).toBeLessThanOrEqual(20);
    }
  });

  it("reaches most of mathematics, which is what makes it worth offering", () => {
    for (const grade of ["3", "6", "8"] as GradeId[]) {
      const all = expectationOptions("mathematics", grade);
      const claimed = new Set(plainTopicsFor("mathematics", grade).flatMap((t) => t.codes));
      expect(claimed.size / all.length, `G${grade} coverage`).toBeGreaterThan(0.85);
    }
  });

  it("says which subjects have a plain layer at all", () => {
    expect(hasPlainTopics("mathematics")).toBe(true);
    expect(hasPlainTopics("language")).toBe(true);
    // French falls back to the objective list rather than pretending.
    expect(hasPlainTopics("french")).toBe(false);
    expect(plainTopicsFor("french", "4")).toEqual([]);
  });
});

describe("the vocabulary file is honest about itself", () => {
  it("says the labels are ours and the membership is not", () => {
    expect(vocabulary.note).toMatch(/LABELS ARE OURS/);
    expect(vocabulary.note).toMatch(/Membership is NOT ours/i);
  });

  it("gives every topic an id, a label and something to match on", () => {
    for (const [subject, topics] of Object.entries(vocabulary.subjects)) {
      const ids = new Set<string>();
      for (const t of topics) {
        expect(t.id, subject).toMatch(/^[a-z][a-z-]+$/);
        expect(t.label.length, t.id).toBeGreaterThan(3);
        expect(t.terms.length, t.id).toBeGreaterThan(0);
        expect(ids.has(t.id), `${t.id} is duplicated`).toBe(false);
        ids.add(t.id);
      }
    }
  });
});
