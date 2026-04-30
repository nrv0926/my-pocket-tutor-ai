import {
  NINE_SECTION_OUTPUT_SCHEMA,
  SYSTEM_PROMPT,
  childContext,
  recentFeedbackContext,
  type RecentFeedbackEntry,
} from "@/lib/prompts";
import type { Child, Subject } from "@/types/child";

export const ANALYSIS_PROMPT_VERSION = "analysis@2026-04-30.1";

/**
 * Main analysis: parent input → 9-section structured plan + worksheet.
 */
export function buildAnalysisPrompt(args: {
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
  subject: Subject;
  parentInput: string;
  recentFeedback?: RecentFeedbackEntry[];
}): { system: string; user: string; version: string } {
  const { child, subject, parentInput, recentFeedback = [] } = args;
  const feedbackBlock = recentFeedbackContext(recentFeedback);

  const taskAddendum = `
TASK
Analyze what is going on with this child and design ONE 10–15 minute session
they can do tonight. Identify the SPECIFIC underlying skills, choose the top
3 to teach next (in priority order), and write a single short worksheet.
Difficulty must match the child's current level — start easier than the
parent's baseline assumption if there are signs of struggle.

OUTPUT FORMAT
${NINE_SECTION_OUTPUT_SCHEMA}
`.trim();

  const system = `${SYSTEM_PROMPT}\n\n---\n\n${taskAddendum}`;

  const user = `
CHILD PROFILE
${childContext(child)}

SUBJECT: ${subject}
${feedbackBlock ? `\n${feedbackBlock}\n` : ""}
PARENT / TEACHER INPUT
"""
${parentInput}
"""

Return the JSON object now. No prose outside JSON, no markdown fences.
`.trim();

  return { system, user, version: ANALYSIS_PROMPT_VERSION };
}
