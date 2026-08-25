import type { AnalysisResult } from "@/types/session";

/**
 * Homeschooler sample: Grade 2, parent running the full curriculum.
 *
 * Per CLAUDE.md §4 the homeschool voice gets a fuller mini-lesson
 * (model → guided → independent), a 20–30 minute session, and an explicit
 * scope-and-sequence position — this parent is the teacher of record and
 * needs to know where today sits in the sequence.
 */
export const HOMESCHOOLER_INPUT =
  "We're homeschooling Grade 2 and I follow a phonics scope and sequence, but I think I moved too fast. He's been doing silent e for two weeks and still reads 'cape' as 'cap' about half the time. He's not upset about it, he just isn't getting it, and I don't know whether to push on to vowel teams like the plan says or stay put. I have about half an hour a day for language.";

export const HOMESCHOOLER_ANALYSIS: AnalysisResult = {
  whatINotice:
    "Stay put — and trust that you spotted this. Reading 'cape' as 'cap' half the time isn't partial understanding; it's a coin flip, which means the silent-e rule hasn't been internalised as something that changes the vowel. Moving to vowel teams now would stack a second vowel pattern on an unstable first one, and the usual result is that both get shaky. Where you are in the sequence is exactly right: CVC → digraphs → blends → silent e, and silent e is the rung you're on. Two more weeks here costs you two weeks. Pushing on can cost a term.",
  keySkillGaps: [
    "Silent e is known as a rule he can recite, but it isn't yet changing what the vowel does when he reads",
    "No contrast practice — reading cap and cape side by side is what makes the e visible as a signal",
    "Silent-e words are decoded in isolation but not yet held onto in running text",
  ],
  whatToTeachNext: [
    "Minimal-pair contrast (cap/cape, kit/kite, hop/hope) — the fastest route to making the e mean something",
    "The 'magic e' hand motion, so there's a physical cue before the verbal rule",
    "Silent-e words inside sentences, so the pattern survives outside a word list",
  ],
  howToTeachIt: [
    "MODEL (5 min) — Write 'cap'. Read it. Add the e in a different colour: 'cape'. Say it out loud: 'The e is silent, and it makes the a say its name.' Do this with hop/hope and kit/kite. He watches; he doesn't read yet. Seeing the vowel change three times before being asked to produce it is the point.",
    "GUIDED (10 min) — Minimal pairs, you first, then together: tap/tape, pin/pine, cub/cube, rob/robe, man/mane. Cover the e with your finger, he reads the short word; lift your finger, he reads it again. The lift is the lesson — he should hear the vowel change every single time.",
    "INDEPENDENT (10 min) — He reads the worksheet below on his own while you stay nearby but quiet. Resist correcting the first attempt; note what he misses instead, because that list is tomorrow's word set.",
    "SENTENCE WORK (5 min) — 'The cub sat on the cube.' / 'I hope you can hop.' Both words from a pair in one sentence, which is where the contrast has to hold up.",
    "SCOPE AND SEQUENCE NOTE — You are on phonics stage 4 of 7: CVC → digraphs → blends → **silent e** → vowel teams → r-controlled → multisyllabic. Vowel teams are next, and they'll go faster if silent e is solid, because both are asking the same question: which letters change this vowel?",
  ],
  practiceWorksheet: {
    title: "Silent e — does the vowel say its name?",
    difficulty: "medium",
    questions: [
      { id: "q1", prompt: "Read both: cap → cape", answer: "cap (short a), cape (long a)", difficulty: "easy" },
      { id: "q2", prompt: "Read both: kit → kite", answer: "kit (short i), kite (long i)", difficulty: "easy" },
      { id: "q3", prompt: "Read both: hop → hope", answer: "hop (short o), hope (long o)", difficulty: "easy" },
      { id: "q4", prompt: "Add an e. What is the new word? tub → ____", answer: "tube", difficulty: "medium" },
      { id: "q5", prompt: "Add an e. What is the new word? plan → ____", answer: "plane", difficulty: "medium" },
      { id: "q6", prompt: "Read the sentence: I hope you can hop.", answer: "hope (long o), hop (short o)", difficulty: "medium" },
      { id: "q7", prompt: "Which word has a silent e that is NOT doing its job? have, gave, cave", answer: "have — the a stays short, so it breaks the rule", difficulty: "hard" },
    ],
  },
  answerKey: [
    { questionId: "q1", answer: "cap = short a; cape = long a" },
    { questionId: "q2", answer: "kit = short i; kite = long i" },
    { questionId: "q3", answer: "hop = short o; hope = long o" },
    { questionId: "q4", answer: "tube" },
    { questionId: "q5", answer: "plane" },
    { questionId: "q6", answer: "hope = long o; hop = short o" },
    { questionId: "q7", answer: "have — an exception worth naming out loud so it doesn't undermine the rule" },
  ],
  parentTips: [
    "Half-right on silent e is a coin flip, not partial mastery. The bar for moving on is reading a minimal pair correctly on the first try, three days running.",
    "Teach 'have' as a named exception rather than letting him meet it by accident. One acknowledged exception protects the rule; an unexplained one undermines it.",
    "Thirty minutes is generous for this — if he's done in twenty, stop. Ending while it's still going well is worth more than the extra ten minutes.",
  ],
  nextStepPlan:
    "Two more weeks on silent e, using the words he misses as the next day's list. When minimal pairs are first-try correct three days running, move to vowel teams (ai, ee, oa) — and open that unit by pointing back at silent e, because it's the same question in a new costume: which letters change this vowel? If he's still coin-flipping after two weeks, don't add a third; drop back to marking long and short vowels in words he already reads well, and rebuild from there.",
  feedbackQuestion: "Was this too easy, just right, or too hard?",
};
