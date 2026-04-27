import type { Child } from "@/types/child";
import type { Difficulty } from "@/types/session";

export const WORKSHEET_PROMPT_VERSION = "worksheet@2026-04-27.1";

/**
 * Generates a single focused worksheet for a target skill. Used when the
 * parent asks "more practice on X" without re-running a full analysis.
 */
export function buildWorksheetPrompt(args: {
  child: Pick<Child, "grade" | "age" | "learningNeeds">;
  skillId: string;
  skillLabel: string;
  difficulty: Difficulty;
}): { system: string; user: string; version: string } {
  const { child, skillId, skillLabel, difficulty } = args;

  const system = `
You write tight, age-appropriate practice worksheets for K–6 students. The
parent prints this and works through it with the child in 10–15 minutes.

Rules:
- 5 to 8 questions only.
- Each question stands alone (no "see Q3").
- Use real-life examples a Canadian K–6 child would recognize.
- For reading skills: respect the science-of-reading order. If the target
  skill is decoding, do NOT slip in comprehension questions.
- For math: scaffold from concrete to abstract.
- No personal identifiers, brand names, or trademarked characters.

OUTPUT: a single JSON object:
{
  "title": string,
  "difficulty": "easy" | "medium" | "hard",
  "questions": Array<{
    "id": string,                // "q1"... "q8"
    "prompt": string,
    "answer": string,
    "difficulty": "easy" | "medium" | "hard"
  }>
}
`.trim();

  const user = `
TARGET SKILL: ${skillLabel}  (id: ${skillId})
GRADE: ${child.grade}      AGE: ${child.age ?? "not provided"}
DIFFICULTY: ${difficulty}
LEARNING NEEDS: ${child.learningNeeds.join(", ") || "none specified"}

Return the JSON object now.
`.trim();

  return { system, user, version: WORKSHEET_PROMPT_VERSION };
}
