import {
  NINE_SECTION_OUTPUT_SCHEMA,
  SYSTEM_PROMPT,
  childContext,
  recentFeedbackContext,
  roleContext,
  type RecentFeedbackEntry,
} from "@/lib/prompts";
import type { Child, Role } from "@/types/child";

export const REPORT_CARD_PROMPT_VERSION = "report-card@2026-05-03.1";

/**
 * Specialised analysis for a school report card comment / teacher note.
 * Returns the same nine-section structure as the main analysis prompt.
 */
export function buildReportCardPrompt(args: {
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
  reportText: string;
  role?: Role | null;
  recentFeedback?: RecentFeedbackEntry[];
}): { system: string; user: string; version: string } {
  const { child, reportText, role = null, recentFeedback = [] } = args;
  const feedbackBlock = recentFeedbackContext(recentFeedback);
  const roleBlock = roleContext(role);

  const taskAddendum = `
TASK
Translate this school report card comment (or teacher note) into a concrete,
kind plan a reader can act on today.

- Decode the SPECIFIC skills the comment is hinting at — teachers often
  write softly. Your job is to interpret without judgement of the teacher
  or the child.
- Map those skills to the Ontario curriculum for the child's grade.
- If the comment suggests the child is behind, step DOWN one grade on the
  affected strand and rebuild before pushing forward.
- Strip and ignore the school name, teacher name, and any student
  identifier in the report text. Never repeat them.
${roleBlock ? `\n${roleBlock}\n` : ""}
OUTPUT FORMAT
${NINE_SECTION_OUTPUT_SCHEMA}
`.trim();

  const system = `${SYSTEM_PROMPT}\n\n---\n\n${taskAddendum}`;

  const user = `
CHILD PROFILE
${childContext(child)}
${feedbackBlock ? `\n${feedbackBlock}\n` : ""}
REPORT CARD COMMENT
"""
${reportText}
"""

Return the JSON object now. No prose outside JSON, no markdown fences.
`.trim();

  return { system, user, version: REPORT_CARD_PROMPT_VERSION };
}
