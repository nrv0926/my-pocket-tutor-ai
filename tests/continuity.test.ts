import { describe, expect, it } from "vitest";
import { continuityContext, progressionContext, type PreviousSession } from "@/lib/prompts";
import { buildAnalysisPrompt } from "@/prompts/analysisPrompt";
import { continuumFor, nextGradeFor } from "@/lib/foundationsContinuum";

const CHILD = {
  grade: "3" as const,
  age: 8,
  curriculum: "ontario" as const,
  learningNeeds: [],
  strengths: null,
  weaknesses: null,
  parentGoal: null,
};

const PREVIOUS: PreviousSession = {
  createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  subject: "language",
  taught: ["Vowel-team drill", "Two-syllable splitting", "Fluency re-read"],
  nextStepPlan: "Next time, add three-syllable closed words and reassess.",
  difficulty: "medium",
};

/**
 * Session two used to re-teach session one. Recent feedback told the model
 * whether to go easier or harder, but never what had actually been taught.
 */
describe("continuityContext", () => {
  it("names a first session as a baseline rather than inventing a past", () => {
    const t = continuityContext(null);
    expect(t).toContain("FIRST SESSION");
    expect(t).toContain("baseline");
  });

  it("carries what was taught and what the last plan promised", () => {
    const t = continuityContext(PREVIOUS);
    expect(t).toContain("Vowel-team drill");
    expect(t).toContain("Two-syllable splitting");
    expect(t).toContain("add three-syllable closed words");
    expect(t).toContain("2 days ago");
  });

  it("tells the model not to re-teach what already landed", () => {
    const t = continuityContext(PREVIOUS);
    expect(t).toMatch(/Do NOT re-teach/i);
  });

  it("only lists the top three priorities", () => {
    const many = { ...PREVIOUS, taught: ["a", "b", "c", "d-should-not-appear"] };
    expect(continuityContext(many)).not.toContain("d-should-not-appear");
  });

  it("reads today and yesterday in words, not a date", () => {
    const today = { ...PREVIOUS, createdAt: new Date().toISOString() };
    expect(continuityContext(today)).toContain("today");
    const y = { ...PREVIOUS, createdAt: new Date(Date.now() - 86_400_000).toISOString() };
    expect(continuityContext(y)).toContain("yesterday");
  });
});

describe("progressionContext", () => {
  it("is empty when the grade is outside the continuum", () => {
    expect(progressionContext([], [])).toBe("");
  });

  it("uses Ontario's rungs and forbids jumping to the next one", () => {
    const current = continuumFor("2");
    const next = continuumFor(nextGradeFor("2")!);
    const t = progressionContext(current, next);
    expect(t).toContain("ONTARIO LANGUAGE FOUNDATIONS CONTINUUM");
    expect(t).toMatch(/do NOT jump to it/i);
    expect(t).toMatch(/Step DOWN/);
  });
});

describe("the analysis prompt carries continuity", () => {
  it("includes the previous session and the progression", () => {
    const { system, version } = buildAnalysisPrompt({
      child: CHILD,
      subject: "language",
      parentInput: "She still stumbles on longer words.",
      previous: PREVIOUS,
      progression: { current: continuumFor("3"), next: continuumFor("4") },
    });
    expect(system).toContain("CONTINUING FROM THE LAST SESSION");
    expect(system).toContain("add three-syllable closed words");
    expect(system).toContain("ONTARIO LANGUAGE FOUNDATIONS CONTINUUM");
    expect(version).toMatch(/^analysis@\d{4}-\d{2}-\d{2}\.\d+$/);
  });

  it("still builds without either, for a first session in a grade we lack", () => {
    const { system } = buildAnalysisPrompt({
      child: { ...CHILD, grade: "8" },
      subject: "mathematics",
      parentInput: "Struggling with integers.",
    });
    expect(system).toContain("FIRST SESSION");
    expect(system).not.toContain("ONTARIO LANGUAGE FOUNDATIONS CONTINUUM");
  });
});
