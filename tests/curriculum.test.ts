import { describe, expect, it } from "vitest";

import {
  LEGACY_SUBJECTS,
  SUBJECTS,
  SUPPORTED_SUBJECTS,
  expectationOptions,
  loadedExpectationCount,
  overallFor,
  resolveSubject,
  strandsFor,
  subjectsWithExpectations,
} from "@/lib/curriculum";
import { SUBJECTS as APP_SUBJECTS, normalizeSubject } from "@/types/child";

/**
 * The curriculum data is structure-only right now: real subject and strand
 * names, no expectation text, because that has to be transcribed from
 * Ontario rather than generated. These tests exist to keep it that way —
 * a fabricated expectation is worse than an empty one, because a teacher
 * will trust it.
 */
describe("Ontario curriculum structure", () => {
  it("lists the eight elementary subjects", () => {
    expect(SUBJECTS).toHaveLength(8);
    expect(SUBJECTS.map((s) => s.id)).toContain("language");
    expect(SUBJECTS.map((s) => s.id)).toContain("science-technology");
    expect(SUBJECTS.map((s) => s.id)).toContain("french");
  });

  it("every subject cites an official source", () => {
    for (const s of SUBJECTS) {
      expect(s.source, `${s.id} has no source`).toMatch(/^https:\/\/www\.dcp\.edu\.gov\.on\.ca\//);
    }
  });

  it("Reading and Writing are strands of Language, not subjects", () => {
    expect(SUBJECTS.map((s) => s.id)).not.toContain("reading");
    expect(SUBJECTS.map((s) => s.id)).not.toContain("writing");
    const language = SUBJECTS.find((s) => s.id === "language");
    expect(language?.strands.map((s) => s.code)).toEqual(["A", "B", "C", "D"]);
  });

  it("the app's subject list matches the supported subjects", () => {
    expect([...APP_SUBJECTS].sort()).toEqual(SUPPORTED_SUBJECTS.map((s) => s.id).sort());
  });

  it("every supported subject has strands", () => {
    for (const s of SUPPORTED_SUBJECTS) {
      expect(s.strands.length, `${s.id} has no strands`).toBeGreaterThan(0);
    }
  });

  it("strand codes are unique within a subject", () => {
    for (const s of SUBJECTS) {
      const codes = s.strands.map((st) => st.code);
      expect(new Set(codes).size, `${s.id} has duplicate strand codes`).toBe(codes.length);
    }
  });
});

describe("expectations are transcribed, never generated", () => {
  it("Language and Mathematics are loaded from the Ministry PDFs", () => {
    expect(subjectsWithExpectations()).toEqual(
      expect.arrayContaining(["language", "mathematics"])
    );
    expect(loadedExpectationCount()).toBeGreaterThan(500);
  });

  it("every expectation carries a well-formed Ontario code", () => {
    for (const s of SUBJECTS) {
      for (const strand of s.strands) {
        for (const overall of strand.overall) {
          expect(overall.code, `${s.id} overall has no code`).toMatch(/^[A-Z]\d+$/);
          expect(overall.code.startsWith(strand.code)).toBe(true);
        }
        for (const [grade, list] of Object.entries(strand.specific ?? {})) {
          for (const spec of list ?? []) {
            expect(spec.code, `${s.id} ${grade} specific`).toMatch(/^[A-Z]\d+\.\d+$/);
            expect(spec.code.startsWith(strand.code)).toBe(true);
            expect(spec.text.trim().length).toBeGreaterThan(14);
          }
        }
      }
    }
  });

  // The parser used to sweep running headers into the last entry on a page.
  it("carries no page furniture from the source PDFs", () => {
    const furniture = /\|\s*\d+\s*Strand|Strand [A-F]\.\s*$|\b(NUMBER|ALGEBRA|DATA)\s*$/;
    for (const s of SUBJECTS) {
      for (const strand of s.strands) {
        for (const list of Object.values(strand.specific ?? {})) {
          for (const spec of list ?? []) {
            expect(furniture.test(spec.text), `${spec.code}: ${spec.text.slice(-45)}`).toBe(false);
          }
        }
      }
    }
  });

  it("codes are unique within a grade", () => {
    for (const s of SUBJECTS) {
      for (const strand of s.strands) {
        for (const [grade, list] of Object.entries(strand.specific ?? {})) {
          const codes = (list ?? []).map((e) => e.code);
          expect(new Set(codes).size, `${s.id} ${strand.code} G${grade}`).toBe(codes.length);
        }
      }
    }
  });

  it("a real grade returns real options", () => {
    const g3 = expectationOptions("language", "3");
    expect(g3.length).toBeGreaterThan(20);
    expect(g3[0].code).toMatch(/^[A-D]\d+\.\d+$/);
    expect(overallFor("language", "3").length).toBeGreaterThan(0);
  });

  it("a subject with no transcription yet returns nothing, not guesses", () => {
    expect(expectationOptions("science-technology", "3")).toEqual([]);
  });

  it("does not surface grades 7 and 8, which are outside K-6", () => {
    for (const s of SUBJECTS) {
      for (const strand of s.strands) {
        expect(strand.grades).not.toContain("7");
        expect(strand.grades).not.toContain("8");
      }
    }
  });
});

describe("sessions saved under the old subject names still resolve", () => {
  it.each(Object.keys(LEGACY_SUBJECTS))("%s resolves to a real subject", (stored) => {
    const r = resolveSubject(stored);
    expect(r, `${stored} did not resolve`).not.toBeNull();
    expect(r!.subject.supported).toBe(true);
  });

  it("reading and writing land on Language, with the right strand", () => {
    expect(resolveSubject("reading")!.subject.id).toBe("language");
    expect(resolveSubject("reading")!.strand?.code).toBe("C");
    expect(resolveSubject("writing")!.subject.id).toBe("language");
    expect(resolveSubject("writing")!.strand?.code).toBe("D");
  });

  it("normalizeSubject folds every legacy value onto a current one", () => {
    expect(normalizeSubject("reading")).toBe("language");
    expect(normalizeSubject("writing")).toBe("language");
    expect(normalizeSubject("math")).toBe("mathematics");
    expect(normalizeSubject("french")).toBe("french");
  });

  it("an unknown stored value does not resolve", () => {
    expect(resolveSubject("underwater-basket-weaving")).toBeNull();
  });
});
