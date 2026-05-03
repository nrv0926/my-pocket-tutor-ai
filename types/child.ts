export type Grade = "K" | "1" | "2" | "3" | "4" | "5" | "6";

export type Subject = "language" | "reading" | "writing" | "math";

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
