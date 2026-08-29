import { describe, expect, it } from "vitest";
import { z } from "zod";
import { worksheetLevelsContext, NINE_SECTION_OUTPUT_SCHEMA } from "@/lib/prompts";
import { buildAnalysisPrompt } from "@/prompts/analysisPrompt";
import type { AchievementLevel } from "@/types/child";
import type { AnalysisResult, WorksheetVariant } from "@/types/session";

const child = {
  grade: "3" as const,
  age: 8,
  curriculum: "ontario" as const,
  learningNeeds: [],
  strengths: null,
  weaknesses: null,
  parentGoal: null,
};

const build = (worksheetLevels: AchievementLevel[], spread?: Record<string, number>) =>
  buildAnalysisPrompt({
    child,
    subject: "language",
    parentInput: "The group splits three ways on multisyllabic words.",
    achievementSpread: spread as never,
    worksheetLevels,
  });

/**
 * One lesson, several worksheets. The class is taught together and practises
 * apart, which is what the three differentiation tracks already promise —
 * this is that promise carried onto the paper she hands out.
 */
describe("worksheetLevelsContext", () => {
  it("says nothing when no levels are asked for", () => {
    expect(worksheetLevelsContext([], null)).toBe("");
  });

  it("asks for every level in the room, and no others", () => {
    const ctx = worksheetLevelsContext(["1", "3"], { "1": 6, "3": 12 });
    const request = ctx.split("\n")[0];
    expect(request).toContain("Level 1");
    expect(request).toContain("Level 3");
    expect(request).not.toContain("Level 2");
    expect(request).not.toContain("Level 4");
  });

  it("does not explain a level nobody in the room sits at", () => {
    // Level 4 still gets named inside the Level 3 note — "not a set that
    // falls short of Level 4" is the sentence that stops 3 reading as a
    // shortfall — but nothing tells the model how to write a Level 4 set.
    const ctx = worksheetLevelsContext(["1", "3"], { "1": 6, "3": 12 });
    expect(ctx).not.toMatch(/Level 4 goes deeper/);
    expect(ctx).not.toMatch(/Level 2 /);
  });

  it("explains a level when the room does contain it", () => {
    expect(worksheetLevelsContext(["4"], { "4": 3 })).toMatch(/Level 4 goes deeper/);
    expect(worksheetLevelsContext(["1"], { "1": 3 })).toMatch(/smaller step of the same skill/);
  });

  it("carries the counts so each set is sized to a real group", () => {
    const ctx = worksheetLevelsContext(["1", "3"], { "1": 6, "3": 12 });
    expect(ctx).toContain("6 students");
    expect(ctx).toContain("12 students");
  });

  it("says one student, not 1 students", () => {
    expect(worksheetLevelsContext(["2"], { "2": 1 })).toContain("1 student)");
  });

  it("never frames Level 3 as a shortfall", () => {
    // CLAUDE.md §6: Level 3 IS the provincial standard.
    const ctx = worksheetLevelsContext(["3"], { "3": 20 });
    expect(ctx).toMatch(/Level 3 is the provincial standard/i);
    expect(ctx).not.toMatch(/level 3[^.]{0,40}\b(below|behind|short of|falls)/i);
  });

  it("keeps every variant the same lesson", () => {
    expect(worksheetLevelsContext(["1", "4"], null)).toMatch(/same lesson/i);
  });
});

describe("the analysis prompt", () => {
  it("asks for variants only when levels are named", () => {
    expect(build([]).system).not.toMatch(/WRITE A WORKSHEET FOR EACH OF THESE LEVELS/);
    expect(build(["1", "3"]).system).toMatch(/WRITE A WORKSHEET FOR EACH OF THESE LEVELS/);
  });

  it("always documents the field, so the model never invents its shape", () => {
    expect(NINE_SECTION_OUTPUT_SCHEMA).toContain("worksheetVariants");
    expect(NINE_SECTION_OUTPUT_SCHEMA).toMatch(/unique ACROSS variants/);
  });

  it("keeps the nine sections at nine", () => {
    // The variants live inside PRACTICE WORKSHEET and ANSWER KEY. A tenth
    // top-level section would break the renderer and CLAUDE.md §5 with it.
    const topLevel = [
      "whatINotice", "keySkillGaps", "whatToTeachNext", "howToTeachIt",
      "practiceWorksheet", "answerKey", "parentTips", "nextStepPlan",
      "feedbackQuestion",
    ];
    for (const k of topLevel) expect(NINE_SECTION_OUTPUT_SCHEMA).toContain(k);
  });

  it("bumps its version when the contract changes", () => {
    expect(build([]).version).toBe("analysis@2026-08-29.6");
  });
});

/**
 * The renderer reads the worksheet from section 5 and its key from section 6.
 * Ids colliding across variants would silently show one group another
 * group's answers.
 */
describe("variant integrity", () => {
  const variants: WorksheetVariant[] = [
    {
      level: "1",
      worksheet: {
        title: "Level 1",
        difficulty: "easy",
        questions: [
          { id: "L1q1", prompt: "cat", answer: "c-a-t", difficulty: "easy" },
          { id: "L1q2", prompt: "sun", answer: "s-u-n", difficulty: "easy" },
        ],
      },
      answerKey: [
        { questionId: "L1q1", answer: "c-a-t" },
        { questionId: "L1q2", answer: "s-u-n" },
      ],
    },
    {
      level: "3",
      worksheet: {
        title: "Level 3",
        difficulty: "medium",
        questions: [
          { id: "L3q1", prompt: "rabbit", answer: "rab-bit", difficulty: "medium" },
        ],
      },
      answerKey: [{ questionId: "L3q1", answer: "rab-bit" }],
    },
  ];

  it("gives every question a globally unique id", () => {
    const ids = variants.flatMap((v) => v.worksheet.questions.map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("matches each variant's key to its own questions, one to one", () => {
    for (const v of variants) {
      expect(v.answerKey.map((a) => a.questionId).sort()).toEqual(
        v.worksheet.questions.map((q) => q.id).sort()
      );
    }
  });

  it("stays optional, so every session saved before it still parses", () => {
    const Schema = z.object({ worksheetVariants: z.array(z.unknown()).optional() });
    const legacy = { whatINotice: "x" } as unknown as AnalysisResult;
    expect(Schema.safeParse(legacy).success).toBe(true);
    expect(legacy.worksheetVariants).toBeUndefined();
  });
});
