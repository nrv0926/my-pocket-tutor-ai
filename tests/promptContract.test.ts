import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  NINE_SECTION_OUTPUT_SCHEMA,
  SYSTEM_PROMPT,
  SYSTEM_PROMPT_VERSION,
} from "@/lib/prompts";

/**
 * CLAUDE.md §4 lists rules every prompt must instruct the model to follow.
 * They aren't stylistic — several of them are the difference between a plan
 * that helps a struggling child and one that harms them. "Step down, never
 * up" pushed the wrong way puts a child who is already behind onto harder
 * work; dropping the phonics sequence skips a stage they need.
 *
 * These are the rules stated as tests, so an edit that quietly loses one
 * fails CI instead of shipping.
 */

const rule = (name: string, patterns: RegExp[]) => ({ name, patterns });

const REQUIRED_RULES = [
  rule("ignores and never echoes personal identifiers", [
    /never repeat any personal identifier|ignore and never repeat/i,
    /full names/i,
    /school names/i,
    /student numbers/i,
  ]),
  rule("never diagnoses or names a condition", [
    /NEVER DIAGNOSE|do not name a learning condition/i,
    /do not label the child/i,
  ]),
  rule("defaults to the Ontario curriculum", [/ontario/i]),
  rule("steps DOWN a grade when the child is behind, never up", [
    /step down/i,
    /never (push )?(above|up)|do not push above grade level/i,
  ]),
  rule("does not train on or memorise uploaded content", [
    /do not memorize|no training|confidential/i,
  ]),
  rule("follows the science-of-reading order", [
    /phonemic awareness\s*→\s*phonics\s*→\s*fluency\s*→\s*vocabulary\s*→\s*comprehension/i,
  ]),
  rule("uses UFLI-style structure for K-3 reading", [
    /sound drill\s*→\s*blend practice\s*→\s*word reading\s*→\s*sentence reading\s*→\s*dictation/i,
  ]),
  rule("keeps the phonics progression sequential", [
    /cvc\s*→\s*digraphs\s*→\s*blends\s*→\s*silent e\s*→\s*vowel teams\s*→\s*r-controlled/i,
    /never skip/i,
  ]),
  rule("adapts for ADHD, dyslexia and anxiety without labelling", [
    /adhd/i,
    /dyslexia/i,
    /anxiety/i,
  ]),
];

// The prompt is hand-wrapped, so a rule can straddle a line break. Match
// against a whitespace-collapsed copy rather than writing \s+ everywhere.
const FLAT_SYSTEM_PROMPT = SYSTEM_PROMPT.replace(/\s+/g, " ");

describe("SYSTEM_PROMPT honours CLAUDE.md §4", () => {
  for (const { name, patterns } of REQUIRED_RULES) {
    it(name, () => {
      for (const p of patterns) {
        expect(FLAT_SYSTEM_PROMPT, `missing: ${p}`).toMatch(p);
      }
    });
  }
});

/**
 * CLAUDE.md §5: the nine sections, in this order, with these names. The
 * renderer in components/AnalysisResultCard.tsx reads exactly these keys —
 * if the prompt's schema drifts, the renderer breaks at runtime for a real
 * parent rather than here.
 */
const NINE_SECTIONS = [
  "whatINotice",
  "keySkillGaps",
  "whatToTeachNext",
  "howToTeachIt",
  "practiceWorksheet",
  "answerKey",
  "parentTips",
  "nextStepPlan",
  "feedbackQuestion",
] as const;

