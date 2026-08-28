import { describe, expect, it } from "vitest";
import { isLearnerKind, LEARNER_KINDS } from "@/types/child";
import { learnerCopy, roleCopy } from "@/lib/roleCopy";
import { achievementContext } from "@/lib/prompts";
import { buildAnalysisPrompt } from "@/prompts/analysisPrompt";

const CHILD = {
  grade: "3" as const,
  age: null,
  curriculum: "ontario" as const,
  learningNeeds: [],
  strengths: null,
  weaknesses: null,
  parentGoal: null,
};

/**
 * A profile is one learner or a whole class. Both live in the children table
 * so row-level security keeps proving ownership through user_id — there is no
 * second policy path to get wrong.
 */
describe("learner kind", () => {
  it("accepts only student or class", () => {
    expect(LEARNER_KINDS).toEqual(["student", "class"]);
    for (const ok of LEARNER_KINDS) expect(isLearnerKind(ok)).toBe(true);
    for (const bad of ["group", "teacher", "", null, 1]) expect(isLearnerKind(bad)).toBe(false);
  });

  it("asks a class different questions from a student", () => {
    const student = learnerCopy("teacher", "student");
    const klass = learnerCopy("teacher", "class");

    expect(student.nicknameLabel).toMatch(/student initials/i);
    expect(klass.nicknameLabel).toMatch(/class or group name/i);
    expect(klass.nicknameLabel).toMatch(/never a student's name/i);

    expect(klass.weaknessesLabel).toMatch(/where the group splits/i);
    expect(klass.submitLabel).toBe("Create class profile");
  });

  it("leaves a student profile exactly as it was", () => {
    expect(learnerCopy("teacher", "student")).toEqual(roleCopy("teacher"));
    expect(learnerCopy("parent")).toEqual(roleCopy("parent"));
  });
});

describe("a class spread sizes the tracks", () => {
  it("counts the room and names each level", () => {
    const t = achievementContext(null, { "1": 6, "3": 12, "4": 4 });
    expect(t).toContain("group of 22");
    expect(t).toContain("Level 1: 6 students");
    expect(t).toContain("Level 4: 4 students");
    expect(t).not.toContain("Level 2:");
  });

  it("reaches the prompt for a class", () => {
    const { system } = buildAnalysisPrompt({
      child: CHILD,
      subject: "language",
      parentInput: "Half the room stalls on longer words.",
      achievementSpread: { "1": 6, "2": 8, "3": 9, "4": 3 },
    });
    expect(system).toContain("ACHIEVEMENT LEVEL");
    expect(system).toMatch(/Size the three differentiation tracks/i);
  });

  it("pitches at the room in front of her, not an average one", () => {
    // Most of this class is below standard, so the guidance is Level 1's.
    const t = achievementContext(null, { "1": 14, "2": 6, "3": 2 });
    expect(t).toMatch(/step down/i);
    expect(t).toMatch(/do not pitch at grade level/i);
  });

  it("says nothing when the teacher does not know the split", () => {
    expect(achievementContext(null, null)).toBe("");
    expect(achievementContext(null, {})).toContain("group of 0");
  });
});
