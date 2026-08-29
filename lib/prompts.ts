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

import type { AchievementLevel, Child, Role } from "@/types/child";
import type { ParentFeedback } from "@/types/progress";
import type { Difficulty } from "@/types/session";

/** Bumped any time SYSTEM_PROMPT changes. Used in eval logs. */
export const SYSTEM_PROMPT_VERSION = "system@2026-04-27.1";

/**
 * The binding rules for every AI Pocket Tutor response. Put in front of every
 * task prompt. This block is stable; we mark it for prompt caching in
 * aiService.ts so repeat calls only re-bill the smaller per-task suffix.
 */
export const SYSTEM_PROMPT = `
You are AI Pocket Tutor, a kind, experienced K–6 learning coach writing for
a busy parent or teacher in plain English. Default location: Ontario, Canada.
Default curriculum: Ontario.

NON-NEGOTIABLE RULES — apply to every response.

1. PRIVACY
   Ignore and never repeat any personal identifier you may see — full names,
   school names, student numbers, addresses, phone numbers, teacher names,
   class names. If they appear in input, treat them as noise. Strip them
   from your response. If a parent's input is itself a child's full name,
   answer using "your child" rather than echoing the name.

2. NEVER DIAGNOSE
   Do not name a learning condition. If the parent has shared ADHD,
   dyslexia, anxiety, ESL, or any other label, ADAPT the plan; do not
   label the child or speculate about diagnoses.

3. CURRICULUM
   Default to the Ontario curriculum (K–6) across these strands: Language,
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
   Every plan is sized for a 10–15 minute session. Always.

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
 * The fixed nine-section output schema used by analysis + report-card tasks.
 * Worksheet and weekly-plan tasks have their own (smaller) schemas.
 */
export const NINE_SECTION_OUTPUT_SCHEMA = `
DIFFERENTIATE WHEN THERE IS A RANGE TO DIFFERENTIATE FOR.
Include "differentiation" when the reader is a teacher or a homeschooler
with more than one learner: one lesson, run three ways — the whole group,
the child who is behind, and whoever finishes early. Each track must be
runnable in the same room at the same time, and needsSupport must be a
SMALLER STEP of the same skill, never a different lesson and never busywork.
Omit the field entirely for a parent teaching one child, who has nobody to
differentiate between.

ONE LESSON, SEVERAL WORKSHEETS.
Include "worksheetVariants" only when the levels to write for are named
below, and then write one variant per level named — no more, no fewer. Every
variant practises THE SAME SKILL as the main worksheet; a lower level gets a
smaller step of it, never a different topic and never colouring. Keep the
question count and the shape the same so the room looks like one class doing
one thing. Question ids must be unique across every variant, because the
answer keys are read together.

PRODUCE THE MATERIALS, DO NOT DESCRIBE THEM.
If a step says to write six cards, put the six words in teachingMaterials.
If it says to read five sentences, write the five sentences. The reader has
no prep time: anything they would otherwise have to make first must arrive
already made. Never write "choose some words" or "pick a short passage" —
choose them, and list them. Every material must be usable as printed, and
every item must fit the child's current level, not the grade average.

The JSON object MUST match this TypeScript type EXACTLY:

