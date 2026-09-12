import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { extrasContext, NINE_SECTION_OUTPUT_SCHEMA } from "@/lib/prompts";
import { buildAnalysisPrompt } from "@/prompts/analysisPrompt";
import { SUBJECTS } from "@/types/child";
import { extraOfferedFor, type ExtraKind } from "@/types/session";

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
    expect(ctx).not.toMatch(/DECODABLE/);
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

/**
 * A decodable passage is the retrieval practice that turns a taught pattern
 * into a read one. Its whole value is the constraint: every word decodable
 * with what has been taught so far. One untaught pattern and the child
 * stalls, and the adult concludes they have gone backwards.
 */
describe("a decodable story, which only reading has", () => {
  it("is offered for Language and no other subject", () => {
    expect(extraOfferedFor("decodable", "language")).toBe(true);
    expect(extraOfferedFor("decodable", "mathematics")).toBe(false);
    expect(extraOfferedFor("decodable", "science-technology")).toBe(false);
    // French phonics is its own progression and we have not transcribed it.
    expect(extraOfferedFor("decodable", "french")).toBe(false);
  });

  it("leaves the other three available everywhere", () => {
    for (const kind of ["exitTicket", "homework", "challenge"] as ExtraKind[]) {
      for (const subject of SUBJECTS) {
        expect(extraOfferedFor(kind, subject)).toBe(true);
      }
    }
  });

  it("binds the passage to the stage taught, and nothing above it", () => {
    const ctx = extrasContext(["decodable"]);
    expect(ctx).toMatch(/DECODABLE PASSAGE/);
    expect(ctx).toMatch(/stages BELOW it/);
    expect(ctx).toMatch(/Nothing above it, ever/);
  });

  it("caps the words the child cannot decode yet, and names them", () => {
    const ctx = extrasContext(["decodable"]);
    expect(ctx).toMatch(/trickyWords/);
    expect(ctx).toMatch(/at most five/);
    // A sixth means the sentence is wrong, not that the list should grow.
    expect(ctx).toMatch(/rewrite the sentence/);
  });

  it("forbids the picture-guessing the practice exists to break", () => {
    const ctx = extrasContext(["decodable"]);
    expect(ctx).toMatch(/never rely on a picture/);
    expect(ctx).toMatch(/connected text/);
  });

  it("carries the stage table, and only when it is ticked", () => {
    // The table is long. An exit ticket should not pay for it.
    expect(extrasContext(["decodable"])).toMatch(/THE SEVEN STAGES/);
    expect(extrasContext(["exitTicket", "homework", "challenge"])).not.toMatch(
      /THE SEVEN STAGES/,
    );
    expect(build([]).system).not.toMatch(/THE SEVEN STAGES/);
  });

  it("is never volunteered alongside another kind", () => {
    // The schema documents all four kinds always — that is the type talking.
    // What must stay absent until ticked is the instruction to write one.
    expect(extrasContext(["homework"])).not.toMatch(/DECODABLE PASSAGE/);
    expect(build([]).system).not.toMatch(/DECODABLE PASSAGE/);
  });
});

describe("the decodable contract", () => {
  it("documents the kind and its tricky words so the shape is never invented", () => {
    expect(NINE_SECTION_OUTPUT_SCHEMA).toContain('"decodable"');
    expect(NINE_SECTION_OUTPUT_SCHEMA).toContain('"trickyWords"');
    expect(NINE_SECTION_OUTPUT_SCHEMA).toMatch(/DECODABLE ONLY/);
  });

  it("accepts the kind server-side, and honours the subject rule there too", () => {
    // The picker hides it for maths, but a tick can outlive a subject change
    // on a stale form, so the action filters rather than trusting the client.
    const action = readFileSync("lib/actions/sessions.ts", "utf8");
    expect(action).toContain('"decodable"');
    expect(action).toMatch(/extraOfferedFor\(k, subject\)/);
  });

  it("offers it in the picker", () => {
    const picker = readFileSync("components/MaterialsPicker.tsx", "utf8");
    expect(picker).toContain('kind: "decodable"');
    // Plain English for a tired parent — CLAUDE.md §2.
    expect(picker).toMatch(/They read it to you/);
  });

  it("renders as connected text, not a numbered question list", () => {
    const card = readFileSync("components/AnalysisResultCard.tsx", "utf8");
    expect(card).toMatch(/extra\.kind === "decodable"/);
    expect(card).toMatch(/Teach these first/);
  });

  it("stays inside PRACTICE WORKSHEET, because nine means nine", () => {
    const card = readFileSync("components/AnalysisResultCard.tsx", "utf8");
    const s5 = card.slice(card.indexOf("index={5}"), card.indexOf("index={6}"));
    expect(s5).toContain("extras.map");
    expect(card.match(/<Section index=\{\d\}/g)).toHaveLength(9);
  });

  it("keeps tricky words optional, so every earlier session still parses", () => {
    const types = readFileSync("types/session.ts", "utf8");
    expect(types).toMatch(/trickyWords\?: string\[\]/);
  });
});
