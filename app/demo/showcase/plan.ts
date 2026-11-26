import type { AnalysisResult } from "@/types/session";

/**
 * The plan the showcase walks through: Grade 3, adding with a trade.
 *
 * NO REAL LEARNER APPEARS HERE. /demo is public, so this is a case, not a
 * person — see the note in app/demo/loop/fixtures.ts and the guard in
 * tests/internalPages.test.ts.
 *
 * Written by hand rather than generated, because the showcase has to work
 * with no API key. Everything it renders goes through the real
 * AnalysisResultCard, so a visitor is looking at the product, not a
 * mock-up — and the nine sections are the nine the contract names.
 *
 * The expectation codes and their wording are TRANSCRIBED from
 * data/ontario/mathematics.json, never typed from memory (CLAUDE.md §6).
 * Grade 3, strand B Number:
 *
 *   B2.5  represent and solve problems involving the addition and
 *         subtraction of whole numbers that add up to no more than 1000,
 *         using various tools and algorithms
 *   B2.4  demonstrate an understanding of algorithms for adding and
 *         subtracting whole numbers by making connections to and describing
 *         the way other tools and strategies are used to add and subtract
 *   B1.1  read, represent, compose, and decompose whole numbers up to and
 *         including 1000 …
 *
 * Every sum stays at or under 1000, which is Grade 3's published range, and
 * every key is checkable: tests/showcase.test.ts runs the whole worksheet
 * through checkArithmeticKey() and checkGradeScope().
 */

const q = (id: string, prompt: string, answer: string, difficulty: "easy" | "medium" | "hard") => ({
  id,
  prompt,
  answer,
  difficulty,
});

export const SHOWCASE_SKILL_ID = "math.addition_within_100";

/** What the adult typed, and what the profile said. Step 1 of the five. */
export const SHOWCASE_INPUT = {
  profile: "One student · Grade 3 · Ontario",
  subject: "Mathematics",
  strand: "B. Number",
  expectation: "B2.5",
  expectationText:
    "represent and solve problems involving the addition and subtraction of whole numbers " +
    "that add up to no more than 1000, using various tools and algorithms",
  level: "2" as const,
  typed:
    "Got 2 out of 10 on adding when there's a carry. Subtraction with a trade was fine last " +
    "week, which is what's confusing me. She lines the numbers up right and then just writes " +
    "the whole total of the ones column underneath.",
};

