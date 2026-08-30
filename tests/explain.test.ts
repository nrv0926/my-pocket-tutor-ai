import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildExplainPrompt, EXPLAIN_PROMPT_VERSION } from "@/lib/prompts";
import { findExpectation } from "@/lib/curriculum";

const sql = readFileSync("supabase/migrations/0002_expectation_notes.sql", "utf8");
const action = readFileSync("lib/actions/explain.ts", "utf8");
const note = readFileSync("components/ExpectationNote.tsx", "utf8");

const real = findExpectation("language", "3", "B2.1")!;
const built = buildExplainPrompt({
  code: real.code,
  text: real.text,
  grade: "3",
  subject: "language",
  strandName: real.strandName,
});

/**
 * Ontario writes for teachers. The plain-English gloss is ours — which means
 * it carries the same risk as any wording we add: an explanation that
 * quietly widens an expectation is the same failure as an invented code, it
 * just reads more helpfully on the way past.
 */
describe("the explain prompt", () => {
  it("quotes Ontario's wording exactly, looked up rather than passed in", () => {
    expect(built.user).toContain(real.text);
    expect(action).toMatch(/findExpectation\(/);
    expect(action).toMatch(/is not an expectation at that grade/);
  });

  it("asks for exactly the three pieces the page renders", () => {
    for (const key of ["plain", "example", "tryAtHome"]) {
      expect(built.system).toContain(key);
    }
    for (const heading of ["WHAT IT MEANS", "WHAT IT LOOKS LIKE", "TRY THIS AT HOME"]) {
      expect(built.system).toContain(heading);
    }
  });

  it("forbids widening the expectation or reaching into the next grade", () => {
    expect(built.system).toMatch(/Explain only what THIS expectation says/);
    expect(built.system).toMatch(/do not reach into the next grade/i);
    expect(built.system).toMatch(/Do not narrow it to one example/);
  });

  it("forbids saying a child is behind", () => {
    // CLAUDE.md §7: we adapt the plan, we never label the child.
    expect(built.system).toMatch(/Describe the work, not the child/);
    expect(built.system).toMatch(/never say what a child "should" be able to do/i);
  });

  it("forbids citing another code", () => {
    expect(built.system).toMatch(/Never invent or cite another expectation code/);
  });

  it("keeps the home activity actually doable", () => {
    expect(built.system).toMatch(/five minutes/);
    expect(built.system).toMatch(/No printing, no buying/);
  });

  it("is versioned", () => {
    expect(built.version).toBe(EXPLAIN_PROMPT_VERSION);
    expect(EXPLAIN_PROMPT_VERSION).toMatch(/^explain@/);
  });
});

describe("the cost of a public page", () => {
  it("only lets a signed-in person generate one", () => {
    expect(action).toMatch(/if \(!user\) throw new Error\("Sign in/);
    expect(sql).toMatch(/with check \(auth\.uid\(\) is not null\)/);
  });

  it("lets anyone read what has already been written", () => {
    expect(sql).toMatch(/for select\s*\n\s*using \(true\)/);
  });

  it("spends a quota unit like every other generation", () => {
    expect(action).toMatch(/consumeAIQuota\(\)/);
  });

  it("returns the cached note instead of generating a second one", () => {
    const cacheCheck = action.indexOf("expectation_notes");
    const generate = action.indexOf("await generate<");
    expect(cacheCheck).toBeGreaterThan(0);
    expect(cacheCheck).toBeLessThan(generate);
  });

  it("caps the output, because three short paragraphs is not a plan", () => {
    expect(action).toMatch(/maxTokens: 1_000/);
  });
});

describe("identity of a note", () => {
  it("keys on grade, because the same code means different things", () => {
    // B1.1 at Grade 1 is a different expectation from B1.1 at Grade 3.
    expect(sql).toMatch(/unique index[\s\S]*?\(subject, grade, coalesce\(program, ''\), code\)/);
    const g1 = findExpectation("language", "1", "B1.1")!;
    const g3 = findExpectation("language", "3", "B1.1")!;
    expect(g1.text).not.toBe(g3.text);
  });

  it("keys on program too, since Core and Immersion differ", () => {
    expect(sql).toContain("coalesce(program, '')");
  });
});

describe("the page never passes our words off as Ontario's", () => {
  it("labels the gloss as ours wherever it appears", () => {
    expect(note).toMatch(/our wording, not Ontario/i);
  });

  it("shows nothing to a signed-out visitor when there is no note yet", () => {
    expect(note).toMatch(/if \(!canWrite\) return null/);
  });
});
