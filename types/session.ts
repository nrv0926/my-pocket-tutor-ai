import type { Subject } from "./child";

export type Difficulty = "easy" | "medium" | "hard";

export type SessionInputType = "paste" | "upload" | "description" | "plan";

export type Mode = "parent" | "homeschool" | "teacher";

export interface WorksheetQuestion {
  id: string;
  prompt: string;
  /** Optional image URL (e.g. an inline math figure rendered server-side). */
  imageUrl?: string;
  /** Free-form expected answer. The renderer compares loosely. */
  answer: string;
  difficulty: Difficulty;
}

export interface Worksheet {
  title: string;
  difficulty: Difficulty;
  questions: WorksheetQuestion[];
}

export interface AnswerKeyEntry {
  questionId: string;
  answer: string;
}

/**
 * Parent mode output — the original 9-section structured plan.
 * Order is fixed; see CLAUDE.md §7.
 */
export interface ParentResult {
  whatINotice: string;
  keySkillGaps: string[];
  whatToTeachNext: string[]; // top 3
  howToTeachIt: string[];    // step-by-step
  practiceWorksheet: Worksheet;
  answerKey: AnswerKeyEntry[];
  parentTips: string[];      // 2–3
  nextStepPlan: string;
  feedbackQuestion: string;  // always: "Was this too easy, just right, or too hard?"
}

/** Back-compat alias. The DB and existing renderer both use this name. */
export type AnalysisResult = ParentResult;

export type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

export interface DailyLesson {
  day: WeekDay;
  subject: Subject;
  minutes: 10 | 15 | 20 | 30;
  skill: string;
  activity: string;
  parentTip: string;
}

/** Homeschool mode output — Mon–Fri weekly plan with daily breakdown. */
export interface HomeschoolResult {
  whatINotice: string;
  keySkillGaps: string[];
  weeklyPlan: { day: WeekDay; focus: string }[]; // length 5
  dailyLessons: DailyLesson[];                   // typically 5–10
  worksheetSet: Worksheet[];                     // one per priority skill
  answerKeys: { worksheetTitle: string; answers: AnswerKeyEntry[] }[];
  progressChecklist: string[];                   // what success looks like
  nextWeekPlan: string;
  feedbackQuestion: string;
}

export type DiffLevel = "easy" | "justRight" | "stretch";

export interface InterventionSession {
  session: number;          // 1..5
  focus: string;
  steps: string[];          // 3–6 short steps
}

/** Teacher mode output — 3–5 session intervention plan with 3 levels. */
export interface TeacherResult {
  groupSummary: string;
  keySkillGaps: string[];
  interventionPlan: InterventionSession[];       // length 3–5
  differentiatedPractice: Record<DiffLevel, string[]>; // bullet activities per level
  worksheetSet: Worksheet[];                     // one or more
  answerKeys: { worksheetTitle: string; answers: AnswerKeyEntry[] }[];
  assessmentCheckpoint: string;                  // how to verify mastery
  teacherNotes: string[];
  feedbackQuestion: string;
}

/** Discriminated union for storing/dispatch. */
export type ModeResult =
  | ({ mode: "parent" } & ParentResult)
  | ({ mode: "homeschool" } & HomeschoolResult)
  | ({ mode: "teacher" } & TeacherResult);

export interface LearningSession {
  id: string;
  childId: string;
  mode: Mode;
  inputType: SessionInputType;
  subject: Subject;
  rawInput: string | null;
  uploadId: string | null;
  analysisResult: ParentResult | HomeschoolResult | TeacherResult;
  topSkillGaps: string[];
  worksheet: Worksheet | null;
  answerKey: AnswerKeyEntry[] | null;
  difficulty: Difficulty | null;
  createdAt: string;
}
