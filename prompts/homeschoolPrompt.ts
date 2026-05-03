import {
  HOMESCHOOL_OUTPUT_SCHEMA,
  SYSTEM_PROMPT,
  childContext,
  recentFeedbackContext,
  type RecentFeedbackEntry,
} from "@/lib/prompts";
import type { Child, Subject } from "@/types/child";
import type { SessionInputType } from "@/types/session";

export const HOMESCHOOL_PROMPT_VERSION = "homeschool@2026-05-03.1";

export function buildHomeschoolPrompt(args: {
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
  inputType: SessionInputType;
  inputText: string;
  recentFeedback?: RecentFeedbackEntry[];
}): { system: string; user: string; version: string } {
  const { child, subject, inputType, inputText, recentFeedback = [] } = args;
  const feedbackBlock = recentFeedbackContext(recentFeedback);

  const sourceNote =
    inputType === "paste"
      ? "The input below is a school report card or teacher note. Translate it into concrete homeschool work; ignore school/teacher names."
      : "The input below is a homeschool parent's description of how the week is going.";

  const taskAddendum = `
TASK
Design a full Mon–Fri homeschool week for this child. Each day has 1–2
focused lessons of 10–30 minutes that build on each other. Friday's lesson
includes a short check of what stuck.

Rules specific to homeschool mode:
- Start with the EASIEST gap and build forward across the week.
- Repeat target skills across at least 3 days for retention.
- Generate ONE worksheet per priority skill (1–4 worksheets total).
- Keep the workload roughly constant across the week — do not pile up
  Friday.
- ${sourceNote}

OUTPUT FORMAT
${HOMESCHOOL_OUTPUT_SCHEMA}
`.trim();

  const system = `${SYSTEM_PROMPT}\n\n---\n\n${taskAddendum}`;

  const user = `
CHILD PROFILE
${childContext(child)}

PRIMARY SUBJECT FOCUS: ${subject}
${feedbackBlock ? `\n${feedbackBlock}\n` : ""}
HOMESCHOOL PARENT INPUT
"""
${inputText}
"""

Return the JSON object now. No prose outside JSON, no markdown fences.
`.trim();

  return { system, user, version: HOMESCHOOL_PROMPT_VERSION };
}
