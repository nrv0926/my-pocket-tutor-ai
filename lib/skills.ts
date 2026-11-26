import map from "@/data/skill-map.json";

/**
 * The skill graph: what a skill is called, and what sits underneath it.
 *
 * Deliberately small and dependency-free. It reads one ~6 KB JSON file and
 * nothing else, so recommend() and anything rendering a next step can use
 * it without dragging the transcribed curriculum along. Resolving a skill
 * to real expectation codes is a different job with a much heavier import,
 * and lives in lib/skillExpectations.ts.
 *
 * What is ours and what is not (CLAUDE.md §6):
 *   · labels and prerequisite ORDER are ours, and follow the progressions
 *     already in /data — the seven phonics stages and five pillars in
 *     literacy-progression.json, the grade sequence in math-progression.json
 *   · no expectation code is stored anywhere in the graph. Codes are
 *     derived by matching published wording, never typed.
 */

export interface SkillNode {
  id: string;
  subject: "reading" | "writing" | "math";
  label: string;
  minGrade: string;
  /** Most foundational first. See prerequisiteFor(). */
  prerequisiteIds: string[];
  /** Search terms, ours, matched against Ontario's wording. Never codes. */
  terms: string[];
}

export const SKILL_NODES: SkillNode[] = (map as { skills: SkillNode[] }).skills.map((s) => ({
  ...s,
  prerequisiteIds: s.prerequisiteIds ?? [],
  terms: s.terms ?? [],
}));

const BY_ID = new Map(SKILL_NODES.map((s) => [s.id, s]));

export function skillById(id: string): SkillNode | undefined {
  return BY_ID.get(id);
}

/** Plain-English name, falling back to the id so nothing renders blank. */
export function skillName(id: string): string {
  return BY_ID.get(id)?.label ?? id;
}

/** Everything directly underneath a skill, most foundational first. */
export function prerequisitesFor(id: string): SkillNode[] {
  return (BY_ID.get(id)?.prerequisiteIds ?? [])
    .map((p) => BY_ID.get(p))
    .filter((s): s is SkillNode => Boolean(s));
}

/**
 * The one thing to check first when a skill is failing.
 *
 * Where a skill rests on more than one, the list is ordered most
 * foundational first and this takes the head: subtraction within 100 names
 * place value before it names subtracting within 20, because a child who
 * cannot say what the 4 in 348 is worth will not learn to trade across it
 * by practising more subtraction.
 */
export function prerequisiteFor(id: string): SkillNode | null {
  return prerequisitesFor(id)[0] ?? null;
}

/**
 * Everything underneath, transitively, nearest first. Cycle-safe by
 * construction — tests/skills.test.ts proves the data has none — but the
 * visited set means a bad edit degrades to a short list, not a hang.
 */
export function prerequisiteChain(id: string): SkillNode[] {
  const out: SkillNode[] = [];
  const seen = new Set<string>([id]);
  let frontier = [...(BY_ID.get(id)?.prerequisiteIds ?? [])];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const pid of frontier) {
      if (seen.has(pid)) continue;
      seen.add(pid);
      const node = BY_ID.get(pid);
      if (!node) continue;
      out.push(node);
      next.push(...node.prerequisiteIds);
    }
    frontier = next;
  }
  return out;
}
