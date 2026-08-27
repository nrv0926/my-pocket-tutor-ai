"use server";

import { expectationOptions, programsFor, type ExpectationOption } from "@/lib/curriculum";
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
