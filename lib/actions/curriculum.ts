"use server";

import {
  expectationOptions,
  objectiveTopic,
  objectivesFor,
  programsFor,
  type ExpectationOption,
} from "@/lib/curriculum";
import { searchContinuum } from "@/lib/foundationsContinuum";
import { plainTopicsFor } from "@/lib/plainTopics";
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

export interface TopicItem {
  code: string;
  text: string;
}

export interface Topic {
  strandCode: string;
  strandName: string;
  /** The overall expectation's code — "B2". */
  code: string;
  /** Ontario's own short name for it, where Ontario gives one. */
  label: string;
  /** The full published wording, shown once the topic is chosen. */
  text: string;
  items: TopicItem[];
}

/**
 * The curriculum as a teacher picks through it: topic first, then the item
 * she will actually teach.
 *
 * One dropdown of sixty specific expectations is technically complete and
 * practically unusable — she has to already know the wording to find
 * anything. Splitting it at Ontario's own objective boundary turns that into
 * a dozen topics and then a handful of items, which is a choice she can make
 * without reading the whole list.
 *
 * Server-side for the same reason as everything else here: the transcribed
 * curriculum is ~215 KB that has no business in a browser.
 */
export async function getTopics(
  subject: SubjectId,
  grade: GradeId,
  program?: Program["id"]
): Promise<Topic[]> {
  return objectivesFor(subject, grade, program).map((o) => ({
    strandCode: o.strandCode,
    strandName: o.strandName,
    code: o.code,
    label: objectiveTopic(o.text) ?? o.text,
    text: o.text,
    items: o.specifics.map((s) => ({ code: s.code, text: s.text })),
  }));
}

export interface PlainTopicOption {
  id: string;
  label: string;
  codes: string[];
}

/**
 * Topics in the adult's words, over expectations in Ontario's.
 *
 * Served alongside the objective list rather than instead of it: a teacher
 * knows what B2 is and a parent does not, and one dropdown can carry both.
 * Server-side like everything else here — the vocabulary is small, but it is
 * matched against the ~215 KB of transcribed curriculum that must not reach
 * a browser.
 */
export async function getPlainTopics(
  subject: SubjectId,
  grade: GradeId,
  program?: Program["id"]
): Promise<PlainTopicOption[]> {
  return plainTopicsFor(subject, grade, program);
}
