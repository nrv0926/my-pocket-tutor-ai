import { expectationOptions } from "@/lib/curriculum";
import { searchContinuum } from "@/lib/foundationsContinuum";
import { skillById, type SkillNode } from "@/lib/skills";
import type { GradeId, SubjectId } from "@/types/curriculum";

/**
 * Which transcribed expectations a skill actually covers, derived.
 *
 * SERVER ONLY. This imports lib/curriculum, which pulls ~250 KB of
 * transcribed JSON at module scope; one client import once took first
 * load from 99 KB to 175 KB, and tests/clientBundle.test.ts fails the
 * build if a "use client" file reaches it. Go through a server action.
 *
 * Nothing here is filed by hand. A skill carries search terms, those
 * terms are matched at a WORD BOUNDARY against Ontario's own published
 * wording, and whatever matches is what the skill covers. A bare
 * substring match is wrong in a way that is hard to see: "rate" inside
 * "demonstrate" once put a third of Grade 8 under Ratios.
 *
 * Both sources are searched, because Ontario words its expectations
 * broadly and a reading skill's vocabulary is often not in them at all —
 * "syllable" appears nowhere in the Language curriculum and neither does
 * "decoding". Both are all over the Foundations Continuum, which records
 * the expectations each foundational skill sits behind.
 */

/** skill-map.json predates the current taxonomy; Reading and Writing are
 *  strands of Language, not subjects of their own (CLAUDE.md §6). */
const SUBJECT_OF: Record<SkillNode["subject"], SubjectId> = {
  reading: "language",
  writing: "language",
  math: "mathematics",
};

function matcher(terms: string[]): RegExp {
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(?:${escaped.join("|")})`, "i");
}

export interface SkillExpectation {
  code: string;
  text: string;
  strandCode: string;
  strandName: string;
  /** How it was found: Ontario's own wording, or the continuum behind it. */
  via: "expectation" | "continuum";
}

/**
 * Expectations covering a skill at one grade. Empty is a real answer: it
 * means the curriculum does not phrase anything that way at that grade,
 * which is worth showing plainly rather than papering over.
 */
export function expectationsForSkill(
  skillId: string,
  grade: GradeId,
): SkillExpectation[] {
  const skill = skillById(skillId);
  if (!skill || skill.terms.length === 0) return [];

  const subject = SUBJECT_OF[skill.subject];
  const re = matcher(skill.terms);
  const seen = new Set<string>();
  const out: SkillExpectation[] = [];

  for (const e of expectationOptions(subject, grade)) {
    if (!re.test(e.text)) continue;
    if (seen.has(e.code)) continue;
    seen.add(e.code);
    out.push({ ...e, via: "expectation" });
  }

  // The continuum only covers Language, K to 4, and only names codes —
  // so a hit there is resolved back to the expectation it sits behind.
  if (subject === "language") {
    const byCode = new Map(expectationOptions(subject, grade).map((e) => [e.code, e]));
    for (const term of skill.terms) {
      for (const hit of searchContinuum(grade, term)) {
        for (const code of hit.codes) {
          if (seen.has(code)) continue;
          const e = byCode.get(code);
          if (!e) continue;
          seen.add(code);
          out.push({ ...e, via: "continuum" });
        }
      }
    }
  }

  return out;
}

/** Just the codes, for a compact summary. */
export function expectationCodesForSkill(skillId: string, grade: GradeId): string[] {
  return expectationsForSkill(skillId, grade).map((e) => e.code);
}
