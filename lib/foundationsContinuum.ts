import file from "@/data/ontario/language-foundations-continuum.json";

/**
 * The Ontario Language Foundations Continuum, Kindergarten to Grade 4.
 *
 * This is the science-of-reading spine CLAUDE.md §4 already requires plans to
 * follow — Phonemic Awareness, Alphabetic Knowledge, Phonics, Word-Level
 * Reading and Spelling, Vocabulary, Reading Fluency — but sourced from
 * Ontario rather than from the model's memory, and showing what each looks
 * like at each grade.
 *
 * It is also the only place Kindergarten expectation codes appear in our
 * data. The full Kindergarten curriculum is a separate document we do not
 * have; this covers the literacy foundations part of it, which is the part
 * this product is about.
 */
export type ContinuumGrade = "K" | "1" | "2" | "3" | "4";

export interface ContinuumRow {
  label: string;
  byGrade: Partial<Record<ContinuumGrade, string>>;
}

export interface ContinuumSection {
  name: string;
  /** Which expectations this serves, e.g. "Kindergarten: A2.3; Grade 1: B2.1". */
  codes: string;
  rows: ContinuumRow[];
}

interface ContinuumFile {
  title: string;
  grades: ContinuumGrade[];
  policyYear: number;
  source: string;
  transcribedFrom: string[];
  sections: ContinuumSection[];
}

const CONTINUUM = file as ContinuumFile;

export const CONTINUUM_GRADES = CONTINUUM.grades;
export const CONTINUUM_SECTIONS: ContinuumSection[] = CONTINUUM.sections;
export const CONTINUUM_SOURCE = CONTINUUM.source;

/** True when the continuum has anything to say about this grade. */
export function continuumCovers(grade: string): grade is ContinuumGrade {
  return (CONTINUUM_GRADES as string[]).includes(grade);
}

export interface ContinuumEntry {
  section: string;
  codes: string;
  label: string;
  text: string;
}

/** Everything the continuum says about one grade, in published order. */
export function continuumFor(grade: ContinuumGrade): ContinuumEntry[] {
  const out: ContinuumEntry[] = [];
  for (const section of CONTINUUM_SECTIONS) {
    for (const row of section.rows) {
      const text = row.byGrade[grade];
      if (!text) continue;
      out.push({ section: section.name, codes: section.codes, label: row.label, text });
    }
  }
  return out;
}

/**
 * The next rung: what the same skill looks like one grade up.
 *
 * CLAUDE.md §4 says to step DOWN when a child is behind, never up — this is
 * for the adult's context, not for raising difficulty.
 */
export function nextGradeFor(grade: ContinuumGrade): ContinuumGrade | null {
  const i = CONTINUUM_GRADES.indexOf(grade);
  return i >= 0 && i < CONTINUUM_GRADES.length - 1 ? CONTINUUM_GRADES[i + 1] : null;
}

/** Kindergarten expectation codes named by the continuum, e.g. ["A1.3", "A2.1"]. */
export function kindergartenCodes(): string[] {
  const codes = new Set<string>();
  for (const s of CONTINUUM_SECTIONS) {
    const m = /Kindergarten:\s*([^;]+)/.exec(s.codes);
    if (!m) continue;
    for (const c of m[1].split(",")) {
      const t = c.trim();
      if (/^[A-Z]\d+\.\d+$/.test(t)) codes.add(t);
    }
  }
  return [...codes].sort();
}
