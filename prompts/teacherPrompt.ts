import {
  SYSTEM_PROMPT,
  TEACHER_OUTPUT_SCHEMA,
  childContext,
  recentFeedbackContext,
  type RecentFeedbackEntry,
} from "@/lib/prompts";
import type { Child, Subject } from "@/types/child";
import type { SessionInputType } from "@/types/session";

export const TEACHER_PROMPT_VERSION = "teacher@2026-05-03.1";

export function buildTeacherPrompt(args: {
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
      ? "The input below is a teacher's own observation note or a report comment. Translate it into a small-group intervention; ignore school/teacher names."
      : "The input below is the teacher's description of what they're seeing in class.";

  const taskAddendum = `
TASK
Design a 3–5 session targeted intervention for one student or a small group
(2–6 students) at this grade level. Each session is 15–25 minutes. Provide
three differentiation levels (easy / just right / stretch) so the teacher
can run a mixed group from the same plan.

Rules specific to teacher mode:
- Refer to "the student" or "the group". Never invent or echo a name.
- Phase the sessions so each one builds on the last.
- The "stretch" level must stay within the strand — do not jump grades.
- The assessment checkpoint should be observable in 5 minutes or less.
- Worksheet questions are classroom-ready (no household examples like
  "ask your dad").
- ${sourceNote}

OUTPUT FORMAT
${TEACHER_OUTPUT_SCHEMA}
`.trim();

  const system = `${SYSTEM_PROMPT}\n\n---\n\n${taskAddendum}`;

  const user = `
TARGET STUDENT / GROUP PROFILE (use as the baseline level)
${childContext(child)}

PRIMARY SUBJECT FOCUS: ${subject}
${feedbackBlock ? `\n${feedbackBlock}\n` : ""}
TEACHER INPUT
"""
${inputText}
"""

Return the JSON object now. No prose outside JSON, no markdown fences.
`.trim();

  return { system, user, version: TEACHER_PROMPT_VERSION };
}
