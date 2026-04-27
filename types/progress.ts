import type { Difficulty } from "./session";

export type SkillStatus = "practiced" | "mastered" | "struggling";

export type ParentFeedback = "too_easy" | "just_right" | "too_hard";

export interface ProgressRecord {
  id: string;
  childId: string;
  sessionId: string | null;
  skill: string;
  status: SkillStatus;
  difficulty: Difficulty | null;
  parentFeedback: ParentFeedback | null;
  completedIndependently: boolean | null;
  notes: string | null;
  createdAt: string;
}

export interface ProgressSummary {
  practicedCount: number;
  masteredCount: number;
  strugglingCount: number;
  recentSkills: { skill: string; status: SkillStatus; lastSeen: string }[];
}
