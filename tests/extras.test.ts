import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { extrasContext, NINE_SECTION_OUTPUT_SCHEMA } from "@/lib/prompts";
import { buildAnalysisPrompt } from "@/prompts/analysisPrompt";
import type { ExtraKind } from "@/types/session";

const child = {
  grade: "3" as const,
  age: 8,
  curriculum: "ontario" as const,
  learningNeeds: [],
  strengths: null,
  weaknesses: null,
  parentGoal: null,
};

const build = (extras: ExtraKind[]) =>
  buildAnalysisPrompt({
    child,
    subject: "language",
    parentInput: "He guesses at long words.",
    extras,
  });

/**
 * One control, not ten AI features. Most of what an adult asks for already
 * ships in every plan; only three things are genuinely extra, and each costs
 * output — so they are ticked, never assumed.
 */
describe("extras are asked for, never volunteered", () => {
  it("says nothing when nothing was ticked", () => {
    expect(extrasContext([])).toBe("");
    expect(build([]).system).not.toMatch(/ALSO PRODUCE/);
  });

  it("names exactly what was ticked, and forbids the rest", () => {
    const ctx = extrasContext(["exitTicket"]);
    expect(ctx).toMatch(/exactly these and nothing else: exitTicket/);
    expect(ctx).toMatch(/EXIT TICKET/);
    expect(ctx).not.toMatch(/HOMEWORK/);
    expect(ctx).not.toMatch(/CHALLENGE/);
  });

  it("explains each kind only when it is wanted", () => {
    expect(extrasContext(["homework"])).toMatch(/HOMEWORK/);
    expect(extrasContext(["homework"])).not.toMatch(/EXIT TICKET/);
    expect(extrasContext(["challenge"])).toMatch(/CHALLENGE/);
  });
});

describe("what each extra is for", () => {
  it("keeps an exit ticket short enough to mark at a glance", () => {
    expect(extrasContext(["exitTicket"])).toMatch(/two minutes/);
    expect(extrasContext(["exitTicket"])).toMatch(/only what the lesson just taught/);
  });

  it("forbids homework that teaches", () => {
    // Homework that introduces new material fails at the kitchen table,
    // where there is nobody to teach it.
    const ctx = extrasContext(["homework"]);
    expect(ctx).toMatch(/Never new material/);
    expect(ctx).toMatch(/doable alone/);
    expect(ctx).toMatch(/nothing to print/);
  });

  it("forbids a challenge that is merely longer", () => {
    const ctx = extrasContext(["challenge"]);
    expect(ctx).toMatch(/Deeper, not longer/);
    expect(ctx).toMatch(/Never simply more questions/);
  });

  it("demands the real thing, not a description of it", () => {
    expect(extrasContext(["exitTicket"])).toMatch(/actual questions, not a description/);
  });
});

describe("the contract", () => {
  it("documents extras so the model never invents their shape", () => {
    expect(NINE_SECTION_OUTPUT_SCHEMA).toContain('"extras"');
    expect(NINE_SECTION_OUTPUT_SCHEMA).toMatch(/ONLY the kinds named below/);
  });

  it("keeps the nine sections at nine", () => {
    // Extras are practice, so they live inside PRACTICE WORKSHEET.
    const card = readFileSync("components/AnalysisResultCard.tsx", "utf8");
    const s5 = card.slice(card.indexOf('index={5}'), card.indexOf('index={6}'));
    expect(s5).toContain("extras.map");
    expect(card.match(/<Section index=\{\d\}/g)).toHaveLength(9);
  });

  it("stays optional, so every earlier session still parses", () => {
    const types = readFileSync("types/session.ts", "utf8");
    expect(types).toMatch(/extras\?: LessonExtra\[\]/);
  });
});
