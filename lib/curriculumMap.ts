import ontario from "@/data/ontario-curriculum-k6.json";
import literacy from "@/data/literacy-progression.json";
import math from "@/data/math-progression.json";
import skills from "@/data/skill-map.json";
import type { Grade, StoredSubject, Subject } from "@/types/child";

export interface SkillEntry {
  id: string;
  /**
   * data/skill-map.json still uses the pre-taxonomy vocabulary ("reading",
   * "writing", "math"). Nothing filters on it — mapToSkillIds matches on
   * label and id only — so this is typed honestly rather than migrated.
   */
  subject: StoredSubject;
  label: string;
  minGrade: Grade;
}

export const SKILLS: SkillEntry[] = (skills as { skills: SkillEntry[] }).skills;

/**
 * Starter expectation strings from the Phase 1 placeholder file.
 *
 * That file is keyed by the old subject names, so a current subject is
 * mapped back onto the keys it actually has. The real, coded expectations
 * live in data/ontario/ and are read through lib/curriculum.ts — this stays
 * only until those are transcribed.
 */
const LEGACY_KEYS: Record<Subject, string[]> = {
  language: ["language", "reading", "writing"],
  mathematics: ["math"],
  "science-technology": [],
  french: [],
};

export function expectationsFor(grade: Grade, subject: Subject): string[] {
  const grades = (ontario as Record<string, any>).grades || {};
  const row = grades?.[grade] ?? {};
  const out: string[] = [];
  for (const key of LEGACY_KEYS[subject] ?? []) {
    if (Array.isArray(row[key])) out.push(...row[key]);
  }
  return out;
}

export function literacyProgression() {
  return literacy as typeof literacy;
}

export function mathProgression() {
  return math as typeof math;
}

/**
 * Step the grade DOWN one level (used when a child is behind).
 * Returns the same grade if already at K.
 */
export function stepDown(grade: Grade): Grade {
  const order: Grade[] = ["K", "1", "2", "3", "4", "5", "6"];
  const idx = order.indexOf(grade);
  if (idx <= 0) return "K";
  return order[idx - 1];
}

export function findSkill(id: string): SkillEntry | undefined {
  return SKILLS.find((s) => s.id === id);
}
