import { describe, expect, it } from "vitest";
import { z } from "zod";

import { SAMPLES, SAMPLE_ORDER } from "@/app/try/samples";

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

const TeachingMaterial = z.object({
  label: z.string().min(1),
  kind: z.enum(["cards", "wordList", "sentences", "script"]),
  step: z.number().int().positive().optional(),
  note: z.string().min(1).optional(),
  items: z.array(z.string().min(1)).min(1),
});

const DifferentiationSchema = z.object({
  wholeGroup: z.string().min(20),
  needsSupport: z.string().min(20),
  readyForMore: z.string().min(20),
  watchFor: z.string().min(10).optional(),
});

const AnalysisResultSchema = z.object({
  whatINotice: z.string().min(1),
  keySkillGaps: z.array(z.string().min(1)).min(2).max(6),
  whatToTeachNext: z.array(z.string().min(1)).length(3),
  howToTeachIt: z.array(z.string().min(1)).min(3).max(6),
  teachingMaterials: z.array(TeachingMaterial).optional(),
  differentiation: DifferentiationSchema.optional(),
  practiceWorksheet: Worksheet,
  answerKey: z.array(z.object({ questionId: z.string().min(1), answer: z.string().min(1) })),
  parentTips: z.array(z.string().min(1)).min(2).max(3),
  nextStepPlan: z.string().min(1),
  feedbackQuestion: z.literal(FEEDBACK_QUESTION),
});

const SAMPLE_ANALYSIS = SAMPLES.parent.analysis;

describe("nine-section AnalysisResult shape", () => {
  // Every public sample is a first impression and renders through the same
  // card, so all three are held to the schema, not just the parent one.
  it.each(SAMPLE_ORDER)("the %s sample plan matches the schema", (role) => {
    const parsed = AnalysisResultSchema.safeParse(SAMPLES[role].analysis);
    expect(parsed.success, formatErrors(parsed)).toBe(true);
  });

  it.each(SAMPLE_ORDER)("%s answerKey ids match the worksheet ids one-to-one", (role) => {
    const { analysis } = SAMPLES[role];
    const wsIds = analysis.practiceWorksheet.questions.map((q) => q.id).sort();
    const akIds = analysis.answerKey.map((a) => a.questionId).sort();
    expect(akIds).toEqual(wsIds);
  });

  it.each(SAMPLE_ORDER)("%s sample carries the input it was built from", (role) => {
    expect(SAMPLES[role].input.trim().length).toBeGreaterThan(80);
  });

  // The teacher's complaint: section 4 described materials instead of
  // producing them. Every public sample now has to hand over the goods.
  it.each(SAMPLE_ORDER)("%s sample produces its teaching materials", (role) => {
    const materials = SAMPLES[role].analysis.teachingMaterials ?? [];
    expect(materials.length).toBeGreaterThan(0);
    for (const m of materials) {
      expect(m.items.length, `${m.label} has no items`).toBeGreaterThan(0);
    }
  });

  it.each(SAMPLE_ORDER)("%s materials point at real steps", (role) => {
    const { analysis } = SAMPLES[role];
    for (const m of analysis.teachingMaterials ?? []) {
      if (typeof m.step !== "number") continue;
      expect(m.step, `${m.label} cites step ${m.step}`).toBeLessThanOrEqual(
        analysis.howToTeachIt.length
      );
    }
  });

  // "Pick a short passage" is the failure mode we are fixing: an instruction
  // to go and make something, dressed up as a material.
  it.each(SAMPLE_ORDER)("%s materials contain no go-and-make-it placeholders", (role) => {
    const vague = /\b(choose|pick|select|find|write) (some|a few|any|your own|several)\b/i;
    for (const m of SAMPLES[role].analysis.teachingMaterials ?? []) {
      for (const item of m.items) {
        expect(vague.test(item), `${m.label}: "${item}"`).toBe(false);
      }
    }
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

/**
 * "A whole lesson plan for the class, and for the kid that has problems."
 * One lesson, three tracks — not three plans, and not busywork for the
 * child who is behind.
 */
describe("differentiation", () => {
  it("is present for the teacher and homeschooler samples", () => {
    for (const role of ["teacher", "homeschooler"] as const) {
      expect(SAMPLES[role].analysis.differentiation, `${role} has none`).toBeDefined();
    }
  });

  it("is absent for the parent sample — one child, nobody to differentiate", () => {
    expect(SAMPLES.parent.analysis.differentiation).toBeUndefined();
  });

  it("gives three distinct tracks, never the same text repeated", () => {
    for (const role of ["teacher", "homeschooler"] as const) {
      const d = SAMPLES[role].analysis.differentiation!;
      const tracks = [d.wholeGroup, d.needsSupport, d.readyForMore];
      expect(new Set(tracks).size, `${role} repeats a track`).toBe(3);
    }
  });

  it("keeps the support track on the same skill, not a different lesson", () => {
    // The whole point: a smaller step, not a substitute activity.
    const d = SAMPLES.teacher.analysis.differentiation!;
    expect(d.needsSupport.toLowerCase()).toMatch(/same (words|skill)|smaller step/);
  });

  it("survives the nine-section schema unchanged", () => {
    for (const role of SAMPLE_ORDER) {
      const parsed = AnalysisResultSchema.safeParse(SAMPLES[role].analysis);
      expect(parsed.success, formatErrors(parsed)).toBe(true);
    }
  });
});