{
  "whatINotice": string,                        // 1–3 sentences, plain English
  "keySkillGaps": string[],                     // 2–6 specific, teachable items
  "whatToTeachNext": [string, string, string],  // EXACTLY 3 priorities
  "howToTeachIt": string[],                     // 3–6 step-by-step instructions
  "teachingMaterials": Array<{                  // the materials those steps call for
    "label": string,                            // e.g. "Sound drill cards"
    "kind": "cards" | "wordList" | "sentences" | "script",
    "step": number,                             // 1-based index into howToTeachIt
    "note": string,                             // one line on how to use it
    "items": string[]                           // the actual cards / words / sentences
  }>,                                            // omit ONLY if no material is needed
  "differentiation": {                          // one lesson, three tracks
    "wholeGroup": string,                       // the core lesson as written
    "needsSupport": string,                     // smaller step for the child who is behind
    "readyForMore": string,                     // extension for anyone already secure
    "watchFor": string                          // the signal a child is in the wrong track
  },                                             // TEACHERS AND HOMESCHOOLERS ONLY
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
  "worksheetVariants": Array<{                  // ONLY when levels are named below
    "level": "1" | "2" | "3" | "4",
    "worksheet": {                              // same shape as practiceWorksheet
      "title": string,
      "difficulty": "easy" | "medium" | "hard",
      "questions": Array<{
        "id": string,                           // unique ACROSS variants: "L2q1", ...
        "prompt": string,
        "answer": string,
        "difficulty": "easy" | "medium" | "hard"
      }>                                         // length between 5 and 8
    },
    "answerKey": Array<{ "questionId": string, "answer": string }>
  }>,
  "parentTips": string[],                       // 2–3 practical tips
  "nextStepPlan": string,                       // 1 short paragraph
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
    "RECENT PARENT FEEDBACK (newest first)",
    ...lines,
    "",
    "Use this trend to calibrate today's session:",
    "- If 'too_hard' or 'needed help' dominates → step DOWN one stage in the phonics/skill progression and shrink the worksheet.",
    "- If 'too_easy' AND 'done independently' dominate → step UP one stage within the same family. Never skip a stage.",
    "- If mixed or 'just_right' → hold the current level and vary the practice.",
  ].join("\n");
}

/**
 * Per-role TASK-block addendum. Lets each prompt resize the session and tune
 * the tone for a parent at the kitchen table, a homeschooling parent running
 * the curriculum, or a classroom teacher running a small-group rotation.
 *
 * Returns "" when role is null so the caller can simply concatenate.
 */
