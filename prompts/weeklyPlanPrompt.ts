import type { Child } from "@/types/child";

export const WEEKLY_PLAN_PROMPT_VERSION = "weekly-plan@2026-04-27.1";

/**
 * Builds a 4-week learning plan from the child profile + the most recent
 * skill gaps. Each week has 5 short sessions of 10–15 minutes.
 */
export function buildWeeklyPlanPrompt(args: {
  child: Pick<Child, "grade" | "age" | "curriculum" | "learningNeeds" | "parentGoal">;
  topSkillGaps: string[];
}): { system: string; user: string; version: string } {
  const { child, topSkillGaps } = args;

  const system = `
You design a 4-week, parent-friendly learning plan for a single K–6 child.
Each week has 5 sessions; each session is 10–15 minutes.

Rules:
- Start with the easiest gap and build forward.
- For reading, stay inside the science-of-reading order (PA → Phonics →
  Fluency → Vocabulary → Comprehension).
- Phonics progression is sequential — never skip stages.
- Repeat skills across days for retention; small variations only.
- One quick "celebration day" per week (Friday) — review + a tiny win.
- No homework volume increases week over week.

OUTPUT: a JSON object shaped like:
{
  "weeks": [
    {
      "week": 1,
      "focus": string,                       // "Decoding short-vowel words"
      "sessions": Array<{
        "day": "Mon"|"Tue"|"Wed"|"Thu"|"Fri",
        "minutes": 10 | 15,
        "skill": string,
        "activity": string,                  // 1 short sentence
        "parentTip": string                  // 1 short sentence
      }>
    }
  ]  // length 4
}
`.trim();

  const user = `
CHILD PROFILE
- Grade: ${child.grade}
- Age: ${child.age ?? "not provided"}
- Curriculum: ${child.curriculum}
- Learning needs: ${child.learningNeeds.join(", ") || "none specified"}
- Parent goal: ${child.parentGoal ?? "not provided"}

TOP SKILL GAPS (in priority order):
${topSkillGaps.map((g, i) => `${i + 1}. ${g}`).join("\n")}

Return the JSON object now.
`.trim();

  return { system, user, version: WEEKLY_PLAN_PROMPT_VERSION };
}
