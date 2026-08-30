import type { AchievementLevel, Subject } from "./child";

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

/**
 * The same practice, pitched where each part of the room actually is.
 *
 * One lesson, several worksheets. A class of mixed readers gets taught
 * together and then practises apart, which is what the three differentiation
 * tracks already say out loud — this is that promise carried through to the
 * paper she hands out, instead of one worksheet aimed at the middle and two
 * thirds of the class quietly mismatched to it.
 *
 * Lives inside PRACTICE WORKSHEET and ANSWER KEY rather than becoming a
 * tenth section: nine means nine (CLAUDE.md §5). Each variant carries its
 * own key so the two sections cannot drift out of step.
 */
export interface WorksheetVariant {
  /** Ontario achievement level this set is pitched at. */
  level: AchievementLevel;
  worksheet: Worksheet;
  answerKey: { questionId: string; answer: string }[];
}

/**
 * The extra pieces of paper a lesson can produce, when asked for.
 *
 * Most of what an adult wants already exists: the mini-lesson is HOW TO
 * TEACH IT, the vocabulary cards and word lists are `teachingMaterials`, the
 * small-group activity is a `differentiation` track, the levelled sheets are
 * `worksheetVariants`. Three things had nowhere to live — a check at the end
 * of the lesson, something to take away, and a harder version for whoever
 * finishes first.
 *
 * All three are practice, so they sit inside PRACTICE WORKSHEET rather than
 * beside it. Nine means nine (CLAUDE.md §5). Generated only when asked for,
 * because a parent who wanted a worksheet does not want homework invented
 * for their evening.
 */
export type ExtraKind = "exitTicket" | "homework" | "challenge";

export interface LessonExtra {
  kind: ExtraKind;
  /** What to call it on the page and on the paper. */
  title: string;
  /** The questions or steps themselves, ready to use. */
  items: string[];
  /** One line on how to run it. */
  note?: string;
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
  /**
   * Extra worksheets, one per achievement level in the room.
   *
   * Optional twice over: every session saved before this field existed still
   * parses, and one learner at one level needs exactly one worksheet — the
   * one above.
   */
  worksheetVariants?: WorksheetVariant[];
  /**
   * Exit ticket, homework, challenge — only the ones asked for. Optional, so
   * every session saved before today still parses.
   */
  extras?: LessonExtra[];
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
