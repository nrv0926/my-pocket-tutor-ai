import { describe, expect, it } from "vitest";
import { z } from "zod";

import { SAMPLE_ANALYSIS } from "@/app/try/sampleAnalysis";

/**
 * Schema test for the nine-section AI output.
 *
 * The renderer in components/AnalysisResultCard.tsx and the prompt in
 * lib/prompts.ts both depend on this exact shape (CLAUDE.md §5). If the
 * prompt drifts, the renderer silently breaks at runtime — these tests
 * catch that at CI time instead.
 *
 * The schema is intentionally stricter than the TypeScript type:
 * - whatToTeachNext must be exactly 3 entries (top 3 priorities)
 * - parentTips must be 2 or 3 entries
 * - practiceWorksheet.questions must be 5 to 8
 * - feedbackQuestion must be the canonical string
 */

const FEEDBACK_QUESTION = "Was this too easy, just right, or too hard?";

const Difficulty = z.enum(["easy", "medium", "hard"]);

const WorksheetQuestion = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  imageUrl: z.string().url().optional(),
  answer: z.string().min(1),
  difficulty: Difficulty,
});

const Worksheet = z.object({
  title: z.string().min(1),
  difficulty: Difficulty,
  questions: z.array(WorksheetQuestion).min(5).max(8),
});

const AnalysisResultSchema = z.object({
  whatINotice: z.string().min(1),
  keySkillGaps: z.array(z.string().min(1)).min(2).max(6),
  whatToTeachNext: z.array(z.string().min(1)).length(3),
  howToTeachIt: z.array(z.string().min(1)).min(3).max(6),
  practiceWorksheet: Worksheet,
  answerKey: z.array(z.object({ questionId: z.string().min(1), answer: z.string().min(1) })),
  parentTips: z.array(z.string().min(1)).min(2).max(3),
  nextStepPlan: z.string().min(1),
  feedbackQuestion: z.literal(FEEDBACK_QUESTION),
});

describe("nine-section AnalysisResult shape", () => {
  it("the /try sample plan matches the schema", () => {
    const parsed = AnalysisResultSchema.safeParse(SAMPLE_ANALYSIS);
    expect(parsed.success, formatErrors(parsed)).toBe(true);
  });

  it("answerKey questionIds match the worksheet ids one-to-one", () => {
    const wsIds = SAMPLE_ANALYSIS.practiceWorksheet.questions.map((q) => q.id).sort();
    const akIds = SAMPLE_ANALYSIS.answerKey.map((a) => a.questionId).sort();
    expect(akIds).toEqual(wsIds);
  });

  it("rejects an output missing the feedbackQuestion sentinel", () => {
    const broken = { ...SAMPLE_ANALYSIS, feedbackQuestion: "Was that ok?" };
    expect(AnalysisResultSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects an output with only 2 priorities (top-3 rule)", () => {
    const broken = {
      ...SAMPLE_ANALYSIS,
      whatToTeachNext: SAMPLE_ANALYSIS.whatToTeachNext.slice(0, 2),
    };
    expect(AnalysisResultSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects an output with 4 worksheet questions (min 5 rule)", () => {
    const broken = {
      ...SAMPLE_ANALYSIS,
      practiceWorksheet: {
        ...SAMPLE_ANALYSIS.practiceWorksheet,
        questions: SAMPLE_ANALYSIS.practiceWorksheet.questions.slice(0, 4),
      },
    };
    expect(AnalysisResultSchema.safeParse(broken).success).toBe(false);
  });
});

function formatErrors(parsed: z.SafeParseReturnType<unknown, unknown>): string {
  if (parsed.success) return "";
  return parsed.error.issues
    .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}
