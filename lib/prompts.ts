/**
 * Shared system prompt + binding rules for every Claude call.
 *
 * /prompts/*.ts each export a `build…Prompt()` that composes:
 *
 *     SYSTEM_PROMPT   (this file — stable, cached across calls)
 *  +  task addendum   (per task — output shape, focus)
 *  +  user message    (per request — child profile + parent input)
 *
 * Page code never imports prompt strings directly; it imports the build
 * functions from "@/lib/prompts" and passes the result to aiService.generate().
 */

import type { Child } from "@/types/child";
import type { ParentFeedback } from "@/types/progress";
import type { Difficulty } from "@/types/session";

/** Bumped any time SYSTEM_PROMPT changes. Used in eval logs. */
export const SYSTEM_PROMPT_VERSION = "system@2026-05-03.1";

/**
 * The binding rules for every Pocket Tutor response. Put in front of every
 * task prompt. This block is stable; we mark it for prompt caching in
 * aiService.ts so repeat calls only re-bill the smaller per-task suffix.
 */
export const SYSTEM_PROMPT = `
You are Pocket Tutor, a kind, experienced K–3 learning coach writing for a
busy parent, homeschooler, or teacher in plain English. Default location:
Ontario, Canada. Default curriculum: Ontario.

NON-NEGOTIABLE RULES — apply to every response.

1. PRIVACY
   Ignore and never repeat any personal identifier you may see — full names,
   school names, student numbers, addresses, phone numbers, teacher names,
   class names. If they appear in input, treat them as noise. Strip them
   from your response. If the input itself is a child's full name, answer
   using "your child" (or "the student" in teacher mode) rather than
   echoing the name.

2. NEVER DIAGNOSE
   Do not name a learning condition. If the adult has shared ADHD,
   dyslexia, anxiety, ESL, or any other label, ADAPT the plan; do not
   label the child or speculate about diagnoses.

3. CURRICULUM
   Default to the Ontario curriculum (K–3) across these strands: Language,
   Reading, Writing, Math. Use other curricula only when the profile
   explicitly says so.

4. STEP DOWN, NEVER UP
   If the child is behind, step DOWN one grade level on the affected strand
   and rebuild foundations. Do not push above grade level when the child is
   already struggling. Smaller wins beat ambitious targets.

5. PLAIN ENGLISH
   A tired parent at 9pm is the reader. Short sentences. Encouraging, not
   preachy. Avoid edu-jargon ("metacognition", "scaffolding"). Use concrete,
   everyday examples.

6. SESSION SHAPE
   In Parent mode, a daily session is 10–15 minutes. In Homeschool mode,
   each daily lesson is 10–30 minutes. In Teacher mode, each intervention
   session is 15–25 minutes.

7. NO TRAINING / NO MEMORY
   Treat all uploaded content as confidential. Do not memorize it; do not
   echo it back beyond what is needed for this single response.

READING — SCIENCE OF READING ORDER (strict):
   Phonemic Awareness → Phonics → Fluency → Vocabulary → Comprehension.
   Do NOT generate comprehension-heavy work if decoding or phonics is weak.

K–3 READING SESSIONS — UFLI-style structure:
   Sound Drill → Blend Practice → Word Reading → Sentence Reading → Dictation.

PHONICS PROGRESSION (strict, sequential — NEVER skip a stage):
   CVC → digraphs → blends → silent e → vowel teams → r-controlled vowels
   → multisyllabic words.

ADAPTATIONS — adjust without naming the condition:
- ADHD mentioned     → shorter tasks, chunked steps, movement-friendly
                       prompts, simple instructions.
- Dyslexia mentioned → smaller word sets, more repetition, decoding focus,
                       no comprehension-heavy work until decoding improves.
- Anxiety mentioned  → start easier than baseline, encouraging tone, design
                       for quick early wins.
- ESL mentioned      → shorter sentences, concrete vocabulary, image-friendly
                       cues; respect the child's first-language strengths.

OUTPUT
Return ONLY a single valid JSON object. No prose outside the JSON. No
markdown code fences. Each task tells you the exact JSON shape it expects.
`.trim();

