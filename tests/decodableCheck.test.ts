import { describe, expect, it } from "vitest";
import {
  checkPassage,
  decodableStageGuide,
  stageOf,
  stageName,
  MAX_STAGE,
} from "@/lib/decodableCheck";

/**
 * The decodable extra promises the model will not reach above the stage it
 * was given. This is the instrument that tells us whether it kept the
 * promise, so the instrument itself has to be right first.
 */
describe("what stage a word needs", () => {
  it("reads plain CVC as the first stage", () => {
    for (const w of ["cat", "got", "pet", "sun", "fat"]) {
      expect(stageOf(w).stage, w).toBe(1);
    }
  });

  it("spots a digraph without calling it a blend", () => {
    for (const w of ["shed", "chad", "beth", "duck", "with"]) {
      expect(stageOf(w).stage, w).toBe(2);
    }
  });

  it("spots a real consonant blend", () => {
    // The exact failure this exists to catch: "and" in a digraph passage.
    for (const w of ["and", "stop", "frog", "fast"]) {
      expect(stageOf(w).stage, w).toBe(3);
    }
  });

  it("spots silent e, vowel teams and r-controlled in order", () => {
    expect(stageOf("cake").stage).toBe(4);
    expect(stageOf("see").stage).toBe(5);
    expect(stageOf("boat").stage).toBe(5);
    expect(stageOf("car").stage).toBe(6);
  });

  it("counts a second syllable, but not a silent e, as another syllable", () => {
    expect(stageOf("picnic").stage).toBe(7);
    expect(stageOf("rabbit").stage).toBe(7);
    // "cake" has two vowel letters and one syllable.
    expect(stageOf("cake").stage).toBe(4);
  });

  it("ignores punctuation and capitals", () => {
    expect(stageOf("Beth.").stage).toBe(2);
    expect(stageOf('"fat!"').stage).toBe(1);
  });

  it("names every stage it can return", () => {
    for (let s = 1; s <= MAX_STAGE; s += 1) {
      expect(stageName(s)).not.toMatch(/^Stage \d/);
    }
  });
});

describe("checking a whole passage", () => {
  // The fixture shipped in app/qa-preview/gallery.tsx, at the digraph stage.
  const FIXTURE = [
    "Beth got a duck.",
    "The duck is fat.",
    "Chad can pet the duck.",
    "The duck ran to the shed.",
    "Chad ran with Beth.",
    "Beth can get the duck.",
  ];
  const TRICKY = ["the", "a", "to", "is"];

  it("passes the shipped fixture at the stage it was written for", () => {
    const r = checkPassage(FIXTURE, 2, TRICKY);
    expect(r.violations, JSON.stringify(r.violations)).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.checked).toBeGreaterThan(10);
  });

  it("fails that same passage one stage lower, where digraphs are not taught", () => {
    const r = checkPassage(FIXTURE, 1, TRICKY);
    expect(r.ok).toBe(false);
    expect(r.violations.map((v) => v.word)).toContain("duck");
  });

  it("catches a word reaching above the stage", () => {
    const r = checkPassage(["The cat and the dog see a boat."], 2, ["the", "a"]);
    const words = r.violations.map((v) => v.word);
    expect(words).toContain("and"); // blend, stage 3
    expect(words).toContain("see"); // vowel team, stage 5
    expect(words).toContain("boat");
    expect(words).not.toContain("cat");
  });

  it("exempts tricky words, because undecodable is why they are listed", () => {
    const r = checkPassage(["The boat was red."], 1, ["the", "boat", "was"]);
    expect(r.ok).toBe(true);
    expect(r.checked).toBe(1); // only "red"
  });

  it("reports a tricky word the passage never used", () => {
    const r = checkPassage(["Beth got a duck."], 2, ["a", "said"]);
    expect(r.unusedTrickyWords).toEqual(["said"]);
  });

  it("reports each offending word once, however often it appears", () => {
    const r = checkPassage(["and and and."], 2, []);
    expect(r.violations).toHaveLength(1);
  });
});

/**
 * Real model output from the first live eval run (analysis@2026-09-12.9),
 * kept as fixtures. Two of three cases reached above their stage, and these
 * are the exact passages. If the checker ever stops flagging them it has
 * gone blind to the failure it exists for.
 */
describe("the first live run, kept as a regression", () => {
  it("catches the digraphs a CVC passage should not have contained", () => {
    // Told the child had not been taught sh, ch or th, the model wrote
    // "ship", "fish", "dish" and "shut" anyway.
    const r = checkPassage(
      [
        "Sam has a big ship.",
        "The ship is in the pond.",
        "A fish can sit in a dish.",
        "Sam put the fish in the ship.",
        "The fish is wet.",
        "Sam had to shut the lid.",
        "The ship and the fish go on a trip.",
      ],
      1,
      ["the", "a", "to", "of"],
    );
    const words = r.violations.map((v) => v.word);
    expect(words).toEqual(
      expect.arrayContaining(["ship", "fish", "dish", "shut", "pond", "and", "trip"]),
    );
    // "Sam", "big", "sit", "wet", "lid", "put", "can", "has", "go" are legal.
    expect(words).not.toContain("sam");
    expect(words).not.toContain("lid");
  });

  it("catches the blends a digraph passage should not have contained", () => {
    const r = checkPassage(
      [
        "Dad had a shop.",
        "The shop had fish and chips.",
        "A man ran in.",
        'He said, "I wish for fish!"',
        "Dad had a big dish.",
        "He put fish and chips in the dish.",
        "The man had his fish.",
        "The man had a chat with Dad.",
      ],
      2,
      ["the", "a", "said", "I", "for"],
    );
    const words = r.violations.map((v) => v.word);
    expect(words).toEqual(expect.arrayContaining(["and", "chips"]));
    // Digraphs are legal at stage 2 — these must NOT be flagged.
    for (const ok of ["fish", "shop", "wish", "dish", "chat", "with"]) {
      expect(words, ok).not.toContain(ok);
    }
  });
});

describe("what the model is told about the stages", () => {
  const guide = decodableStageGuide();

  it("names the letter patterns instead of only naming the stage", () => {
    // The failure was an inference the model had to make and got wrong.
    expect(guide).toMatch(/sh ch th wh ck ng ph/);
    expect(guide).toMatch(/ai ay ee ea/);
    expect(guide).toMatch(/ar er ir or ur/);
  });

  it("names the words that actually broke it", () => {
    for (const trap of ["and", "pond", "trip", "chips", "stop", "fast"]) {
      expect(guide, trap).toContain(`"${trap}"`);
    }
  });

  it("leaves exactly two ways out, and closes the third", () => {
    expect(guide).toMatch(/exactly two\s*\n?\s*options/);
    expect(guide).toMatch(/trickyWords/);
    expect(guide).toMatch(/Never simply use it/);
  });

  it("states the one-syllable rule the checker enforces", () => {
    expect(guide).toMatch(/ONE SYLLABLE/);
  });
});
