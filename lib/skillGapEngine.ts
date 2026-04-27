import type { AnalysisResult } from "@/types/session";
import { SKILLS } from "./curriculumMap";

/**
 * Map free-text skill phrases coming back from the AI onto our canonical
 * skill IDs from `data/skill-map.json`. We use a lightweight token-overlap
 * heuristic — good enough for MVP routing of progress records.
 *
 * Returns an array of canonical skill IDs in priority order.
 */
export function mapToSkillIds(result: AnalysisResult): string[] {
  const targets = [
    ...result.whatToTeachNext,
    ...result.keySkillGaps,
  ];
  const out: string[] = [];

  for (const phrase of targets) {
    const id = bestMatch(phrase);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
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
  // Require at least 2 overlapping meaningful tokens to claim a match.
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
