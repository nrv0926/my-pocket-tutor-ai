import type { Worksheet } from "@/types/session";

/**
 * Three learners, each sitting on a real gap from the October check-ups,
 * so the loop is exercised on the cases it was built for rather than on
 * invented ones. The skill ids are real entries in data/skill-map.json.
 */
export interface DemoLearner {
  id: string;
  name: string;
  grade: string;
  skillId: string;
  /** Why this skill, in one line. */
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

const leo = sheet("Digraphs: sh, ch, th", [
  ["Read aloud: ship", "ship"],
  ["Read aloud: chat", "chat"],
  ["Read aloud: thin", "thin"],
  ["Read aloud: shed", "shed"],
  ["Read aloud: much", "much"],
  ["Read the sentence: Chad has a fish.", "read without guessing"],
]);

const iliana = sheet("Subtracting with a trade", [
  ["64 − 28 = ?", "36"],
  ["52 − 17 = ?", "35"],
  ["71 − 46 = ?", "25"],
  ["83 − 29 = ?", "54"],
  ["What is the 4 in 348 worth?", "40"],
  ["90 − 35 = ?", "55"],
]);

const penny = sheet(
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
    id: "leo",
    name: "Leo",
    grade: "1",
    skillId: "phonics.digraphs",
    because: "Missed the sight word “have”; working through sh, ch, th.",
    ...leo,
  },
  {
    id: "iliana",
    name: "Iliana",
    grade: "3",
    skillId: "math.subtraction_within_100",
    because: "2 of 10 on adding with a trade. Subtraction was clicking.",
    ...iliana,
  },
  {
    id: "penny",
    name: "Penny",
    grade: "5",
    skillId: "math.multi_digit_mult",
    because: "1 of 12 on two-digit times one-digit. Said 20 × 4 = 4000.",
    ...penny,
  },
];
