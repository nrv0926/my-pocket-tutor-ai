import { describe, expect, it } from "vitest";

import {
  EXPECTATIONS_VERIFIED,
  LEGACY_SUBJECTS,
  SUBJECTS,
  SUPPORTED_SUBJECTS,
  expectationOptions,
  loadedExpectationCount,
  resolveSubject,
  strandsFor,
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
  it("is not marked verified while nothing is loaded", () => {
    if (loadedExpectationCount() === 0) {
      expect(EXPECTATIONS_VERIFIED).toBe(false);
    }
  });

  it("any expectation that exists carries an Ontario code", () => {
    for (const s of SUBJECTS) {
      for (const strand of s.strands) {
        for (const overall of strand.overall) {
          expect(overall.code, `${s.id} overall has no code`).toMatch(/^[A-Z]\d+$/);
          for (const spec of overall.specific) {
            expect(spec.code, `${s.id} specific has no code`).toMatch(/^[A-Z]\d+\.\d+$/);
            expect(spec.text.trim().length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("expectationOptions is empty until data is loaded, never invented", () => {
    expect(expectationOptions("language", "3")).toHaveLength(loadedExpectationCountFor("language", "3"));
  });
});

function loadedExpectationCountFor(id: "language", grade: "3"): number {
  return strandsFor(id, grade).reduce(
    (n, s) => n + s.overall.reduce((m, o) => m + o.specific.length, 0),
    0
  );
}

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
