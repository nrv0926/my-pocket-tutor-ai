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

/**
 * Parse a section's code mapping into the expectations it serves per grade.
 *
 * The strings look like
 *   "Kindergarten: A1.3, A2.5; Grade 1: B2.4, B2.5, B2.6; Grades 2-3: B2.1"
 * which is Ontario telling us, in the document itself, which expectations
 * each foundational skill sits behind. That mapping is what makes it possible
 * to search a teacher's vocabulary and land on a selectable expectation.
 */
const GRADE_SPEC = /^(Kindergarten|Grades?\s+(\d)(?:\s*[\u2013\u2014-]\s*(\d))?)$/i;

export function codesForGrade(section: ContinuumSection, grade: string): string[] {
  const out: string[] = [];
  for (const segment of section.codes.split(";")) {
    const at = segment.indexOf(":");
    if (at < 0) continue;
    const spec = segment.slice(0, at).trim();
    const codes = segment
      .slice(at + 1)
      .split(",")
      .map((c) => c.trim())
      .filter((c) => /^[A-Z]\d+\.\d+$/.test(c));
    if (codes.length === 0) continue;

    const m = GRADE_SPEC.exec(spec);
    if (!m) continue;

    if (/^Kindergarten$/i.test(m[1])) {
      if (grade === "K") out.push(...codes);
      continue;
    }
    const lo = Number(m[2]);
    const hi = m[3] ? Number(m[3]) : lo;
    const g = Number(grade);
    if (!Number.isNaN(g) && g >= lo && g <= hi) out.push(...codes);
  }
  return [...new Set(out)];
}

export interface ContinuumMatch {
  section: string;
  label: string;
  text: string;
  /** Expectation codes this skill sits behind, at the grade asked for. */
  codes: string[];
}

/**
 * Find foundational skills matching a query, with the expectations they serve.
 *
 * Ontario words its expectations broadly — "syllable" appears nowhere in the
 * Language curriculum, and "decoding" nowhere either — while both are all over
 * this continuum. Searching only the expectations means a teacher's own
 * vocabulary returns nothing.
 */
export function searchContinuum(grade: string, query: string): ContinuumMatch[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2 || !continuumCovers(grade)) return [];

  const out: ContinuumMatch[] = [];
  for (const section of CONTINUUM_SECTIONS) {
    const codes = codesForGrade(section, grade);
    if (codes.length === 0) continue;
    const sectionHit = section.name.toLowerCase().includes(q);
    for (const row of section.rows) {
      const text = row.byGrade[grade as ContinuumGrade];
      if (!text) continue;
      if (!sectionHit && !text.toLowerCase().includes(q) && !row.label.toLowerCase().includes(q)) {
        continue;
      }
      out.push({ section: section.name, label: row.label, text, codes });
    }
  }
  return out;
}