export function roleContext(role: Role | null): string {
  if (!role) return "";
  if (role === "parent") {
    return [
      "READER ROLE: parent of a school-going child.",
      "- Size the session for 10–15 minutes at the kitchen table.",
      "- Plain, encouraging tone. Do not assume teacher vocabulary.",
      "- Worksheet should be short and low-stakes (after-school energy).",
    ].join("\n");
  }
  if (role === "homeschooler") {
    return [
      "READER ROLE: homeschooling parent running the curriculum.",
      "- Write a fuller mini-lesson: model → guided practice → independent practice.",
      "- It is OK for the session to run 20–30 minutes.",
      "- Worksheet may be longer and serve as the day's main practice.",
      "- Reference scope-and-sequence position explicitly (e.g. 'phonics: vowel teams').",
    ].join("\n");
  }
  // teacher
  return [
    "READER ROLE: classroom teacher addressing one student or a small group.",
    "- Size the mini-lesson for ~10 minutes during a small-group rotation.",
    "- Name the misconception precisely and the most common error to watch for.",
    "- Worksheet should be classroom-ready: differentiated Easy / Medium / Hard, usable as an exit ticket.",
    "- Speak teacher-to-teacher; you can use grade-band terminology.",
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
    `- Parent goal: ${child.parentGoal ?? "not provided"}`,
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

/**
 * Anchor the plan to one published Ontario expectation.
 *
 * The wording is passed in already resolved from the transcribed curriculum
 * (lib/curriculum.ts) — the model is never asked to recall a code, because a
 * plausible-but-wrong B1.3 is exactly what a teacher will catch and exactly
 * what CLAUDE.md §6 forbids.
 */
export function expectationContext(
  expectation: { code: string; text: string; strandCode: string; strandName: string } | null
): string {
  if (!expectation) return "";
  return [
    "TARGET CURRICULUM EXPECTATION (Ontario, chosen by the adult):",
    `- Strand ${expectation.strandCode}: ${expectation.strandName}`,
    `- ${expectation.code}: ${expectation.text}`,
    "Aim the session at THIS expectation. Say the code once in WHAT TO TEACH",
    "NEXT so the adult can see the link. Quote the code and wording exactly as",
    "given above — do not reword it, and never cite any other code.",
    "If the child is not ready for it, work the prerequisite skill instead and",
    "say plainly which one and why.",
  ].join("\n");
}

/**
 * Say out loud that the plan is aimed at a grade other than the profile's.
 *
 * A teacher steps down deliberately — the reading group that is two years
 * behind is the reason she wants a Grade 1 expectation for a Grade 3 class.
 * The plan has to name that, because the alternative is a document that
 * looks like a filing error to whoever reads it next, including her in
 * September. Stepping down is house policy (CLAUDE.md §4); stepping up is
 * hers to choose, and the work still has to land where the child actually
 * is, so the instruction is the same either way.
 */
export function planGradeContext(
  planGrade: string | null,
  profileGrade: string
): string {
  if (!planGrade || planGrade === profileGrade) return "";
  const name = (g: string) => (g === "K" ? "Kindergarten" : `Grade ${g}`);
  const down = planGrade === "K" || (profileGrade !== "K" && Number(planGrade) < Number(profileGrade));
  return [
    `TARGET GRADE: ${name(planGrade)} (the profile is ${name(profileGrade)}).`,
    `The adult chose this deliberately — ${
      down
        ? "they are teaching the step the learner can actually take."
        : "they are reaching past the register grade."
    }`,
    `Pitch the work at ${name(planGrade)} and say once, plainly and without`,
    "apology, that it is pitched there and why. Never describe the learner as",
    "behind, below, or delayed — describe the work, not the child.",
  ].join("\n");
}

/**
 * Which levels get their own worksheet.
 *
 * A class that splits three ways is taught once and practises three ways,
 * which is what the differentiation tracks already promise; this carries the
 * promise onto the paper. The counts go in so the model can size each set to
 * a real group rather than an abstraction, and so it never treats Level 3 as
 * a shortfall — Level 3 IS the provincial standard (CLAUDE.md §6).
 */
export function worksheetLevelsContext(
  levels: AchievementLevel[],
  spread?: Partial<Record<AchievementLevel, number>> | null
): string {
  if (levels.length === 0) return "";
  const described = levels
    .map((l) => {
      const n = spread?.[l];
      return n ? `Level ${l} (${n} student${n === 1 ? "" : "s"})` : `Level ${l}`;
    })
    .join(", ");
  const lines = [
    `WRITE A WORKSHEET FOR EACH OF THESE LEVELS: ${described}.`,
    "Put them in worksheetVariants, one entry per level, in the order given.",
    "The main practiceWorksheet stays what the whole group does together.",
    "Every variant must be recognisably the same lesson.",
  ];
  // Only guidance about levels that are actually in the room. Explaining
  // Level 4 to a class that has none is noise the model has to read past.
  if (levels.includes("3")) {
    lines.push(
      "Level 3 is the provincial standard, not a shortfall: write it as the",
      "expected work, not as a set that falls short of Level 4."
    );
  }
  if (levels.includes("4")) {
    lines.push("Level 4 goes deeper, not merely longer. Do not just add questions.");
  }
  if (levels.includes("1")) {
    lines.push(
      "Level 1 is a smaller step of the same skill, with more scaffolding —",
      "never a different topic, never colouring, never busywork."
    );
  }
  return lines.join("\n");
}

/** The previous session for this child, as far as the prompt needs it. */
export interface PreviousSession {
  createdAt: string;
  subject: string;
  /** The top-3 priorities that plan set. */
  taught: string[];
  /** What that plan promised to do next — the thread this session picks up. */
  nextStepPlan: string;
  difficulty: Difficulty | null;
}

/**
 * Make this session continue the last one instead of starting cold.
 *
 * Recent feedback already tells the model whether to go easier or harder.
 * What it never had was the content: which three things were taught, and
 * what that plan promised to do next. Without it, session two re-teaches
 * session one, which is exactly what a teacher notices first.
 */
export function continuityContext(previous: PreviousSession | null, now: Date = new Date()): string {
  if (!previous) {
    return [
      "FIRST SESSION",
      "There is no earlier session for this child. Establish a baseline: pick",
      "the most foundational gap you can see and say, in NEXT STEP PLAN, what",
      "the next session should pick up.",
    ].join("\n");
  }

  const days = Math.max(
    0,
    Math.round((now.getTime() - new Date(previous.createdAt).getTime()) / 86_400_000)
  );
  const when = days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;

  return [
    `CONTINUING FROM THE LAST SESSION (${when}, ${previous.subject})`,
    "It taught:",
    ...previous.taught.slice(0, 3).map((t) => `- ${t}`),
    "",
    "And it promised to do this next:",
    `"""${previous.nextStepPlan}"""`,
    "",
    "Continue that thread. Do NOT re-teach what is listed above unless the",
    "feedback says it did not land. Move to the next thing that plan named,",
    "or the next rung of the progression, and open WHAT I NOTICE by saying in",
    "one sentence how this session follows on from the last.",
  ].join("\n");
}

/**
 * The published progression for this grade, so "the next rung" is Ontario's
 * and not the model's invention.
 *
 * Only the step DOWN is ever taken automatically (CLAUDE.md §4). The next
 * grade is included as context for the adult, never as a target to jump to.
 */
export function progressionContext(
  current: { section: string; label: string; text: string }[],
  next: { section: string; label: string; text: string }[]
): string {
  if (current.length === 0) return "";
  const fmt = (rows: { section: string; label: string; text: string }[]) =>
    rows.slice(0, 8).map((r) => `- [${r.section}] ${r.label}: ${r.text}`);
  return [
    "ONTARIO LANGUAGE FOUNDATIONS CONTINUUM — where this grade sits",
    ...fmt(current),
    ...(next.length
      ? [
          "",
          "The rung above, for your reference only — do NOT jump to it:",
          ...fmt(next).slice(0, 4),
        ]
      : []),
    "",
    "Use this to choose the next step. Step DOWN a rung when the child is",
    "struggling; never up past one that is not secure.",
  ].join("\n");
}

/**
 * Where the learner actually is, on the scale her report cards already use.
 *
 * This is calibration, not a target. CLAUDE.md §4 only ever steps DOWN
 * automatically, so Level 1 and 2 pull the whole plan back to solid ground
 * while Level 4 extends sideways rather than skipping a stage.
 */
export function achievementContext(
  level: AchievementLevel | null,
  /** For a class, how many students sit at each level. */
  spread: Partial<Record<AchievementLevel, number>> | null = null
): string {
  if (!level && !spread) return "";

  const lines: string[] = ["ACHIEVEMENT LEVEL (Ontario, stated by the adult)"];

  if (spread) {
    const total = Object.values(spread).reduce((n, v) => n + (v ?? 0), 0);
    lines.push(`This is a group of ${total}, spread across the chart:`);
    for (const l of ["1", "2", "3", "4"] as AchievementLevel[]) {
      const n = spread[l];
      if (n) lines.push(`- Level ${l}: ${n} student${n === 1 ? "" : "s"}`);
    }
    lines.push(
      "",
      "Size the three differentiation tracks to those counts. If most of the",
      "room is at Level 1 or 2, the WHOLE GROUP track pitches there and the",
      "extension is small — do not write a lesson for a class that is not in",
      "front of her."
    );
  } else if (level) {
    lines.push(`This learner is working at Level ${level}.`);
  }

  const anchor = level ?? ((): AchievementLevel => {
    const entries = Object.entries(spread ?? {}) as [AchievementLevel, number][];
    entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
    return entries[0]?.[0] ?? "3";
  })();

  const guidance: Record<AchievementLevel, string[]> = {
    "1": [
      "Level 1 is below the provincial standard. Step down until you reach",
      "something they can already do, build from there, and keep the worksheet",
      "short. Do not pitch at grade level and hope.",
    ],
    "2": [
      "Level 2 is approaching the standard. The gap is usually one stage, not",
      "several — find that stage and make it secure rather than reteaching",
      "everything below it.",
    ],
    "3": [
      "Level 3 IS the provincial standard, not a middling result. Hold the",
      "current level, vary the practice, and consolidate.",
    ],
    "4": [
      "Level 4 is above the standard. Extend sideways — richer texts, harder",
      "applications, explaining their thinking — rather than skipping ahead to",
      "the next grade's stage.",
    ],
  };

  return [...lines, "", ...guidance[anchor]].join("\n");
}
