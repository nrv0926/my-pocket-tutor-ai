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

/**
 * A teaching artefact the lesson actually needs — the cards to hold up, the
 * words to read, the sentences to point at.
 *
 * Section 4 used to say "write 6 cards (rain, seat, boat...)" and stop
 * there, which hands the adult a prep list at the moment they have no prep
 * time. These are the cards, produced.
 */
export type MaterialKind = "cards" | "wordList" | "sentences" | "script";

export interface TeachingMaterial {
  /** What this is, e.g. "Sound drill cards" or "Word list — VC/CV". */
  label: string;
  kind: MaterialKind;
  /** 1-based index into howToTeachIt, when the material serves one step. */
  step?: number;
  /** One line on how to use it, e.g. "Print and cut. Hold up one at a time." */
  note?: string;
  items: string[];
}

/**
 * The same lesson, adapted for the range in front of the adult.
 *
 * A teacher plans one lesson and runs it three ways: the whole group, the
 * student who is behind, and the ones who finish early. Asking her to
 * generate three plans is asking her to do the differentiating herself,
 * which is the work she wanted help with.
 *
 * This lives inside HOW TO TEACH IT rather than becoming a tenth section —
 * CLAUDE.md §5 fixes the nine and the renderer reads them verbatim.
 */
export interface Differentiation {
  /** The core lesson, as the whole class or group runs it. */
  wholeGroup: string;
  /** Adapted for the child who is struggling — smaller step, more support. */
  needsSupport: string;
  /** For anyone who is already secure and finishes early. */
  readyForMore: string;
  /** What to watch for that tells you a child belongs in another track. */
  watchFor?: string;
}

/** The structured nine-section AI output. Order is fixed — see CLAUDE.md §5. */
export interface AnalysisResult {
  whatINotice: string;
  keySkillGaps: string[];
  whatToTeachNext: string[]; // top 3
  howToTeachIt: string[];    // step-by-step
  /**
   * The materials section 4 calls for, ready to use. Optional: sessions
   * saved before this field existed still parse, and a plan that genuinely
   * needs no printed material (a conversation, a mental-maths routine) is
   * allowed to omit it rather than invent one.
   */
  teachingMaterials?: TeachingMaterial[];
  /**
   * One lesson, three tracks — what a teacher actually writes.
   *
   * Optional, because a parent teaching one child at the kitchen table has
   * nobody to differentiate between, and inventing two extra tracks for
   * them would be noise.
   */
  differentiation?: Differentiation;
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