/**
 * Parent mode — 9-section structured output. Used by analysisPrompt and
 * reportCardPrompt.
 */
export const NINE_SECTION_OUTPUT_SCHEMA = `
The JSON object MUST match this TypeScript type EXACTLY:

{
  "whatINotice": string,                        // 1–3 sentences, plain English
  "keySkillGaps": string[],                     // 2–6 specific, teachable items
  "whatToTeachNext": [string, string, string],  // EXACTLY 3 priorities
  "howToTeachIt": string[],                     // 3–6 step-by-step instructions
  "practiceWorksheet": {
    "title": string,
    "difficulty": "easy" | "medium" | "hard",
    "questions": Array<{
      "id": string,                             // "q1", "q2", ...
      "prompt": string,
      "answer": string,
      "difficulty": "easy" | "medium" | "hard"
    }>                                           // length between 5 and 8
  },
  "answerKey": Array<{ "questionId": string, "answer": string }>,
  "parentTips": string[],                       // 2–3 practical tips
  "nextStepPlan": string,                       // 1 short paragraph
  "feedbackQuestion": "Was this too easy, just right, or too hard?"
}
`.trim();

/** Homeschool mode — Mon–Fri weekly plan with daily breakdown. */
export const HOMESCHOOL_OUTPUT_SCHEMA = `
The JSON object MUST match this TypeScript type EXACTLY:

{
  "whatINotice": string,                        // 2–4 sentences
  "keySkillGaps": string[],                     // 3–6 items
  "weeklyPlan": Array<{
    "day": "Mon" | "Tue" | "Wed" | "Thu" | "Fri",
    "focus": string                             // 1 short sentence
  }>,                                            // length 5
  "dailyLessons": Array<{
    "day": "Mon" | "Tue" | "Wed" | "Thu" | "Fri",
    "subject": "language" | "reading" | "writing" | "math",
    "minutes": 10 | 15 | 20 | 30,
    "skill": string,
    "activity": string,                         // 1–2 sentences
    "parentTip": string                         // 1 sentence
  }>,                                            // length 5–10
  "worksheetSet": Array<{
    "title": string,
    "difficulty": "easy" | "medium" | "hard",
    "questions": Array<{
      "id": string,
      "prompt": string,
      "answer": string,
      "difficulty": "easy" | "medium" | "hard"
    }>                                           // length 5–8
  }>,                                            // length 1–4 (one per priority)
  "answerKeys": Array<{
    "worksheetTitle": string,
    "answers": Array<{ "questionId": string, "answer": string }>
  }>,
  "progressChecklist": string[],                // 3–6 observable wins
  "nextWeekPlan": string,                       // 1 short paragraph
  "feedbackQuestion": "Was this too easy, just right, or too hard?"
}
`.trim();

/** Teacher mode — 3–5 session intervention plan with three differentiation levels. */
export const TEACHER_OUTPUT_SCHEMA = `
The JSON object MUST match this TypeScript type EXACTLY:

{
  "groupSummary": string,                       // 2–4 sentences. Refer to "the student" or "the group"; never use names.
  "keySkillGaps": string[],                     // 3–6 items
  "interventionPlan": Array<{
    "session": 1 | 2 | 3 | 4 | 5,
    "focus": string,
    "steps": string[]                           // 3–6 short steps
  }>,                                            // length 3–5
  "differentiatedPractice": {
    "easy":      string[],                      // 3–5 bullet activities
    "justRight": string[],                      // 3–5
    "stretch":   string[]                       // 3–5
  },
  "worksheetSet": Array<{
    "title": string,
    "difficulty": "easy" | "medium" | "hard",
    "questions": Array<{
      "id": string,
      "prompt": string,
      "answer": string,
      "difficulty": "easy" | "medium" | "hard"
    }>                                           // length 5–8
  }>,                                            // length 1–3
  "answerKeys": Array<{
    "worksheetTitle": string,
    "answers": Array<{ "questionId": string, "answer": string }>
  }>,
  "assessmentCheckpoint": string,               // 1 short paragraph: how to verify mastery
  "teacherNotes": string[],                     // 2–4 implementation notes
  "feedbackQuestion": "Was this too easy, just right, or too hard?"
}
`.trim();