export const SHOWCASE_PLAN: AnalysisResult = {
  whatINotice:
    "The lining up is already right, and that is the part most learners get wrong first. " +
    "What is going wrong comes after: in the ones column she is writing the whole answer — " +
    "6 + 8 becomes 14 written under the ones — instead of putting 4 down and carrying the 1. " +
    "Subtraction with a trade going well in the same week fits that: trading down has a " +
    "visible mark on the page, and carrying up does not. This looks like a recording habit " +
    "rather than a gap in what she understands about numbers.",

  keySkillGaps: [
    "Writing a two-digit result inside a single column instead of carrying the ten",
    "No place-value language for what the carried 1 actually is — it is one ten, not one",
    "Not checking the answer against an estimate, so a 10-times-too-big total goes unnoticed",
  ],

  whatToTeachNext: [
    "Say what the carried digit is worth, out loud, before writing anything",
    "Add with base-ten blocks first, then the same sum on paper, side by side",
    "Estimate before adding, and compare the estimate to the answer afterwards",
  ],

  howToTeachIt: [
    "Build 346 and 128 with base-ten blocks. Push the ones together: fourteen ones. Ask what " +
      "she can trade them for. Trade ten ones for one ten and move it to the tens column. " +
      "Say it: “fourteen ones is one ten and four ones.”",
    "Now write the same sum on paper beside the blocks. Each time she moves a block, she " +
      "writes the matching digit. The small 1 above the tens column is the ten she just " +
      "carried across — point at the block, then at the digit.",
    "Cover the blocks and do two more on paper alone. Before each one, ask for a rough answer " +
      "first: “346 and 128 — about how much?” About 470. Then add, and check the real answer " +
      "against it.",
    "Last, give her one where nothing needs carrying (231 + 145). Mixing them stops the carry " +
      "becoming something she does to every column out of habit.",
  ],

  teachingMaterials: [
    {
      label: "Place-value mat",
      kind: "cards",
      step: 1,
      note: "Print one. Three columns, left to right. The blocks go on it so the carry has somewhere to move TO.",
      items: ["hundreds", "tens", "ones"],
    },
    {
      label: "Say-it-first strip",
      kind: "sentences",
      step: 1,
      note: "Tape beside her. She reads the matching line aloud before writing the digit.",
      items: [
        "Fourteen ones is one ten and four ones.",
        "I write the 4 here, and the 1 goes above the tens.",
        "The little 1 means one ten, not one.",
      ],
    },
    {
      label: "Sums to build, then write",
      kind: "wordList",
      step: 2,
      note: "In this order. The first three each trade once; the last two trade twice.",
      items: ["346 + 128", "275 + 118", "457 + 236", "168 + 254", "389 + 145"],
    },
    {
      label: "Estimate-first cards",
      kind: "cards",
      step: 3,
      note: "Hold one up. She says a rough answer before she is allowed to pick up a pencil.",
      items: ["346 + 128 — about?", "275 + 118 — about?", "457 + 236 — about?", "231 + 145 — about?"],
    },
  ],

  practiceWorksheet: {
    title: "Adding with a trade — to 1000",
    difficulty: "medium",
    questions: [
      q("q1", "Easy — 231 + 145 = ?  (nothing to carry, check the line-up)", "376", "easy"),
      q("q2", "Easy — 346 + 128 = ?", "474", "easy"),
      q("q3", "Medium — 275 + 118 = ?", "393", "medium"),
      q("q4", "Medium — 457 + 236 = ?", "693", "medium"),
      q("q5", "Hard — 168 + 254 = ?", "422", "hard"),
      q("q6", "Hard — 389 + 145 = ?", "534", "hard"),
      q(
        "q7",
        "Hard — A library has 268 picture books and 157 chapter books. How many books is that altogether?",
        "425",
        "hard",
      ),
    ],
  },

  answerKey: [
    { questionId: "q1", answer: "376 — no carry needed. 1 + 5 = 6, 3 + 4 = 7, 2 + 1 = 3." },
    { questionId: "q2", answer: "474 — 6 + 8 = 14, so write 4 and carry one ten. 4 + 2 + 1 = 7." },
    { questionId: "q3", answer: "393 — 5 + 8 = 13, write 3 and carry one ten. 7 + 1 + 1 = 9." },
    { questionId: "q4", answer: "693 — 7 + 6 = 13, write 3 and carry one ten. 5 + 3 + 1 = 9." },
    {
      questionId: "q5",
      answer:
        "422 — 8 + 4 = 12, write 2 and carry one ten. 6 + 5 + 1 = 12, write 2 and carry one hundred. 1 + 2 + 1 = 4.",
    },
    {
      questionId: "q6",
      answer:
        "534 — 9 + 5 = 14, write 4 and carry one ten. 8 + 4 + 1 = 13, write 3 and carry one hundred. 3 + 1 + 1 = 5.",
    },
    {
      questionId: "q7",
      answer:
        "425 — 268 + 157. 8 + 7 = 15, write 5 and carry one ten. 6 + 5 + 1 = 12, write 2 and carry one hundred. 2 + 1 + 1 = 4.",
    },
  ],

  extras: [
    {
      kind: "exitTicket",
      title: "Exit ticket — one question, before she walks away",
      note: "Ask it out loud. You are listening for “one ten”, not for the right total.",
      items: [
        "In 46 + 38, you write a small 1 above the tens column. What is that 1 worth?",
        "Show me 346 + 128 and tell me where the trade happens.",
      ],
    },
  ],

  parentTips: [
    "When she writes 14 under the ones column, do not say “wrong”. Ask “how many tens is that?” " +
      "and let her find it. The habit breaks faster when she catches it herself.",
    "Ten minutes is enough. This is a recording habit, and habits change with short, frequent " +
      "repetition rather than one long sitting.",
  ],

  nextStepPlan:
    "Four short sittings this week, ten minutes each. Blocks beside paper for the first two, " +
    "paper alone for the second two, and an estimate before every sum. If she gets six of " +
    "seven on her own by Thursday, move to adding three numbers. If the carried digit is " +
    "still being written as a whole number, go back to B1.1 — composing and decomposing " +
    "numbers to 1000 — before more adding.",

  feedbackQuestion: "Was this too easy, just right, or too hard?",
};

/**
 * The same lesson for a class, which is where the two class-only fields
 * appear: one lesson in three tracks, and a worksheet per achievement level
 * in the room. Both are omitted from the plan above on purpose — a parent
 * teaching one child has nobody to differentiate between, and one learner at
 * one level needs exactly one worksheet (CLAUDE.md §5).
 */
