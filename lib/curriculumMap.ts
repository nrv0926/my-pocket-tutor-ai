import ontario from "@/data/ontario-curriculum-k6.json";
import literacy from "@/data/literacy-progression.json";
import math from "@/data/math-progression.json";
import skills from "@/data/skill-map.json";
import type { Grade, Subject } from "@/types/child";

export interface SkillEntry {
  id: string;
  subject: Subject;
  label: string;
  minGrade: Grade;
}

export const SKILLS: SkillEntry[] = (skills as { skills: SkillEntry[] }).skills;

export function expectationsFor(grade: Grade, subject: Subject): string[] {
  const grades = (ontario as any).grades || {};
  const subj = grades?.[grade]?.[subject];
  return Array.isArray(subj) ? subj : [];
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
