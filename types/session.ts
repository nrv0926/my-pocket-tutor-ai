import type { Subject } from "./child";

export type Difficulty = "easy" | "medium" | "hard";

export type SessionInputType = "paste" | "upload" | "description" | "plan";

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

/** The structured nine-section AI output. Order is fixed — see CLAUDE.md §5. */
export interface AnalysisResult {
  whatINotice: string;
  keySkillGaps: string[];
  whatToTeachNext: string[]; // top 3
  howToTeachIt: string[];    // step-by-step
  practiceWorksheet: Worksheet;
  answerKey: { questionId: string; answer: string }[];
  parentTips: string[];      // 2–3
  nextStepPlan: string;
  feedbackQuestion: string;  // always: "Was this too easy, just right, or too hard?"
}

export interface LearningSession {
  id: string;
  childId: string;
  inputType: SessionInputType;
  subject: Subject;
  rawInput: string | null;
  uploadId: string | null;
  analysisResult: AnalysisResult;
  topSkillGaps: string[];
  worksheet: Worksheet | null;
  answerKey: AnalysisResult["answerKey"] | null;
  difficulty: Difficulty | null;
  createdAt: string;
}
