import { describe, expect, it } from "vitest";
import { achievementContext } from "@/lib/prompts";
import { buildAnalysisPrompt } from "@/prompts/analysisPrompt";
import { ACHIEVEMENT_LABEL, isAchievementLevel } from "@/types/child";

const CHILD = {
  grade: "3" as const,
  age: 8,
  curriculum: "ontario" as const,
  learningNeeds: [],
  strengths: null,
  weaknesses: null,
  parentGoal: null,
};

/**
 * Ontario's achievement chart. Level 3 is the provincial standard, not a
 * middling grade — a plan that treats 4 as the goal and 3 as a shortfall is
 * wrong about the scale, and a teacher would notice.
 */
describe("achievementContext", () => {
  it("says nothing when no level was given", () => {
    expect(achievementContext(null)).toBe("");
  });

  it("pulls Level 1 down to solid ground rather than pitching at grade", () => {
    const t = achievementContext("1");
    expect(t).toMatch(/below the provincial standard/i);
    expect(t).toMatch(/step down/i);
    expect(t).toMatch(/do not pitch at grade level/i);
  });

  it("treats Level 2 as one stage, not a total rebuild", () => {
    expect(achievementContext("2")).toMatch(/one stage, not|rather than reteaching/i);
  });

  it("states plainly that Level 3 is the standard", () => {
    expect(achievementContext("3")).toMatch(/IS the provincial standard/);
    expect(achievementContext("3")).toMatch(/not a middling result/i);
  });

  it("extends Level 4 sideways instead of skipping a grade", () => {
    const t = achievementContext("4");
    expect(t).toMatch(/extend sideways/i);
    expect(t).toMatch(/rather than skipping ahead/i);
  });

  it("sizes the tracks to a class spread", () => {
    const t = achievementContext(null, { "1": 4, "2": 8, "3": 9, "4": 3 });
    expect(t).toContain("group of 24");
    expect(t).toContain("Level 1: 4 students");
    expect(t).toContain("Level 4: 3 students");
    expect(t).toMatch(/Size the three differentiation tracks/i);
  });

  it("anchors a spread on the level most of the room is at", () => {
    // Nine at Level 3 is the biggest cohort, so the guidance is Level 3's.
    const t = achievementContext(null, { "1": 4, "2": 8, "3": 9, "4": 3 });
    expect(t).toMatch(/IS the provincial standard/);
  });

  it("reaches the prompt when set, and stays out when not", () => {
    const withLevel = buildAnalysisPrompt({
      child: CHILD,
      subject: "language",
      parentInput: "Stalling on longer words.",
      achievementLevel: "2",
    });
    expect(withLevel.system).toContain("ACHIEVEMENT LEVEL");

    const without = buildAnalysisPrompt({
      child: CHILD,
      subject: "language",
      parentInput: "Stalling on longer words.",
    });
    expect(without.system).not.toContain("ACHIEVEMENT LEVEL");
  });
});

describe("the level scale itself", () => {
  it("accepts only 1 to 4", () => {
    for (const ok of ["1", "2", "3", "4"]) expect(isAchievementLevel(ok)).toBe(true);
    for (const bad of ["0", "5", "R", "", null, 3]) expect(isAchievementLevel(bad)).toBe(false);
  });

  it("never describes Level 3 as a shortfall", () => {
    expect(ACHIEVEMENT_LABEL["3"]).toBe("At the provincial standard");
    expect(ACHIEVEMENT_LABEL["4"]).toMatch(/^Above/);
  });
});
