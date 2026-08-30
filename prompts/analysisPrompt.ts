import {
  NINE_SECTION_OUTPUT_SCHEMA,
  SYSTEM_PROMPT,
  childContext,
  recentFeedbackContext,
  roleContext,
  expectationContext,
  achievementContext,
  planGradeContext,
  worksheetLevelsContext,
  extrasContext,
  continuityContext,
  progressionContext,
  type PreviousSession,
  type RecentFeedbackEntry,
} from "@/lib/prompts";
import type { AchievementLevel, Child, Role, Subject } from "@/types/child";
import type { ExtraKind } from "@/types/session";

export const ANALYSIS_PROMPT_VERSION = "analysis@2026-08-30.8";

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
  /** Aim the plan at this grade instead of the profile's, when they differ. */
  planGrade?: string | null;
  /** Where the learner sits on Ontario's achievement chart, if stated. */
  achievementLevel?: AchievementLevel | null;
  /** For a class: how many students sit at each level. */
  achievementSpread?: Partial<Record<AchievementLevel, number>> | null;
  /** Levels that each get their own worksheet. Empty means one worksheet. */
  worksheetLevels?: AchievementLevel[];
  /** Extra materials the adult ticked. Empty means none — never volunteered. */
  extras?: ExtraKind[];
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
    planGrade = null,
    achievementLevel = null,
    achievementSpread = null,
    worksheetLevels = [],
    extras = [],
    previous = null,
    progression = null,
    recentFeedback = [],
  } = args;
  const feedbackBlock = recentFeedbackContext(recentFeedback);
  const roleBlock = roleContext(role);
  const expectationBlock = expectationContext(expectation);
  const planGradeBlock = planGradeContext(planGrade, child.grade);
  const achievementBlock = achievementContext(achievementLevel, achievementSpread);
  const levelsBlock = worksheetLevelsContext(worksheetLevels, achievementSpread);
  const extrasBlock = extrasContext(extras);
  const continuityBlock = continuityContext(previous);
  const progressionBlock = progression
    ? progressionContext(progression.current, progression.next)
    : "";

  // No described concern: she picked the expectation instead. The task is
  // to teach it, not to diagnose — and section 1 must report rather than
  // imagine, because there is a real child on the other end of it.
  const taught = parentInput.trim().length === 0;

  const task = taught
    ? `TASK
The adult has not described a problem. They have chosen what to teach.
Design ONE session for the target expectation named below.

WHAT I NOTICE must report ONLY what you were actually given: what the
profile says is already secure, where it breaks down, the stated goal, the
achievement level, and the last session if there was one. If the profile
says little, say so plainly — "You haven't told us much about them yet, so
this plan starts from the curriculum" — and move on. NEVER invent an
observation, a struggle, a behaviour, or a classroom moment you were not
told about. A made-up noticing about a real child is worse than a short one.

Everything else is unchanged: the specific underlying skills, the top 3 to
teach next, and a single short worksheet.`
    : `TASK
Analyze what is going on with this child and design ONE session they can do
today. Identify the SPECIFIC underlying skills, choose the top 3 to teach
next (in priority order), and write a single short worksheet. Difficulty
must match the child's current level — start easier than the adult's
baseline assumption if there are signs of struggle.`;

  const taskAddendum = `
${task}
${roleBlock ? `\n${roleBlock}\n` : ""}${expectationBlock ? `\n${expectationBlock}\n` : ""}${planGradeBlock ? `\n${planGradeBlock}\n` : ""}${achievementBlock ? `\n${achievementBlock}\n` : ""}${levelsBlock ? `\n${levelsBlock}\n` : ""}${extrasBlock ? `\n${extrasBlock}\n` : ""}${continuityBlock ? `\n${continuityBlock}\n` : ""}${progressionBlock ? `\n${progressionBlock}\n` : ""}
OUTPUT FORMAT
${NINE_SECTION_OUTPUT_SCHEMA}
`.trim();

  const system = `${SYSTEM_PROMPT}\n\n---\n\n${taskAddendum}`;

  const user = `
CHILD PROFILE
${childContext(child)}

SUBJECT: ${subject}
${feedbackBlock ? `\n${feedbackBlock}\n` : ""}${
    taught
      ? "The adult described no concern. Teach the expectation above."
      : `PARENT / TEACHER INPUT\n"""\n${parentInput}\n"""`
  }

Return the JSON object now. No prose outside JSON, no markdown fences.
`.trim();

  return { system, user, version: ANALYSIS_PROMPT_VERSION };
}
