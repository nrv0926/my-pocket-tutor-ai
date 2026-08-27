import { describe, expect, it } from "vitest";
import {
  CONTINUUM_SECTIONS,
  continuumCovers,
  continuumFor,
  kindergartenCodes,
  nextGradeFor,
} from "@/lib/foundationsContinuum";

/**
 * The continuum is transcribed from a landscape table with five grade
 * columns, a label margin, a full-width intro paragraph and a running
 * footer. Every one of those produced wrong data at some point, so the
 * tests pin the shape rather than trusting the parse.
 */
describe("Language Foundations Continuum", () => {
  it("carries the six sections in the science-of-reading order", () => {
    const names = CONTINUUM_SECTIONS.map((s) => s.name);
    expect(names).toHaveLength(6);
    expect(names[0]).toBe("Phonemic Awareness");
    expect(names[1]).toBe("Alphabetic Knowledge");
    expect(names[2]).toMatch(/^Phonics/);
    expect(names[3]).toMatch(/^Word-Level Reading and Spelling/);
    expect(names[4]).toBe("Vocabulary");
    expect(names[5]).toMatch(/^Reading Fluency/);
  });

  it("maps every section to the expectations it serves", () => {
    for (const s of CONTINUUM_SECTIONS) {
      expect(s.codes, `${s.name} has no code mapping`).toMatch(/Kindergarten:\s*[A-Z]\d+\.\d+/);
    }
  });

  it("covers Kindergarten through Grade 4, and says so", () => {
    for (const g of ["K", "1", "2", "3", "4"] as const) {
      expect(continuumCovers(g)).toBe(true);
      expect(continuumFor(g).length, `nothing for grade ${g}`).toBeGreaterThan(0);
    }
    expect(continuumCovers("5")).toBe(false);
    expect(nextGradeFor("4")).toBeNull();
    expect(nextGradeFor("K")).toBe("1");
  });

  it("names the Kindergarten expectation codes", () => {
    const codes = kindergartenCodes();
    expect(codes.length).toBeGreaterThan(3);
    for (const c of codes) expect(c).toMatch(/^[A-Z]\d+\.\d+$/);
    expect(codes).toContain("A2.3");
  });

  // Each of these was a real defect during transcription.
  it("carries no page furniture, labels or intro prose in its cells", () => {
    const furniture = /Language Foundations Continuum|Knowledge and skills|^\d+\s*\|/;
    for (const s of CONTINUUM_SECTIONS) {
      expect(/^\d+\s*\|/.test(s.name), `section named after a footer: ${s.name}`).toBe(false);
      for (const r of s.rows) {
        expect(/^\d+\s*\|/.test(r.label), `row labelled by a footer: ${r.label}`).toBe(false);
        expect(r.label.length).toBeGreaterThan(0);
        for (const text of Object.values(r.byGrade)) {
          expect(furniture.test(text!), `${s.name}: ${text!.slice(0, 50)}`).toBe(false);
          expect(text!.length).toBeGreaterThan(8);
        }
      }
    }
  });

  it("keeps grade columns apart — Kindergarten is not Grade 4's text", () => {
    for (const s of CONTINUUM_SECTIONS) {
      for (const r of s.rows) {
        if (r.byGrade.K && r.byGrade["4"]) {
          expect(r.byGrade.K).not.toBe(r.byGrade["4"]);
        }
      }
    }
  });
});
