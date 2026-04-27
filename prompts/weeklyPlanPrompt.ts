import { SYSTEM_PROMPT, childContext } from "@/lib/prompts";
import type { Child } from "@/types/child";

export const WEEKLY_PLAN_PROMPT_VERSION = "weekly-plan@2026-04-27.2";

/**
 * Builds a 4-week learning plan from the child profile + their most recent
 * skill gaps. Each week has 5 short sessions of 10–15 minutes.
 */
export function buildWeeklyPlanPrompt(args: {
  child: Pick<
    Child,
    | "grade"
    | "age"
    | "curriculum"
    | "learningNeeds"
    | "strengths"
    | "weaknesses"
    | "parentGoal"
  >;
  topSkillGaps: string[];
}): { system: string; user: string; version: string } {
  const { child, topSkillGaps } = args;

  const taskAddendum = `
TASK
Design a 4-week learning plan for this child. Each week has 5 sessions; each
session is 10–15 minutes. Friday of each week is a short "celebration day" —
review what stuck plus one tiny win.

Rules specific to this task:
- Start with the EASIEST gap and build forward.
- For reading, stay inside the science-of-reading order
  (PA → Phonics → Fluency → Vocabulary → Comprehension).
- Phonics progression is sequential — never skip a stage.
- Repeat skills across days for retention; allow only small variations.
- Do NOT increase homework volume week over week.

OUTPUT FORMAT
The JSON object MUST match this TypeScript type EXACTLY:

{
  "weeks": [
    {
      "week": 1 | 2 | 3 | 4,
      "focus": string,                                 // e.g. "Decoding short-vowel words"
      "sessions": Array<{
        "day": "Mon" | "Tue" | "Wed" | "Thu" | "Fri",
        "minutes": 10 | 15,
        "skill": string,
        "activity": string,                            // 1 short sentence
        "parentTip": string                            // 1 short sentence
      }>                                                // length 5
    }
  ]                                                    // length 4
}
`.trim();

  const system = `${SYSTEM_PROMPT}\n\n---\n\n${taskAddendum}`;

  const user = `
CHILD PROFILE
${childContext(child)}

TOP SKILL GAPS (in priority order):
${topSkillGaps.map((g, i) => `${i + 1}. ${g}`).join("\n")}

Return the JSON object now. No prose outside JSON, no markdown fences.
`.trim();

  return { system, user, version: WEEKLY_PLAN_PROMPT_VERSION };
}
