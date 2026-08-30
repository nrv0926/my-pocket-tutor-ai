import { SYSTEM_PROMPT } from "@/lib/prompts";

export const EXPLAIN_PROMPT_VERSION = "explain@2026-08-30.1";

/**
 * Put one curriculum expectation into plain English.
 *
 * Ontario writes for teachers, and it writes precisely: "use knowledge of
 * words and language structures to read and spell unfamiliar words". A
 * parent reading that on a Tuesday night cannot tell what to do about it.
 *
 * The explanation is ours and the page says so. What it may contain is not
 * open: it explains THIS expectation and nothing else. It may not add a
 * skill Ontario did not put there, promise what a child "should" be able to
 * do by an age, or drift into the next grade. An explanation that quietly
 * widens an expectation is the same failure as an invented code — it just
 * reads more helpfully on the way past.
 */
export function buildExplainPrompt(args: {
  code: string;
  text: string;
  grade: string;
  subject: string;
  strandName: string;
}): { system: string; user: string; version: string } {
  const { code, text, grade, subject, strandName } = args;
  const gradeName = grade === "K" ? "Kindergarten" : `Grade ${grade}`;

  const task = `
TASK
Explain ONE Ontario curriculum expectation to an adult who is not a teacher.

Three short pieces, and nothing else:

1. WHAT IT MEANS — two sentences at most, in everyday words. Say what the
   child is learning to do. No jargon, and no restating the expectation in
   its own vocabulary: if the original says "phonological awareness", yours
   says what that is.

2. WHAT IT LOOKS LIKE — one concrete example of a ${gradeName} child doing
   this, specific enough to picture. A real word, a real number, a real
   sentence — not "for example, a suitable text".

3. TRY THIS AT HOME — one activity an adult can run in five minutes with
   what is already in the house. No printing, no buying, no preparation. If
   the skill genuinely needs paper and a pencil, say so; anything more is
   too much.

HARD LIMITS
- Explain only what THIS expectation says. Do not add a skill it does not
  mention, and do not reach into the next grade.
- Never say what a child "should" be able to do by an age, or imply that a
  child who cannot do this is behind. Describe the work, not the child.
- Never invent or cite another expectation code.
- If the expectation is broad, stay broad. Do not narrow it to one example
  and present that as the whole thing.

OUTPUT FORMAT
The JSON object MUST match this TypeScript type EXACTLY:

{
  "plain": string,       // WHAT IT MEANS
  "example": string,     // WHAT IT LOOKS LIKE
  "tryAtHome": string    // TRY THIS AT HOME
}
`.trim();

  const system = `${SYSTEM_PROMPT}\n\n---\n\n${task}`;

  const user = `
SUBJECT: ${subject}
GRADE: ${gradeName}
STRAND: ${strandName}

EXPECTATION ${code}, exactly as Ontario publishes it:
"""
${text}
"""

Return the JSON object now. No prose outside JSON, no markdown fences.
`.trim();

  return { system, user, version: EXPLAIN_PROMPT_VERSION };
}
