import { describe, expect, it } from "vitest";
import { generate } from "@/lib/aiService";
import { buildAnalysisPrompt } from "@/prompts/analysisPrompt";
import { checkPassage, stageName } from "@/lib/decodableCheck";
import type { AnalysisResult } from "@/types/session";

/**
 * Does the model actually keep the decodable constraint?
 *
 * Everything else about this feature is verifiable offline. This is not:
 * it needs real generations, so it costs tokens and is opt-in twice over —
 * an API key AND RUN_DECODABLE_EVAL=1. `npm test` stays free and green
 * without them.
 *
 *   RUN_DECODABLE_EVAL=1 ANTHROPIC_API_KEY=sk-... npx vitest run tests/decodableEval.test.ts
 *
 * A failure here names the exact word that reached above its stage, which
 * is the whole point — "the passage looked fine" does not survive contact
 * with a child who stalls on "and".
 */
const LIVE =
  process.env.RUN_DECODABLE_EVAL === "1" && Boolean(process.env.ANTHROPIC_API_KEY);

const CASES = [
  {
    name: "CVC only",
    stage: 1,
    grade: "1" as const,
    input:
      "She can read short words like cat and sit. She has not been taught " +
      "sh, ch or th yet, and no blends.",
  },
  {
    name: "digraphs, no blends",
    stage: 2,
    grade: "1" as const,
    input:
      "She is secure on CVC words and has just learned the digraphs sh, ch " +
      "and th. She has not been taught consonant blends yet.",
  },
  {
    name: "blends",
    stage: 3,
    grade: "2" as const,
    input:
      "He is secure on CVC words, digraphs, and has just started initial " +
      "blends like st and fr. No silent e yet, and no vowel teams.",
  },
];

describe.skipIf(!LIVE)("live: the model keeps the decodable constraint", () => {
  it.each(CASES)(
    "$name — every word decodes at or below stage $stage",
    async ({ stage, grade, input }) => {
      const prompt = buildAnalysisPrompt({
        child: {
          grade,
          age: grade === "1" ? 6 : 7,
          curriculum: "ontario",
          learningNeeds: [],
          strengths: null,
          weaknesses: null,
          parentGoal: null,
        },
        subject: "language",
        parentInput: input,
        extras: ["decodable"],
      });

      const { result } = await generate<AnalysisResult>({
        system: prompt.system,
        user: prompt.user,
        promptVersion: prompt.version,
      });

      const passage = (result.extras ?? []).find((e) => e.kind === "decodable");
      expect(passage, "no decodable passage was produced").toBeDefined();
      if (!passage) return;

      // The shape the prompt asked for, before the harder question.
      expect(passage.items.length).toBeGreaterThanOrEqual(4);
      expect(passage.items.length).toBeLessThanOrEqual(8);
      expect((passage.trickyWords ?? []).length).toBeLessThanOrEqual(5);

      const report = checkPassage(passage.items, stage, passage.trickyWords ?? []);
      const detail = report.violations
        .map((v) => `  "${v.word}" needs ${stageName(v.stage)} (${v.reason})`)
        .join("\n");

      expect(
        report.ok,
        `Passage written for ${stageName(stage)} reaches higher:\n${detail}\n\n` +
          passage.items.map((s) => `  ${s}`).join("\n") +
          `\n\ntricky: ${JSON.stringify(passage.trickyWords ?? [])}`,
      ).toBe(true);
    },
    120_000,
  );
});
