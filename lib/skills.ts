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

export interface GraphProblem {
  kind: "self" | "cycle" | "dangling";
  /** The ids involved. For a cycle, the loop in order. */
  path: string[];
  message: string;
}

/**
 * Check a skill graph before trusting it.
 *
 * This used to live inside tests/skills.test.ts as a local function, which
 * meant it could only ever be run against the file we ship. A graph arriving
 * any other way — an edit, a merge, a future second map — had nothing to be
 * checked by. A loop is the dangerous shape: every traversal here guards
 * itself with a visited set, so a cycle does not hang, it silently truncates
 * the chain and the engine starts naming the wrong thing to teach.
 *
 * Pure and takes its nodes as an argument so a deliberately broken graph can
 * be fed to it.
 */
export function validateSkillGraph(nodes: SkillNode[] = SKILL_NODES): GraphProblem[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const problems: GraphProblem[] = [];

  for (const node of nodes) {
    for (const pid of node.prerequisiteIds) {
      if (pid === node.id) {
        problems.push({
          kind: "self",
          path: [node.id],
          message: `${node.id} is listed as its own prerequisite`,
        });
      } else if (!byId.has(pid)) {
        problems.push({
          kind: "dangling",
          path: [node.id, pid],
          message: `${node.id} needs ${pid}, which is not a skill in this graph`,
        });
      }
    }
  }

  // Depth-first, three colours. Grey (1) means "on the current stack", so
  // meeting grey again is a back edge, which is a cycle.
  const colour = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const reported = new Set<string>();

  const walk = (id: string): void => {
    colour.set(id, 1);
    stack.push(id);
    for (const pid of byId.get(id)?.prerequisiteIds ?? []) {
      if (pid === id || !byId.has(pid)) continue; // already reported above
      if (colour.get(pid) === 1) {
        const loop = stack.slice(stack.indexOf(pid));
        const key = [...loop].sort().join("|");
        if (!reported.has(key)) {
          reported.add(key);
          problems.push({
            kind: "cycle",
            path: [...loop, pid],
            message: `prerequisites loop: ${[...loop, pid].join(" -> ")}`,
          });
        }
      } else if (!colour.has(pid)) {
        walk(pid);
      }
    }
    stack.pop();
    colour.set(id, 2);
  };

  for (const node of nodes) if (!colour.has(node.id)) walk(node.id);
  return problems;
}

/**
 * Everything underneath, transitively, nearest first. Cycle-safe by
 * construction — validateSkillGraph() proves the data has none — but the
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
