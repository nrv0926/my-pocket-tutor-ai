"use server";

import { expectationOptions, programsFor, type ExpectationOption } from "@/lib/curriculum";
import { searchContinuum } from "@/lib/foundationsContinuum";
import type { GradeId, Program, SubjectId } from "@/types/curriculum";

export interface ExpectationGroup {
  strandCode: string;
  strandName: string;
  options: ExpectationOption[];
}

/**
 * Specific expectations for one subject at one grade, grouped by strand.
 *
 * A server action rather than a client import: the transcribed curriculum is
 * ~215 KB of JSON, and shipping it to every visitor to fill one dropdown
 * would more than double the bundle. Nothing here is user data, so there is
 * no authorisation to do beyond what the page already did.
 */
export async function getExpectations(
  subject: SubjectId,
  grade: GradeId,
  program?: Program["id"]
): Promise<ExpectationGroup[]> {
  const groups = new Map<string, ExpectationGroup>();
  for (const o of expectationOptions(subject, grade, program)) {
    const g = groups.get(o.strandCode) ?? {
      strandCode: o.strandCode,
      strandName: o.strandName,
      options: [],
    };
    g.options.push(o);
    groups.set(o.strandCode, g);
  }
  return [...groups.values()];
}

export interface ProgramOption {
  id: Program["id"];
  label: string;
}

/** Programs a subject offers. Empty for everything except FSL. */
export async function getPrograms(subject: SubjectId): Promise<ProgramOption[]> {
  return programsFor(subject).map((p) => ({ id: p.id, label: p.nameEn }));
}

export interface ContinuumHint {
  /** The foundational skill that matched, e.g. "Word-Level Reading and Spelling". */
  section: string;
  label: string;
  /** Expectation codes it sits behind at this grade. */
  codes: string[];
}

export interface ExpectationSearch {
  groups: ExpectationGroup[];
  /** Set when the match came through the Foundations Continuum, not the wording. */
  via: ContinuumHint[];
  matched: number;
  total: number;
}

/**
 * Search the expectations, and the skills behind them.
 *
 * Ontario words its expectations broadly: "syllable" appears nowhere in the
 * Language curriculum and "decoding" nowhere either, yet both are all over the
 * Foundations Continuum. Searching the wording alone therefore fails on
 * exactly the words a teacher reaches for. The continuum records which
 * expectations each skill sits behind, so a hit there resolves to something
 * she can actually select.
 *
 * Server-side because the curriculum and the continuum together are ~250 KB
 * that has no business in a browser.
 */
export async function searchExpectations(
  subject: SubjectId,
  grade: GradeId,
  program: Program["id"] | undefined,
  query: string
): Promise<ExpectationSearch> {
  const all = expectationOptions(subject, grade, program);
  const q = query.trim().toLowerCase();
  if (!q) {
    return { groups: await getExpectations(subject, grade, program), via: [], matched: all.length, total: all.length };
  }

  const direct = new Set(
    all
      .filter((o) => o.code.toLowerCase().includes(q) || o.text.toLowerCase().includes(q))
      .map((o) => o.code)
  );

  // Only Language has a Foundations Continuum behind it.
  const via: ContinuumHint[] = [];
  if (subject === "language") {
    for (const m of searchContinuum(grade, query)) {
      const usable = m.codes.filter((c) => all.some((o) => o.code === c));
      if (usable.length === 0) continue;
      via.push({ section: m.section, label: m.label, codes: usable });
      for (const c of usable) direct.add(c);
    }
  }

  const groups = new Map<string, ExpectationGroup>();
  for (const o of all) {
    if (!direct.has(o.code)) continue;
    const g = groups.get(o.strandCode) ?? {
      strandCode: o.strandCode,
      strandName: o.strandName,
      options: [],
    };
    g.options.push(o);
    groups.set(o.strandCode, g);
  }

  return { groups: [...groups.values()], via, matched: direct.size, total: all.length };
}
