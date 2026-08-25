import type { AnalysisResult } from "@/types/session";

/**
 * Teacher sample: Grade 3 guided-reading group stalled on multisyllabic
 * decoding.
 *
 * Written teacher-to-teacher per CLAUDE.md §4 — grade-band terminology is
 * fine here, the misconception is named precisely, and the worksheet is
 * exit-ticket ready. The lesson follows the UFLI order required for K–3
 * reading (Sound Drill → Blend → Word Reading → Sentence Reading →
 * Dictation), sized for a 10-minute rotation.
 *
 * Phonics placement is deliberate: this group is secure on CVC and
 * digraphs, so the plan moves to the NEXT rung (closed-syllable division),
 * never skipping ahead to open syllables or affixes.
 */
export const TEACHER_INPUT =
  "I have four Grade 3s in my lowest guided reading group. They're solid on CVC and most digraphs, but they fall apart on anything two syllables or longer — they'll guess from the first letter and the picture instead of decoding through the word. I run 10-minute rotations with four groups, so I need something tight I can repeat. Report cards are in three weeks.";

export const TEACHER_ANALYSIS: AnalysisResult = {
  whatINotice:
    "The guessing is diagnostic, not a bad habit — it's what readers do when decoding through a long word costs more working memory than they have to spare. Your group's CVC and digraph base is secure, so this isn't a foundation problem and there's nothing to reteach. Two things sit between them and longer words, and the order matters: vowel teams have to become automatic rather than merely accurate, and only then does a routine for breaking a two-syllable word apart have the attention it needs to run. The lesson below firms up the first inside the warm-up and spends its main minutes on the second. Both are narrow, teachable gaps, and three weeks is enough time to move them.",
  keySkillGaps: [
    "Vowel teams are accurate but not automatic — decoding is still letter-by-letter, which spends the attention needed to finish a longer word",
    "No consistent routine for dividing a two-syllable word between the two medial consonants (VC/CV)",
    "Not flexing the vowel when the first attempt doesn't produce a real word",
  ],
  whatToTeachNext: [
    "VC/CV division on closed syllables — the highest-leverage routine for this group, and the one that unlocks the rest",
    "Vowel-team automaticity, to free the working memory that division needs",
    "Vowel flexing as an explicit self-correction move, so a wrong first try becomes recoverable",
  ],
  howToTeachIt: [
    "SOUND DRILL (1 min) — 8 cards: ai, ee, oa, ou, ea, oi, ay, igh. Whole group, choral, fast. You are building automaticity, not teaching; if a card stalls the group twice, park it and move on.",
    "BLEND PRACTICE (2 min) — Say each syllable, they blend aloud: rab-bit, nap-kin, mag-net, sun-set, pic-nic. Their ears do the joining before their eyes have to.",
    "WORD READING (3 min) — Now the routine, on paper: mark the two medial consonants, draw the slash between them, read each closed syllable, then blend. Model 'napkin' → nap/kin once, then release: rabbit, magnet, muffin, contest, insect. This is the core of the lesson — protect these three minutes.",
    "SENTENCE READING (2 min) — 'The rabbit sat in the basket.' / 'A magnet is in my pocket.' Same words, now in running text, which is where the strategy has to survive.",
    "DICTATION (2 min) — You say napkin and sunset, they write them, then mark their own slash. Writing the split is what moves it from your routine to theirs.",
    "WATCH FOR: dividing before both consonants (ra/bbit). Fix it by having them mark the two consonants FIRST, every time, before any slash goes down — the marking is the strategy, the slash is just the result.",
  ],
  teachingMaterials: [
    {
      label: "Sound drill cards",
      kind: "cards",
      step: 1,
      note: "Print and cut. Hold up one at a time, choral response, fast.",
      items: ["ai", "ee", "oa", "ou", "ea", "oi", "ay", "igh"],
    },
    {
      label: "Blend practice — you say the syllables, they blend",
      kind: "wordList",
      step: 2,
      note: "Read the halves aloud with a beat between them. Do not show these.",
      items: ["rab · bit", "nap · kin", "mag · net", "sun · set", "pic · nic"],
    },
    {
      label: "Word reading — mark, split, read",
      kind: "wordList",
      step: 3,
      note: "Model napkin first, then release. They mark both consonants before any slash.",
      items: ["napkin", "rabbit", "magnet", "muffin", "contest", "insect"],
    },
    {
      label: "Sentence strips",
      kind: "sentences",
      step: 4,
      note: "Same words, now in running text — where the strategy has to survive.",
      items: [
        "The rabbit sat in the basket.",
        "A magnet is in my pocket.",
        "We had a picnic at sunset.",
      ],
    },
    {
      label: "Dictation words",
      kind: "wordList",
      step: 5,
      note: "You say it, they write it, then they mark their own split.",
      items: ["napkin", "sunset"],
    },
    {
      label: "What to say when they guess",
      kind: "script",
      step: 6,
      note: "Redirect to the strategy without correcting the word for them.",
      items: [
        "Show me the two consonants in the middle.",
        "Good — now where does the slash go?",
        "Read me just the first part.",
      ],
    },
  ],
  practiceWorksheet: {
    title: "Closed-syllable division (VC/CV) — exit ticket",
    difficulty: "medium",
    questions: [
      { id: "q1", prompt: "Read aloud: napkin", answer: "nap/kin", difficulty: "easy" },
      { id: "q2", prompt: "Read aloud: sunset", answer: "sun/set", difficulty: "easy" },
      { id: "q3", prompt: "Mark the two middle consonants, then split and read: rabbit", answer: "rab/bit", difficulty: "easy" },
      { id: "q4", prompt: "Mark, split, and read: magnet", answer: "mag/net", difficulty: "medium" },
      { id: "q5", prompt: "Mark, split, and read: contest", answer: "con/test", difficulty: "medium" },
      { id: "q6", prompt: "Read the sentence aloud: The rabbit sat in the basket.", answer: "rab/bit, bas/ket read without guessing", difficulty: "medium" },
      { id: "q7", prompt: "Dictation — write the word, then mark the split: insect", answer: "insect → in/sect", difficulty: "hard" },
    ],
  },
  answerKey: [
    { questionId: "q1", answer: "nap/kin" },
    { questionId: "q2", answer: "sun/set" },
    { questionId: "q3", answer: "rab/bit" },
    { questionId: "q4", answer: "mag/net" },
    { questionId: "q5", answer: "con/test" },
    { questionId: "q6", answer: "rab/bit and bas/ket decoded, not guessed from the picture" },
    { questionId: "q7", answer: "insect → in/sect" },
  ],
  parentTips: [
    "Track the guessing, not the errors. A student who decodes slowly and correctly is ahead of one who reads it fast from the picture — the second is the one still compensating.",
    "The most common error is splitting before both consonants (ra/bbit). Marking the two consonants before drawing the slash prevents it, and it's a faster fix than correcting the read.",
    "Don't move to open syllables (ti/ger, ro/bot) until VC/CV is automatic across a whole exit ticket. Mixing the two patterns before the first is secure is what usually sends a group backwards.",
  ],
  nextStepPlan:
    "Keep this exact structure for two weeks, swapping only the word lists — the repetition is what makes the routine automatic, and changing the format resets the clock. Week 2, add three-syllable closed words (fan/tas/tic, bas/ket/ball). Reassess with the same exit ticket at the end of week 2: if all four students mark the consonants before splitting without a prompt, they're ready for open syllables. That lands a week before report cards, so you'll have a clean before-and-after to write from.",
  feedbackQuestion: "Was this too easy, just right, or too hard?",
};
