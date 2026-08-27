import {
  NINE_SECTION_OUTPUT_SCHEMA,
  SYSTEM_PROMPT,
  childContext,
  recentFeedbackContext,
  roleContext,
  expectationContext,
  continuityContext,
  progressionContext,
  type PreviousSession,
  type RecentFeedbackEntry,
} from "@/lib/prompts";
import type { Child, Role, Subject } from "@/types/child";

export const ANALYSIS_PROMPT_VERSION = "analysis@2026-08-27.2";

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
  role?: Role | null;
  expectation?: {
    code: string;
    text: string;
    strandCode: string;
    strandName: string;
  } | null;
  /** The last session for this child, so this one continues it. */
  previous?: PreviousSession | null;
  /** Ontario's published progression at this grade, and the rung above. */
  progression?: {
    current: { section: string; label: string; text: string }[];
    next: { section: string; label: string; text: string }[];
  } | null;
  recentFeedback?: RecentFeedbackEntry[];
}): { system: string; user: string; version: string } {
  const {
    child,
    subject,
    parentInput,
    role = null,
    expectation = null,
    previous = null,
    progression = null,
    recentFeedback = [],
  } = args;
  const feedbackBlock = recentFeedbackContext(recentFeedback);
  const roleBlock = roleContext(role);
  const expectationBlock = expectationContext(expectation);
  const continuityBlock = continuityContext(previous);
  const progressionBlock = progression
    ? progressionContext(progression.current, progression.next)
    : "";

  const taskAddendum = `
TASK
Analyze what is going on with this child and design ONE session they can do
today. Identify the SPECIFIC underlying skills, choose the top 3 to teach
next (in priority order), and write a single short worksheet. Difficulty
must match the child's current level — start easier than the adult's
baseline assumption if there are signs of struggle.
${roleBlock ? `\n${roleBlock}\n` : ""}${expectationBlock ? `\n${expectationBlock}\n` : ""}${continuityBlock ? `\n${continuityBlock}\n` : ""}${progressionBlock ? `\n${progressionBlock}\n` : ""}
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
