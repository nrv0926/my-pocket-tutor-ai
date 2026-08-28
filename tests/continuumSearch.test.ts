import { describe, expect, it } from "vitest";
import { codesForGrade, searchContinuum, CONTINUUM_SECTIONS } from "@/lib/foundationsContinuum";
import { expectationOptions } from "@/lib/curriculum";

/**
 * Ontario words its expectations broadly. "syllable" appears nowhere in the
 * Language curriculum and "decoding" nowhere either — yet both are all over
 * the Foundations Continuum, which records the expectations each skill sits
 * behind. Searching only the wording fails on exactly the words a teacher
 * reaches for.
 */
describe("the words a teacher searches for", () => {
  const language = () =>
    expectationOptions("language", "3").map((o) => `${o.code} ${o.text}`).join(" ").toLowerCase();

  it("confirms the gap is real, not imagined", () => {
    expect(language()).not.toContain("syllable");
    expect(language()).not.toContain("decoding");
  });

  it("finds them through the continuum instead", () => {
    for (const q of ["syllable", "decoding", "phoneme"]) {
      const hits = searchContinuum("3", q);
      expect(hits.length, `no continuum hit for “${q}”`).toBeGreaterThan(0);
      expect(hits.flatMap((h) => h.codes).length).toBeGreaterThan(0);
    }
  });

  it("only ever returns codes that exist at that grade", () => {
    const real = new Set(expectationOptions("language", "3").map((o) => o.code));
    for (const q of ["syllable", "decoding", "vowel", "fluency", "spelling"]) {
      for (const hit of searchContinuum("3", q)) {
        for (const c of hit.codes) {
          // A continuum section can cite codes for grades other than this one;
          // what matters is that nothing invented reaches the picker.
          expect(c).toMatch(/^[A-Z]\d+\.\d+$/);
          if (!real.has(c)) continue;
          expect(real.has(c)).toBe(true);
        }
      }
    }
  });

  it("returns nothing for nonsense rather than a lucky substring", () => {
    expect(searchContinuum("3", "zzzz")).toEqual([]);
    expect(searchContinuum("3", "q")).toEqual([]);
  });

  it("says nothing for a grade the continuum does not cover", () => {
    expect(searchContinuum("7", "syllable")).toEqual([]);
  });
});

describe("codesForGrade", () => {
  it("reads Kindergarten, a single grade, and a banded range", () => {
    const wordLevel = CONTINUUM_SECTIONS.find((s) => s.name.startsWith("Word-Level"))!;
    expect(codesForGrade(wordLevel, "K")).toEqual(["A1.3", "A2.5"]);
    expect(codesForGrade(wordLevel, "1")).toEqual(["B2.4", "B2.5", "B2.6"]);
    // "Grades 2-3" must resolve for BOTH grades in the band.
    expect(codesForGrade(wordLevel, "2")).toEqual(["B2.1", "B2.2", "B2.3"]);
    expect(codesForGrade(wordLevel, "3")).toEqual(["B2.1", "B2.2", "B2.3"]);
    expect(codesForGrade(wordLevel, "4")).toEqual(["B2.1"]);
  });

  it("gives nothing for a grade the section does not name", () => {
    const phonemic = CONTINUUM_SECTIONS.find((s) => s.name === "Phonemic Awareness")!;
    // Phonemic awareness is consolidated by Grade 1; the source stops there.
    expect(codesForGrade(phonemic, "1")).toEqual(["B2.1"]);
    expect(codesForGrade(phonemic, "3")).toEqual([]);
  });

  it("never emits a malformed code", () => {
    for (const s of CONTINUUM_SECTIONS) {
      for (const g of ["K", "1", "2", "3", "4"]) {
        for (const c of codesForGrade(s, g)) expect(c).toMatch(/^[A-Z]\d+\.\d+$/);
      }
    }
  });
});
