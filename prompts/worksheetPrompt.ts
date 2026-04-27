import { SYSTEM_PROMPT } from "@/lib/prompts";
import type { Child } from "@/types/child";
import type { Difficulty } from "@/types/session";

export const WORKSHEET_PROMPT_VERSION = "worksheet@2026-04-27.2";

/**
 * Worksheet generator: a focused practice sheet for one target skill.
 * Used when the parent asks for "more practice on X" without re-running a
 * full nine-section analysis.
 */
export function buildWorksheetPrompt(args: {
  child: Pick<Child, "grade" | "age" | "learningNeeds">;
  skillId: string;
  skillLabel: string;
  difficulty: Difficulty;
}): { system: string; user: string; version: string } {
  const { child, skillId, skillLabel, difficulty } = args;

  const taskAddendum = `
TASK
Write a tight, age-appropriate practice worksheet for the target skill below.
The parent prints this and works through it with the child in 10–15 minutes.

Rules specific to this task:
- 5 to 8 questions ONLY. No more, no fewer.
- Each question stands alone (no "see Q3").
- Use real-life examples a Canadian K–6 child would recognise.
- For reading skills, respect the science-of-reading order. If the target
  skill is decoding, do NOT slip in comprehension questions.
- For math, scaffold from concrete to abstract.
- No personal identifiers, no brand names, no trademarked characters.

OUTPUT FORMAT
The JSON object MUST match this TypeScript type EXACTLY:

{
  "title": string,
  "difficulty": "easy" | "medium" | "hard",
  "questions": Array<{
    "id": string,                              // "q1", "q2", ...
    "prompt": string,
    "answer": string,
    "difficulty": "easy" | "medium" | "hard"
  }>                                            // length between 5 and 8
}
`.trim();

  const system = `${SYSTEM_PROMPT}\n\n---\n\n${taskAddendum}`;

  const user = `
TARGET SKILL: ${skillLabel}  (id: ${skillId})
GRADE: ${child.grade}      AGE: ${child.age ?? "not provided"}
DIFFICULTY: ${difficulty}
LEARNING NEEDS: ${child.learningNeeds.join(", ") || "none specified"}

Return the JSON object now. No prose outside JSON, no markdown fences.
`.trim();

  return { system, user, version: WORKSHEET_PROMPT_VERSION };
}
