import type { AnalysisResult } from "@/types/session";

/**
 * A polished, hand-crafted sample plan for the public /try page.
 *
 * Why static (no live AI call):
 * - No login means no per-user quota. A live endpoint would be a free
 *   loop for anyone who wanted to burn the Anthropic budget.
 * - The sample is the product's first impression. A canned, polished
 *   output is a stronger marketing asset than whatever the model
 *   happens to produce on a generic input.
 * - It still renders through AnalysisResultCard, so visual fidelity is
 *   identical to a real result — visitors see the actual product, not
 *   a mock-up.
 *
 * Scenario: Grade 3, reading. Parent reports the child stumbles on
 * bigger words and is starting to dread reading. Per CLAUDE.md §4 we
 * step DOWN one phonics stage (vowel teams / r-controlled), not up.
 */
export const SAMPLE_PARENT_INPUT =
  "My daughter is in Grade 3 and her teacher said she's behind on reading. She can read short words fine, but she stumbles whenever a word has more than one syllable, gets frustrated, and lately she just says \"I hate reading.\" Bedtime stories used to be our thing. I don't know how to help without making it worse.";

export const SAMPLE_ANALYSIS: AnalysisResult = {
  whatINotice:
    "Your child can decode short words but is hitting a wall on longer ones — that's a very specific, very fixable gap. The frustration is a signal, not a verdict. We'll step back one stage, rebuild confidence on smaller words, then climb back up to the harder ones in a couple of weeks.",
  keySkillGaps: [
    "Reading words with vowel teams (ai, ee, oa, ou) without sounding them out one letter at a time",
    "Breaking longer words into syllables before reading them",
    "Reading with enough fluency that meaning has room to land",
  ],
  whatToTeachNext: [
    "Five-minute vowel-team drill — rebuild the foundation before tackling multisyllabic words",
    "Two-syllable word splitting — a short pencil-and-paper exercise",
    "Re-reading one short paragraph for fluency, not speed",
  ],
  howToTeachIt: [
    "Vowel-team drill: write 6 cards (rain, seat, boat, soap, mean, paid). Hold one up, she reads it. If she pauses, you say the team out loud (\"ai says A\") and try again. 2 minutes max.",
    "Word splitting: write 5 two-syllable words (rabbit, basket, picnic, sunset, helmet). Together, draw a slash where the syllables break, then read each half. The goal is the SPLIT, not the speed.",
    "Fluency re-read: pick one short, easy paragraph she's already read once. Read it together first, then she reads it alone. Same paragraph, no pressure to go faster — fluency comes from familiarity.",
    "End on a win: read ONE page of a familiar bedtime book she loves. No teaching, no corrections. This rebuilds the link between reading and comfort.",
  ],
  teachingMaterials: [
    {
      label: "Vowel-team cards",
      kind: "cards",
      step: 1,
      note: "Cut these out, or just read them off the screen. Two minutes, no longer.",
      items: ["rain", "seat", "boat", "soap", "mean", "paid"],
    },
    {
      label: "Two-syllable words to split",
      kind: "wordList",
      step: 2,
      note: "Draw a line where the word breaks, then read each half.",
      items: ["rab|bit", "bas|ket", "pic|nic", "sun|set", "hel|met"],
    },
    {
      label: "What to say if she gets stuck",
      kind: "script",
      step: 4,
      note: "Give the answer after one try. Struggle doesn't build decoding; successful repetition does.",
      items: [
        "That one's tricky — ai says A. Try it again.",
        "You worked that out.",
        "Let's stop here, that was a good one.",
      ],
    },
  ],
  practiceWorksheet: {
    title: "Vowel teams + two-syllable warm-up",
    difficulty: "easy",
    questions: [
      { id: "q1", prompt: "Read aloud: rain", answer: "rain", difficulty: "easy" },
      { id: "q2", prompt: "Read aloud: boat", answer: "boat", difficulty: "easy" },
      { id: "q3", prompt: "Read aloud: seat", answer: "seat", difficulty: "easy" },
      { id: "q4", prompt: "Split into syllables, then read: rabbit", answer: "rab-bit", difficulty: "medium" },
      { id: "q5", prompt: "Split into syllables, then read: picnic", answer: "pic-nic", difficulty: "medium" },
      { id: "q6", prompt: "Read aloud: \"The boat sailed in the rain.\"", answer: "The boat sailed in the rain.", difficulty: "medium" },
    ],
  },
  answerKey: [
    { questionId: "q1", answer: "rain" },
    { questionId: "q2", answer: "boat" },
    { questionId: "q3", answer: "seat" },
    { questionId: "q4", answer: "rab-bit" },
    { questionId: "q5", answer: "pic-nic" },
    { questionId: "q6", answer: "The boat sailed in the rain." },
  ],
  parentTips: [
    "Stop while it's still going well. Ten minutes is plenty. A short, calm session beats a long, tense one every time.",
    "Praise the effort, not the speed. \"You worked that out\" lands better than \"good job, fast.\"",
    "If she gets stuck, give the answer after one try. Decoding gets stronger with successful repetitions, not with struggle.",
  ],
  nextStepPlan:
    "Tomorrow, swap in three new vowel-team words (lean, road, paint) and three new two-syllable words (basket, sunset, helmet). Keep the structure identical for two weeks — the predictability is part of the medicine. After two weeks, add a third stage: reading a 4-sentence paragraph with these patterns built in.",
  feedbackQuestion: "Was this too easy, just right, or too hard?",
};
