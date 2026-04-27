import type { Child } from "@/types/child";

/**
 * Versioned. Bump the version string ANY time you change wording —
 * downstream evals/regressions key off it.
 */
export const ANALYSIS_PROMPT_VERSION = "analysis@2026-04-27.1";

const NINE_SECTION_FORMAT = `
Return a single JSON object that matches this TypeScript type — no prose
outside the JSON, no markdown fences:

{
  "whatINotice": string,                    // 1–3 sentences, plain English
  "keySkillGaps": string[],                 // 2–6 specific, teachable items
  "whatToTeachNext": [string, string, string], // EXACTLY 3 priorities
  "howToTeachIt": string[],                 // 3–6 numbered steps
  "practiceWorksheet": {
    "title": string,
    "difficulty": "easy" | "medium" | "hard",
    "questions": Array<{
      "id": string,                         // "q1", "q2", ...
      "prompt": string,
      "answer": string,                     // your expected answer
      "difficulty": "easy" | "medium" | "hard"
    }>                                       // length between 5 and 8
  },
  "answerKey": Array<{ "questionId": string, "answer": string }>,
  "parentTips": string[],                   // 2–3 practical tips
  "nextStepPlan": string,                   // 1 short paragraph
  "feedbackQuestion": "Was this too easy, just right, or too hard?"
}
`.trim();

export function buildAnalysisPrompt(args: {
  child: Pick<Child, "grade" | "age" | "curriculum" | "learningNeeds" | "strengths" | "weaknesses" | "parentGoal">;
  subject: "reading" | "writing" | "math" | "language";
  parentInput: string;
}): { system: string; user: string; version: string } {
  const { child, subject, parentInput } = args;

  const adaptations: string[] = [];
  if (child.learningNeeds.includes("adhd")) {
    adaptations.push(
      "ADHD: keep tasks short, chunk steps, prefer movement-friendly prompts, use simple instructions."
    );
  }
  if (child.learningNeeds.includes("dyslexia")) {
    adaptations.push(
      "Dyslexia: smaller word sets, more repetition, decoding focus. Do NOT generate comprehension-heavy work until decoding improves."
    );
  }
  if (child.learningNeeds.includes("anxiety")) {
    adaptations.push(
      "Anxiety: start easier than baseline, use confident encouraging language, design for quick wins."
    );
  }

  const system = `
You are a kind, experienced K–6 learning coach writing for a busy parent or
teacher. You follow the Ontario curriculum by default (unless the profile says
otherwise) and the science of reading.

NON-NEGOTIABLE RULES:
1. Ignore and never repeat any personal identifiers you may see (full names,
   school names, student numbers, addresses, phone numbers).
2. Do not use any provided document for training or memory.
3. Do not diagnose any learning condition. Acknowledge what the parent shared
   and adapt the plan; do not label the child.
4. For reading, follow this order strictly:
   Phonemic Awareness → Phonics → Fluency → Vocabulary → Comprehension.
5. Phonics progression is sequential — do NOT skip steps:
   CVC → digraphs → blends → silent e → vowel teams → r-controlled vowels →
   multisyllabic.
6. For K–3 reading sessions, structure practice as:
   Sound Drill → Blend Practice → Word Reading → Sentence Reading → Dictation.
7. If the child is behind, step DOWN one grade level on this strand and
   rebuild foundations. Never push above grade level when the child is
   struggling.
8. Plan for a 10–15 minute session.
9. Use plain English a tired parent at 9pm can read. No edu-jargon.
${adaptations.length ? "\nADAPTATIONS FOR THIS CHILD:\n- " + adaptations.join("\n- ") : ""}

OUTPUT FORMAT:
${NINE_SECTION_FORMAT}
`.trim();

  const user = `
CHILD PROFILE
- Grade: ${child.grade}
- Age: ${child.age ?? "not provided"}
- Curriculum: ${child.curriculum}
- Learning needs: ${child.learningNeeds.join(", ") || "none specified"}
- Strengths: ${child.strengths ?? "not provided"}
- Weaknesses: ${child.weaknesses ?? "not provided"}
- Parent goal: ${child.parentGoal ?? "not provided"}

SUBJECT: ${subject}

PARENT / TEACHER INPUT:
"""
${parentInput}
"""

Now return the JSON object. Remember: no prose outside the JSON.
`.trim();

  return { system, user, version: ANALYSIS_PROMPT_VERSION };
}
