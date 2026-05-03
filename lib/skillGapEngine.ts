import type {
  HomeschoolResult,
  Mode,
  ParentResult,
  TeacherResult,
} from "@/types/session";
import { SKILLS } from "./curriculumMap";

/**
 * Map free-text skill phrases coming back from the AI onto our canonical
 * skill IDs from `data/skill-map.json`. We use a lightweight token-overlap
 * heuristic — good enough for MVP routing of progress records.
 *
 * Each mode exposes priority targets in a different shape:
 * - parent     → whatToTeachNext (top 3) + keySkillGaps
 * - homeschool → keySkillGaps + dailyLessons[].skill
 * - teacher    → keySkillGaps + interventionPlan[].focus
 */
export function mapToSkillIds(
  result: ParentResult | HomeschoolResult | TeacherResult,
  mode: Mode,
): string[] {
  const targets = collectTargets(result, mode);
  const out: string[] = [];

  for (const phrase of targets) {
    const id = bestMatch(phrase);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

function collectTargets(
  result: ParentResult | HomeschoolResult | TeacherResult,
  mode: Mode,
): string[] {
  if (mode === "parent") {
    const r = result as ParentResult;
    return [...r.whatToTeachNext, ...r.keySkillGaps];
  }
  if (mode === "homeschool") {
    const r = result as HomeschoolResult;
    return [...r.keySkillGaps, ...r.dailyLessons.map((l) => l.skill)];
  }
  const r = result as TeacherResult;
  return [...r.keySkillGaps, ...r.interventionPlan.map((s) => s.focus)];
}

function bestMatch(phrase: string): string | null {
  const tokens = tokenize(phrase);
  let best: { id: string; score: number } | null = null;

  for (const s of SKILLS) {
    const score = overlap(tokens, tokenize(`${s.label} ${s.id}`));
    if (score > 0 && (!best || score > best.score)) {
      best = { id: s.id, score };
    }
  }
  return best && best.score >= 2 ? best.id : null;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function overlap(a: string[], b: string[]): number {
  const set = new Set(b);
  let n = 0;
  for (const t of a) if (set.has(t)) n++;
  return n;
}

const STOPWORDS = new Set([
  "the", "and", "with", "from", "that", "this", "your", "child",
  "their", "them", "into", "onto", "what", "when", "where", "while",
  "for", "are", "but", "not", "now", "out", "use", "using",
]);
