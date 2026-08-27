/**
 * Ontario publishes the elementary curriculum for Grades 1-8, and elementary
 * schools run to Grade 8. K-8 is the whole of it — the earlier K-6 cut was
 * ours, not the Ministry's.
 */
export type Grade = "K" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

export const GRADES: Grade[] = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];

/**
 * Subjects the app generates plans for, named as Ontario names them.
 *
 * Reading and Writing are NOT subjects — both are strands of Language, and a
 * teacher spots the difference at once. Rows saved under the old names still
 * resolve through LEGACY_SUBJECTS in lib/curriculum.ts.
 */
export type Subject = "language" | "mathematics" | "science-technology" | "french";

export const SUBJECTS: Subject[] = ["language", "mathematics", "science-technology", "french"];

/**
 * Values accepted on the way in, including the three written before the
 * rename. Spelled out rather than spread so zod sees a literal tuple.
 */
export const STORED_SUBJECTS = [
  "language",
  "mathematics",
  "science-technology",
  "french",
  "reading",
  "writing",
  "math",
] as const;

export type StoredSubject = (typeof STORED_SUBJECTS)[number];

/**
 * Fold a stored value onto a current subject. Reading and Writing were never
 * subjects — they are Language strands — so both normalise to "language" and
 * the strand is recovered separately via lib/curriculum.ts.
 */
export function normalizeSubject(stored: StoredSubject | string): Subject {
  switch (stored) {
    case "reading":
    case "writing":
    case "language":
      return "language";
    case "math":
    case "mathematics":
      return "mathematics";
    case "science-technology":
      return "science-technology";
    case "french":
      return "french";
    default:
      return "language";
  }
}

export type LearningNeed = "adhd" | "dyslexia" | "anxiety" | "esl" | "other";

export type Role = "parent" | "homeschooler" | "teacher";

export const ROLES: Role[] = ["parent", "homeschooler", "teacher"];

export function isRole(value: unknown): value is Role {
  return value === "parent" || value === "homeschooler" || value === "teacher";
}

export interface Child {
  id: string;
  userId: string;
  nickname: string;
  age: number | null;
  grade: Grade;
  /** ISO-style region code, e.g. "ON-CA" for Ontario, Canada. */
  location: string;
  curriculum: "ontario" | "common-core" | "other";
  learningNeeds: LearningNeed[];
  strengths: string | null;
  weaknesses: string | null;
  parentGoal: string | null;
  createdAt: string;
}

export interface ChildInput {
  nickname: string;
  age: number | null;
  grade: Grade;
  location: string;
  curriculum: Child["curriculum"];
  learningNeeds: LearningNeed[];
  mainConcern: string | null;
  strengths: string | null;
  weaknesses: string | null;
  parentGoal: string | null;
}