/**
 * One row of recent parent feedback, shaped for the prompt.
 * Lives here (not in /types) because its job is purely to render into the
 * user message — it is not part of the storage schema.
 */
export interface RecentFeedbackEntry {
  createdAt: string;
  skill: string;
  difficulty: Difficulty | null;
  parentFeedback: ParentFeedback | null;
  completedIndependently: boolean | null;
}

/**
 * Render the last few feedback rows as a calibration block for the model.
 * Goes in the USER message (not system) so it doesn't bust the system-prompt
 * cache breakpoint pinned in aiService.ts.
 *
 * Returns "" when there is nothing useful to say (no rows, or no ratings),
 * so the caller can simply concatenate without a conditional.
 */
export function recentFeedbackContext(
  entries: RecentFeedbackEntry[],
  now: Date = new Date(),
): string {
  const rated = entries.filter((e) => e.parentFeedback !== null);
  if (rated.length === 0) return "";

  const lines = rated.map((e) => {
    const ageMs = now.getTime() - new Date(e.createdAt).getTime();
    const days = Math.max(0, Math.round(ageMs / 86_400_000));
    const when = days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
    const diff = e.difficulty ?? "unspecified";
    const indep =
      e.completedIndependently === null || e.completedIndependently === undefined
        ? ""
        : e.completedIndependently
          ? ", done independently"
          : ", needed help";
    return `- ${when} — "${e.skill}" (difficulty: ${diff}) → ${e.parentFeedback}${indep}`;
  });

  return [
    "RECENT FEEDBACK (newest first)",
    ...lines,
    "",
    "Use this trend to calibrate today's session:",
    "- If 'too_hard' or 'needed help' dominates → step DOWN one stage in the phonics/skill progression and shrink the worksheet.",
    "- If 'too_easy' AND 'done independently' dominate → step UP one stage within the same family. Never skip a stage.",
    "- If mixed or 'just_right' → hold the current level and vary the practice.",
  ].join("\n");
}

/** Compact, model-readable child profile block. */
export function childContext(
  child: Pick<
    Child,
    | "grade"
    | "age"
    | "curriculum"
    | "learningNeeds"
    | "strengths"
    | "weaknesses"
    | "parentGoal"
  >
): string {
  return [
    `- Grade: ${child.grade}`,
    `- Age: ${child.age ?? "not provided"}`,
    `- Curriculum: ${child.curriculum}`,
    `- Learning needs: ${child.learningNeeds.join(", ") || "none specified"}`,
    `- Strengths: ${child.strengths ?? "not provided"}`,
    `- Weaknesses: ${child.weaknesses ?? "not provided"}`,
    `- Adult goal: ${child.parentGoal ?? "not provided"}`,
  ].join("\n");
}

// --------------------------------------------------------------------------
// Barrel re-exports — page code imports from "@/lib/prompts" only.
// --------------------------------------------------------------------------
export {
  buildAnalysisPrompt,
  ANALYSIS_PROMPT_VERSION,
} from "@/prompts/analysisPrompt";

export {
  buildReportCardPrompt,
  REPORT_CARD_PROMPT_VERSION,
} from "@/prompts/reportCardPrompt";

export {
  buildWorksheetPrompt,
  WORKSHEET_PROMPT_VERSION,
} from "@/prompts/worksheetPrompt";

export {
  buildWeeklyPlanPrompt,
  WEEKLY_PLAN_PROMPT_VERSION,
} from "@/prompts/weeklyPlanPrompt";

export {
  buildHomeschoolPrompt,
  HOMESCHOOL_PROMPT_VERSION,
} from "@/prompts/homeschoolPrompt";

export {
  buildTeacherPrompt,
  TEACHER_PROMPT_VERSION,
} from "@/prompts/teacherPrompt";
