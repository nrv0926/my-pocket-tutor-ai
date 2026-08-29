import {
  NINE_SECTION_OUTPUT_SCHEMA,
  SYSTEM_PROMPT,
  childContext,
  recentFeedbackContext,
  roleContext,
  type RecentFeedbackEntry,
} from "@/lib/prompts";
import type { Child, Role } from "@/types/child";

export const REPORT_CARD_PROMPT_VERSION = "report-card@2026-08-29.2";

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
  /** The pasted comment. Empty when the card is attached instead. */
  reportText: string;
  /**
   * The card arrived as a file the model reads itself. Say so rather than
   * quoting an empty block, and tell it to use only what the document
   * actually says.
   */
  attached?: boolean;
  role?: Role | null;
  recentFeedback?: RecentFeedbackEntry[];
}): { system: string; user: string; version: string } {
  const { child, reportText, attached = false, role = null, recentFeedback = [] } = args;
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
${
    attached
      ? `REPORT CARD (attached)
Read the attached document. Work only from what it actually says: quote or
paraphrase its own wording, and never invent a comment, a mark, or a strand
it does not contain. If part of it is unreadable, say which part rather than
guessing at it.`
      : `REPORT CARD COMMENT
"""
${reportText}
"""`
  }

Return the JSON object now. No prose outside JSON, no markdown fences.
`.trim();

  return { system, user, version: REPORT_CARD_PROMPT_VERSION };
}