export const SHOWCASE_CLASS_PLAN: AnalysisResult = {
  ...SHOWCASE_PLAN,
  whatINotice:
    "Eleven of twenty-four are writing the whole ones-column total inside the column instead " +
    "of carrying. Six of those eleven cannot yet say what the carried digit is worth, which " +
    "is the group to start with. Four students are secure and finishing early.",

  differentiation: {
    wholeGroup:
      "Base-ten blocks beside paper for 346 + 128, saying the trade out loud before writing it. " +
      "Then two more on paper, with an estimate first.",
    needsSupport:
      "The same skill, one step smaller: trade with blocks only, no paper, and only sums where " +
      "the ones column makes between 11 and 15. Say “ten ones is one ten” every time. Paper " +
      "joins in once the trade itself is automatic — this is not a different lesson and it is " +
      "not colouring.",
    readyForMore:
      "Same sums, then add a third number to each (346 + 128 + 95) so a column can carry twice. " +
      "Then write their own sum that needs two trades and swap it with a partner.",
    watchFor:
      "A student who lines the digits up wrongly is not in this lesson yet — that is place " +
      "value, B1.1, and they need that first. A student who carries into a column that did " +
      "not need it has over-generalised and belongs in the whole-group track with the " +
      "no-carry sums mixed in.",
  },

  worksheetVariants: [
    {
      level: "2",
      worksheet: {
        title: "Adding with a trade — building the trade",
        difficulty: "easy",
        questions: [
          q("L2q1", "Easy — 24 + 18 = ?", "42", "easy"),
          q("L2q2", "Easy — 37 + 15 = ?", "52", "easy"),
          q("L2q3", "Medium — 46 + 38 = ?", "84", "medium"),
          q("L2q4", "Medium — 58 + 27 = ?", "85", "medium"),
          q("L2q5", "Hard — 146 + 128 = ?", "274", "hard"),
        ],
      },
      answerKey: [
        { questionId: "L2q1", answer: "42 — 4 + 8 = 12, write 2 and carry one ten. 2 + 1 + 1 = 4." },
        { questionId: "L2q2", answer: "52 — 7 + 5 = 12, write 2 and carry one ten. 3 + 1 + 1 = 5." },
        { questionId: "L2q3", answer: "84 — 6 + 8 = 14, write 4 and carry one ten. 4 + 3 + 1 = 8." },
        { questionId: "L2q4", answer: "85 — 8 + 7 = 15, write 5 and carry one ten. 5 + 2 + 1 = 8." },
        { questionId: "L2q5", answer: "274 — 6 + 8 = 14, write 4 and carry one ten. 4 + 2 + 1 = 7." },
      ],
    },
    {
      level: "3",
      worksheet: SHOWCASE_PLAN.practiceWorksheet,
      answerKey: SHOWCASE_PLAN.answerKey,
    },
    {
      level: "4",
      worksheet: {
        title: "Adding with a trade — two carries and three numbers",
        difficulty: "hard",
        questions: [
          q("L4q1", "Easy — 389 + 145 = ?", "534", "easy"),
          q("L4q2", "Medium — 268 + 157 + 95 = ?", "520", "medium"),
          q("L4q3", "Medium — 476 + 238 + 49 = ?", "763", "medium"),
          q("L4q4", "Hard — 198 + 276 + 118 = ?", "592", "hard"),
          q(
            "L4q5",
            "Hard — Write an addition of two 3-digit numbers that needs a trade in BOTH the ones and the tens, and whose answer is under 1000. Then solve it.",
            "Any sum where the ones make 10 or more and the tens then make 10 or more, e.g. 168 + 254 = 422.",
            "hard",
          ),
        ],
      },
      answerKey: [
        { questionId: "L4q1", answer: "534 — two carries: ones make 14, tens make 13." },
        { questionId: "L4q2", answer: "520 — 268 + 157 = 425, then 425 + 95 = 520." },
        { questionId: "L4q3", answer: "763 — 476 + 238 = 714, then 714 + 49 = 763." },
        { questionId: "L4q4", answer: "592 — 198 + 276 = 474, then 474 + 118 = 592." },
        {
          questionId: "L4q5",
          answer:
            "Check their own working, not a single number. It must trade twice and stay under 1000 — e.g. 168 + 254 = 422.",
        },
      ],
    },
  ],
};