describe("nine-section output schema", () => {
  // The nine sections stay nine. Materials belong INSIDE section 4, because
  // CLAUDE.md §5 fixes the section list and the renderer reads it verbatim.
  it("carries teachingMaterials without adding a tenth section", () => {
    expect(NINE_SECTION_OUTPUT_SCHEMA).toContain('"teachingMaterials"');
    const four = NINE_SECTION_OUTPUT_SCHEMA.indexOf('"howToTeachIt"');
    const mats = NINE_SECTION_OUTPUT_SCHEMA.indexOf('"teachingMaterials"');
    const five = NINE_SECTION_OUTPUT_SCHEMA.indexOf('"practiceWorksheet"');
    expect(four).toBeLessThan(mats);
    expect(mats).toBeLessThan(five);
  });

  it("tells the model to produce materials rather than describe them", () => {
    expect(NINE_SECTION_OUTPUT_SCHEMA).toMatch(/PRODUCE THE MATERIALS/);
    expect(NINE_SECTION_OUTPUT_SCHEMA).toMatch(/no prep time/i);
  });

  it("carries differentiation inside section 4, not as a tenth section", () => {
    // The prose rule above the type also names the field, so positions are
    // measured inside the type block rather than across the whole string.
    const typeBlock = NINE_SECTION_OUTPUT_SCHEMA.slice(
      NINE_SECTION_OUTPUT_SCHEMA.indexOf("The JSON object MUST match")
    );
    expect(typeBlock).toContain('"differentiation"');
    const four = typeBlock.indexOf('"howToTeachIt"');
    const diff = typeBlock.indexOf('"differentiation"');
    const five = typeBlock.indexOf('"practiceWorksheet"');
    expect(four).toBeLessThan(diff);
    expect(diff).toBeLessThan(five);
  });

  it("tells the model the support track is a smaller step, not busywork", () => {
    expect(NINE_SECTION_OUTPUT_SCHEMA).toMatch(/SMALLER STEP of the same skill/);
    expect(NINE_SECTION_OUTPUT_SCHEMA).toMatch(/never busywork/i);
    expect(NINE_SECTION_OUTPUT_SCHEMA).toMatch(/Omit the field entirely for a parent/i);
  });

  it("names all nine sections", () => {
    for (const key of NINE_SECTIONS) {
      expect(NINE_SECTION_OUTPUT_SCHEMA).toContain(`"${key}"`);
    }
  });

  it("lists them in the order CLAUDE.md §5 fixes", () => {
    const positions = NINE_SECTIONS.map((k) =>
      NINE_SECTION_OUTPUT_SCHEMA.indexOf(`"${k}"`)
    );
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("pins the exact feedback question", () => {
    expect(NINE_SECTION_OUTPUT_SCHEMA).toContain(
      "Was this too easy, just right, or too hard?"
    );
  });

  it("holds whatToTeachNext to exactly three priorities", () => {
    expect(NINE_SECTION_OUTPUT_SCHEMA).toMatch(/EXACTLY 3|\[string, string, string\]/);
  });

  it("keeps the worksheet between five and eight questions", () => {
    expect(NINE_SECTION_OUTPUT_SCHEMA).toMatch(/between 5 and 8/i);
  });
});

/**
 * CLAUDE.md §4: every prompt is a versioned, exported constant, and the
 * version string changes when the prompt changes. We can't detect a missed
 * bump from here, but we can insist the version exists and is well formed
 * so there is always something to bump.
 */
describe("prompt versioning", () => {
  const promptsDir = join(process.cwd(), "prompts");
  const files = readdirSync(promptsDir).filter((f) => f.endsWith(".ts"));

  it("finds prompt modules to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`${file} exports a well-formed version constant`, () => {
      const src = readFileSync(join(promptsDir, file), "utf8");
      const match = src.match(/VERSION\s*=\s*"([^"]+)"/);
      expect(match, `${file} has no exported VERSION constant`).toBeTruthy();
      // e.g. analysis@2026-05-03.1 — name, date, revision
      expect(match![1]).toMatch(/^[a-z-]+@\d{4}-\d{2}-\d{2}\.\d+$/);
    });
  }

  it("the system prompt is versioned the same way", () => {
    expect(SYSTEM_PROMPT_VERSION).toMatch(/^[a-z-]+@\d{4}-\d{2}-\d{2}\.\d+$/);
  });
});

/**
 * CLAUDE.md §4: prompts live in /prompts. Nothing else should be building
 * prompt text inline — that is how a rule above gets bypassed.
 */
describe("no inline prompts outside /prompts", () => {
  it("no page or component embeds instruction text for the model", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== ".next") walk(p);
        } else if (/\.tsx?$/.test(entry.name)) {
          const src = readFileSync(p, "utf8");
          if (/You are AI Pocket Tutor|NON-NEGOTIABLE RULES/.test(src)) offenders.push(p);
        }
      }
    };
    walk(join(process.cwd(), "app"));
    walk(join(process.cwd(), "components"));
    expect(offenders).toEqual([]);
  });
});
