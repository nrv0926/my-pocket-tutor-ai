import type { Worksheet } from "@/types/session";

/**
 * Three illustrative cases, one per band the engine has to handle.
 *
 * NO REAL LEARNER APPEARS HERE, and none should. /demo/loop is a public
 * route — it is deliberately outside PROTECTED_PREFIXES so the loop can
 * be exercised without signing in — so anything in this file is readable
 * by anyone who can reach the deployment. A first name beside a grade and
 * a named difficulty identifies a child in a small family, and CLAUDE.md
 * §3 is explicit that names and PII stay out.
 *
 * The cases are chosen to exercise the engine, not to describe anybody:
 * one early reader, one mid-primary regrouping case, one multi-digit
 * multiplication case. The skill ids are real entries in
 * data/skill-map.json, which is how the prerequisite graph gets hit.
 */
export interface DemoLearner {
  id: string;
  /** A case, not a person. */
  name: string;
  grade: string;
  skillId: string;
  /** What this case is for, in one line. */
  because: string;
  worksheet: Worksheet;
  answerKey: { questionId: string; answer: string }[];
}

const sheet = (
  title: string,
  rows: [string, string][],
  difficulty: Worksheet["difficulty"] = "easy",
): { worksheet: Worksheet; answerKey: { questionId: string; answer: string }[] } => ({
  worksheet: {
    title,
    difficulty,
    questions: rows.map(([prompt, answer], i) => ({
      id: `q${i + 1}`,
      prompt,
      answer,
      difficulty,
    })),
  },
  answerKey: rows.map(([, answer], i) => ({ questionId: `q${i + 1}`, answer })),
});

const earlyReader = sheet("Digraphs: sh, ch, th", [
  ["Read aloud: ship", "ship"],
  ["Read aloud: chat", "chat"],
  ["Read aloud: thin", "thin"],
  ["Read aloud: shed", "shed"],
  ["Read aloud: much", "much"],
  ["Read the sentence: Chad has a fish.", "read without guessing"],
]);

const regrouping = sheet("Subtracting with a trade", [
  ["64 − 28 = ?", "36"],
  ["52 − 17 = ?", "35"],
  ["71 − 46 = ?", "25"],
  ["83 − 29 = ?", "54"],
  ["What is the 4 in 348 worth?", "40"],
  ["90 − 35 = ?", "55"],
]);

const multiplying = sheet(
  "Multiplying by breaking apart",
  [
    ["20 × 4 = ?", "80"],
    ["60 × 2 = ?", "120"],
    ["26 × 5 = ?", "130"],
    ["36 × 4 = ?", "144"],
    ["52 × 7 = ?", "364"],
    ["93 × 5 = (90 × 5) + (☐ × 5). What is the box?", "3"],
  ],
  "medium",
);

export const LEARNERS: DemoLearner[] = [
  {
    id: "early-reader",
    name: "Grade 1 · digraphs",
    grade: "1",
    skillId: "phonics.digraphs",
    because: "An early reader partway through sh, ch and th.",
    ...earlyReader,
  },
  {
    id: "regrouping",
    name: "Grade 3 · regrouping",
    grade: "3",
    skillId: "math.subtraction_within_100",
    because: "Trading across a ten. Rests on place value underneath.",
    ...regrouping,
  },
  {
    id: "multiplying",
    name: "Grade 5 · multiplying",
    grade: "5",
    skillId: "math.multi_digit_mult",
    because: "Two digits by one, by breaking the number apart.",
    ...multiplying,
  },
];
