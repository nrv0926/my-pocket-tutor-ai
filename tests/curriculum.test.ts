import { describe, expect, it } from "vitest";

import {
  LEGACY_SUBJECTS,
  SUBJECTS,
  SUPPORTED_SUBJECTS,
  expectationOptions,
  loadedExpectationCount,
  allStrands,
  findExpectation,
  overallFor,
  resolveSubject,
  programsFor,
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
      // FSL keeps its strands per program, so count across both shapes.
      expect(allStrands(s).length, `${s.id} has no strands`).toBeGreaterThan(0);
    }
  });

  it("strand codes are unique within a subject", () => {
    for (const s of SUBJECTS) {
      if (s.programs?.length) {
        for (const p of s.programs) {
          const codes = p.strands.map((st) => st.code);
          expect(new Set(codes).size, `${s.id}/${p.id} duplicate strands`).toBe(codes.length);
        }
        continue;
      }
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
      for (const strand of allStrands(s)) {
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
      for (const strand of allStrands(s)) {
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
      for (const strand of allStrands(s)) {
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

  it("surfaces the full elementary range, including Grades 7 and 8", () => {
    const lang = SUBJECTS.find((s) => s.id === "language")!;
    for (const g of ["7", "8"] as const) {
      expect(
        allStrands(lang).some((st) => st.grades.includes(g)),
        `Language is missing Grade ${g}`
      ).toBe(true);
      expect(expectationOptions("language", g).length).toBeGreaterThan(10);
      expect(expectationOptions("mathematics", g).length).toBeGreaterThan(10);
    }
  });

  it("Grade 8 French is available in every program", () => {
    for (const p of ["core", "extended", "immersion"] as const) {
      expect(expectationOptions("french", "8", p).length).toBeGreaterThan(0);
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

/**
 * The expectation code arrives from a <select> in a browser, so it is looked
 * up rather than trusted. A code that does not exist must not reach a prompt.
 */
describe("findExpectation", () => {
  it("resolves a real code to its published wording", () => {
    const found = findExpectation("language", "3", "B2.1");
    expect(found).not.toBeNull();
    expect(found!.code).toBe("B2.1");
    expect(found!.strandCode).toBe("B");
    expect(found!.text.length).toBeGreaterThan(20);
  });

  it("returns null for a code that does not exist at that grade", () => {
    expect(findExpectation("language", "3", "B99.9")).toBeNull();
  });

  it("does not leak a code across subjects", () => {
    // B2.1 exists in both, but they are different expectations.
    const lang = findExpectation("language", "3", "B2.1");
    const math = findExpectation("mathematics", "3", "B2.1");
    expect(lang!.text).not.toBe(math!.text);
  });

  it("returns null for a subject with no transcription", () => {
    expect(findExpectation("science-technology", "3", "B1.1")).toBeNull();
  });

  it("rejects a fabricated code rather than inventing wording", () => {
    for (const bogus of ["Z1.1", "B1.999", "'; drop table --", ""]) {
      expect(findExpectation("language", "3", bogus)).toBeNull();
    }
  });
});

/**
 * FSL is the only subject with programs: Core, Extended and Immersion each
 * publish their own expectations for the same strand and grade.
 */
describe("French as a Second Language", () => {
  it("carries three programs", () => {
    const ids = programsFor("french").map((p) => p.id);
    expect(ids).toEqual(["core", "extended", "immersion"]);
  });

  it("only Immersion runs below Grade 4, as Ontario publishes it", () => {
    expect(expectationOptions("french", "1", "immersion").length).toBeGreaterThan(0);
    expect(expectationOptions("french", "1", "core")).toEqual([]);
    expect(expectationOptions("french", "5", "core").length).toBeGreaterThan(0);
  });

  it("the same code means different things in different programs", () => {
    const core = findExpectation("french", "5", "A1.1", "core");
    const imm = findExpectation("french", "5", "A1.1", "immersion");
    expect(core).not.toBeNull();
    expect(imm).not.toBeNull();
    expect(core!.text).not.toBe(imm!.text);
  });

  it("defaults to Immersion, the only program covering the whole K-6 range", () => {
    const fallback = expectationOptions("french", "2");
    expect(fallback.length).toBeGreaterThan(0);
    expect(fallback).toEqual(expectationOptions("french", "2", "immersion"));
  });

  it("is flagged as the French edition, so the UI can say so", () => {
    expect(SUBJECTS.find((s) => s.id === "french")?.language).toBe("fr");
  });

  it("carries no teacher prompts or instructional tips", () => {
    const support = /Questions incitatives|Conseils p[ée]dagogiques/i;
    for (const p of programsFor("french")) {
      for (const st of p.strands) {
        for (const list of Object.values(st.specific ?? {})) {
          for (const e of list ?? []) {
            expect(support.test(e.text), `${p.id} ${e.code}`).toBe(false);
          }
        }
      }
    }
  });
});
