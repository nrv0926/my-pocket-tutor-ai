import { describe, expect, it } from "vitest";
import { recommend, recommendAll, type ObservationRow } from "@/lib/recommend";
import { validateSkillGraph, type SkillNode } from "@/lib/skills";
import {
  SUPPORTED_SUBJECTS,
  loadedExpectationCount,
  subjectsWithExpectations,
} from "@/lib/curriculum";
import {
  checkArithmeticKey,
  parseNumber,
  scoreNumber,
  validateChoices,
} from "@/lib/answerCheck";

/**
 * The coverage scenarios added in the CSV revision of the workbook: grades
 * (GR), subjects (SU), learner needs (N), classes (CL), siblings (MC) and
 * learning challenges (LC).
 *
 * Same rule as tests/scenarios.test.ts — one test per ID, fixtures
 * transcribed from the Steps column rather than reinterpreted. Rows marked
 * Manual (app) are reported as blocked, not approximated here.
 */

const NOW = new Date("2026-11-26T12:00:00Z");
const RECENT = "2026-11-20T10:00:00Z";

const obs = (over: Partial<ObservationRow> = {}): ObservationRow => ({
  itemId: "q1",
  sessionId: "s1",
  sessionClosedAt: RECENT,
  skillId: "math.subtraction_within_100",
  topicId: null,
  modeOfSupport: "independent",
  status: "scored",
  score: 1,
  maxPoints: 1,
  attempt: 1,
  excludeFromAdaptation: false,
  createdAt: RECENT,
  ...over,
});

/** `right` of `total`, with distinct item ids inside the session. */
const run = (
  sessionId: string,
  right: number,
  total: number,
  over: Partial<ObservationRow> = {},
  tag = "q",
): ObservationRow[] =>
  Array.from({ length: total }, (_, i) =>
    obs({ sessionId, itemId: `${tag}${i + 1}`, score: i < right ? 1 : 0, ...over }),
  );

const decide = (rows: ObservationRow[], now = NOW) => recommend(rows, { now }).decision;
const byKey = (rows: ObservationRow[], now = NOW) =>
  new Map(recommendAll(rows, { now }).map((r) => [r.skillKey, r]));

// =================================================================== grades

describe("GR — grades", () => {
  it("GR-06 a grade change leaves stale evidence out of the window", () => {
    // June, as Grade 1. The grade then changes; the evidence is simply old.
    const june = "2026-06-18T10:00:00Z";
    const old = [
      ...run("s1", 5, 5, { sessionClosedAt: june, createdAt: june }),
      ...run("s2", 5, 5, { sessionClosedAt: june, createdAt: june }),
    ];
    expect(decide(old)).toBe("collect_more_evidence");
    // And nothing throws on the way: the engine never reads a grade.
    expect(recommend(old, { now: NOW }).evidence.items).toEqual([]);
  });
});

// ================================================================= subjects

describe("SU — subjects", () => {
  it("SU-01 a key that disagrees with its own arithmetic is caught", () => {
    expect(checkArithmeticKey("26 × 5 = ?", "130").verdict).toBe("ok");
    expect(checkArithmeticKey("93 - 48", 45).verdict).toBe("ok");
    expect(checkArithmeticKey("200 ÷ 5 = ?", "40").verdict).toBe("ok");
    expect(checkArithmeticKey("1,200 + 50", "1,250").verdict).toBe("ok");

    // The error this exists for: a plausible-looking key that is wrong.
    const bad = checkArithmeticKey("20 × 4 = ?", "4000");
    expect(bad.verdict).toBe("wrong");
    expect(bad.computed).toBe(80);
    expect(bad.why).toMatch(/the key says 4000/);

    // Abstains rather than guesses on anything it cannot recompute.
    expect(checkArithmeticKey("Draw three groups of four.", "12").verdict).toBe("unparsed");
    expect(checkArithmeticKey("93 × 5 = (90 × 5) + (? × 5)", "3").verdict).toBe("unparsed");
  });

  it("SU-02 duplicate and equivalent distractors are rejected", () => {
    // 3 x 3 = 9 offered with 9 among the distractors.
    const a = validateChoices("9", ["6", "12", "9"]);
    expect(a.map((p) => p.kind)).toContain("correct_among_distractors");

    // 0.5 and 1/2 look like two options and are one.
    const b = validateChoices("0.25", ["0.5", "1/2", "0.75"]);
    expect(b.map((p) => p.kind)).toContain("equivalent");

    const c = validateChoices("9", ["6", "6", "12"]);
    expect(c.map((p) => p.kind)).toContain("duplicate");

    // A sound item has nothing to report.
    expect(validateChoices("9", ["6", "12", "18"])).toEqual([]);
  });

  it("SU-08 a supported subject has no expectations behind it — RAISED", () => {
    // data/ontario/subjects.json marks Science and Technology supported, and
    // lib/curriculum.ts therefore offers it. There is no science.json, so it
    // has NOTHING transcribed: no strand, no expectation, no code.
    //
    // That is the setup CLAUDE.md §6 warns about in the strongest terms. A
    // plan for a subject with no transcribed expectations has nothing to
    // resolve against, and the prompt still tells the model to use the
    // Ontario curriculum. An invented code is "worse than a missing one,
    // because a teacher will trust it".
    //
    // RAISED, NOT RESOLVED. Two ways out and both are Nicolas's call:
    // transcribe the Science and Technology curriculum, or set supported to
    // false until it is done ("not yet" beats pretending, §6). Flipping the
    // flag removes a subject the app currently advertises, which is a
    // product decision, not a test fix.
    //
    // Pinned the way the repo already pins a known data gap, so it cannot
    // drift in either direction: transcribe Science and this test tells you
    // to shorten the list; mark a fifth subject supported without data and
    // it tells you that too.
    const KNOWN_GAP = ["science-technology"];
    const withExpectations = subjectsWithExpectations();
    const offeredButEmpty = SUPPORTED_SUBJECTS.map((s) => s.id).filter(
      (id) => !withExpectations.includes(id),
    );
    expect(offeredButEmpty).toEqual(KNOWN_GAP);

    // The three that are real are genuinely loaded.
    expect(withExpectations).toEqual(["language", "mathematics", "french"]);
    expect(loadedExpectationCount()).toBe(1189);
  });

  it("SU-10 two subjects in one session stay two decisions", () => {
    const rows = [
      ...run("s1", 4, 4, { skillId: "math.subtraction_within_100" }, "m"),
      ...run("s2", 4, 4, { skillId: "math.subtraction_within_100" }, "m"),
      ...run("s1", 1, 4, { skillId: "phonics.digraphs" }, "l"),
      ...run("s2", 1, 4, { skillId: "phonics.digraphs" }, "l"),
    ];
    const m = byKey(rows);
    expect(m.get("math.subtraction_within_100")?.decision).toBe("try_transfer");
    expect(m.get("phonics.digraphs")?.decision).toBe("check_prerequisite");
    // Maths results never land in the Language evidence.
    expect(
      m.get("phonics.digraphs")?.evidence.items.every((i) => i.skillId === "phonics.digraphs"),
    ).toBe(true);
  });

  it("the handoff's numeric acceptance row: 1,200 / 0 / blank / 1,2", () => {
    expect(scoreNumber("1,200", 1200).verdict).toBe("correct");
    expect(scoreNumber("1200", 1200).verdict).toBe("correct");
    expect(scoreNumber("0", 0).verdict).toBe("correct");       // zero can score
    expect(scoreNumber("", 1200).verdict).toBe("skipped");     // blank is skipped
    expect(scoreNumber("   ", 1200).verdict).toBe("skipped");

    const malformed = scoreNumber("1,2", 12);
    expect(malformed.verdict).toBe("incorrect");               // not "skipped"
    expect(malformed.why).toMatch(/commas/);
    expect(parseNumber("12,00")).toBeNull();

    // "Provide a separate unit field where required."
    const withUnit = scoreNumber("120 pages", 120);
    expect(withUnit.verdict).toBe("correct");
    expect(withUnit.unit).toBe("pages");
    expect(scoreNumber("$1,200", 1200).verdict).toBe("correct");

    // 0.5 and 1/2 are the same number, wherever they turn up.
    expect(scoreNumber("1/2", 0.5).verdict).toBe("correct");
    expect(scoreNumber("3 1/2", 3.5).verdict).toBe("correct");
  });
});

// =========================================================== learner needs

describe("N — learner needs", () => {
  it("N-08 one bad day: all sessions in the window count, not the last two", () => {
    // 0/4 then 4/4 then 4/4. All in window: 8/12 = 67% -> practise.
    // A "last two sessions" rule would see 8/8 = 100% -> try_transfer.
    // The choice is Phase 2's, documented in lib/recommend.ts; this pins it.
    const rows = [
      ...run("s1", 0, 4),
      ...run("s2", 4, 4),
      ...run("s3", 4, 4),
    ];
    const r = recommend(rows, { now: NOW });
    expect(r.evidence.score).toBe(8);
    expect(r.evidence.maxPoints).toBe(12);
    expect(r.evidence.sessionIds).toHaveLength(3);
    expect(r.decision).toBe("practise_same_skill");
  });
});

// ====================================================== learning challenges

describe("LC — learning challenges", () => {
  it("LC-01 reading difficulty does not drag maths down", () => {
    const rows = [
      // Maths word problems read aloud: help that is not the skill measured.
      ...run("s1", 5, 6, { skillId: "math.subtraction_within_100", modeOfSupport: "accommodated" }, "m"),
      ...run("s2", 5, 6, { skillId: "math.subtraction_within_100", modeOfSupport: "accommodated" }, "m"),
      // Decoding at phonics stage 2, unaided.
      ...run("s1", 1, 5, { skillId: "phonics.digraphs" }, "l"),
      ...run("s2", 2, 5, { skillId: "phonics.digraphs" }, "l"),
    ];
    const m = byKey(rows);
    expect(m.get("math.subtraction_within_100")?.decision).toBe("try_transfer");
    expect(m.get("phonics.digraphs")?.decision).toBe("check_prerequisite");
    // The fail sign named in the sheet: maths stepped down because of reading.
    expect(m.get("math.subtraction_within_100")?.decision).not.toBe("check_prerequisite");
  });

  it("LC-02 the chain steps down twice and stops where the floor is solid", () => {
    const rows = [
      ...run("s1", 1, 5, { skillId: "math.subtraction_within_100" }, "r"),
      ...run("s2", 1, 5, { skillId: "math.subtraction_within_100" }, "r"),
      ...run("s1", 2, 5, { skillId: "math.place_value_100" }, "p"),
      ...run("s2", 1, 5, { skillId: "math.place_value_100" }, "p"),
      ...run("s1", 4, 5, { skillId: "math.counting_to_30" }, "c"),
      ...run("s2", 4, 5, { skillId: "math.counting_to_30" }, "c"),
    ];
    const m = byKey(rows);
    expect(m.get("math.subtraction_within_100")?.decision).toBe("check_prerequisite");
    expect(m.get("math.subtraction_within_100")?.prerequisite).toBe("math.place_value_100");
    expect(m.get("math.place_value_100")?.decision).toBe("check_prerequisite");
    expect(m.get("math.place_value_100")?.prerequisite).toBe("math.counting_to_30");
    expect(m.get("math.counting_to_30")?.decision).toBe("try_transfer");

    // "Never bounces back and forth": recommend() is deterministic and takes
    // the weakest, which is regrouping at 20%.
    expect(recommend(rows, { now: NOW }).skillKey).toBe("math.subtraction_within_100");
    expect(recommend(rows, { now: NOW }).skillKey).toBe("math.subtraction_within_100");
  });

  it("LC-03 inconsistent attention does not make the decision thrash", () => {
    const s1 = run("s1", 5, 5);
    const s2 = [
      ...run("s2", 1, 2),
      ...Array.from({ length: 3 }, (_, i) =>
        obs({ sessionId: "s2", itemId: `sk${i}`, status: "skipped", score: null, maxPoints: null }),
      ),
    ];
    const s3 = run("s3", 4, 5);

    expect(decide(s1)).toBe("collect_more_evidence");
    const afterTwo = decide([...s1, ...s2]);
    const afterThree = decide([...s1, ...s2, ...s3]);
    for (const d of [afterTwo, afterThree]) {
      expect(["try_transfer", "practise_same_skill"]).toContain(d);
      expect(d).not.toBe("check_prerequisite");
    }
    // The skipped three never became zeros.
    expect(recommend([...s1, ...s2, ...s3], { now: NOW }).evidence.maxPoints).toBe(12);
  });

  it("LC-04 excluded timed items leave the untimed evidence intact", () => {
    const rows = [
      ...run("s1", 5, 5, {}, "u"),
      ...run("s2", 5, 5, {}, "u"),
      ...run("s1", 1, 5, { excludeFromAdaptation: true }, "t"),
      ...run("s2", 2, 5, { excludeFromAdaptation: true }, "t"),
    ];
    const r = recommend(rows, { now: NOW });
    expect(r.evidence.score).toBe(10);
    expect(r.evidence.maxPoints).toBe(10);
    expect(r.decision).toBe("try_transfer");
  });

  it("LC-05 multi-step failures practise rather than step down", () => {
    const rows = [
      ...run("s1", 4, 4, {}, "one"),
      ...run("s2", 4, 4, {}, "one"),
      ...run("s1", 0, 3, {}, "two"),
      ...run("s2", 0, 3, {}, "two"),
    ];
    const r = recommend(rows, { now: NOW });
    expect(r.evidence.score).toBe(8);
    expect(r.evidence.maxPoints).toBe(14);
    expect(r.decision).toBe("practise_same_skill");
    // "The evidence view must make the pattern obvious": every item is there
    // for the adult to read, not just the total.
    expect(r.evidence.items).toHaveLength(14);
  });

  it("LC-07 an unsure answer waits at pending_review, then counts once confirmed", () => {
    const unsure = [
      obs({ sessionId: "s1", itemId: "u1", status: "pending_review", score: null, maxPoints: null }),
      obs({ sessionId: "s1", itemId: "u2", status: "pending_review", score: null, maxPoints: null }),
    ];
    const rest = [...run("s1", 4, 4), ...run("s2", 4, 4)];

    const before = recommend([...rest, ...unsure], { now: NOW });
    expect(before.evidence.maxPoints).toBe(8);
    expect(before.evidence.items.some((i) => i.status !== "scored")).toBe(false);

    const confirmed = unsure.map((u) => ({ ...u, status: "scored" as const, score: 1, maxPoints: 1 }));
    const after = recommend([...rest, ...confirmed], { now: NOW });
    expect(after.evidence.maxPoints).toBe(10);
  });

  it("LC-08 accommodated phonics items keep the progression moving", () => {
    const rows = [
      ...run("s1", 4, 5, { skillId: "phonics.digraphs", modeOfSupport: "accommodated" }),
      ...run("s2", 4, 5, { skillId: "phonics.digraphs", modeOfSupport: "accommodated" }),
    ];
    const r = recommend(rows, { now: NOW });
    expect(r.decision).toBe("try_transfer");
    expect(r.decision).not.toBe("check_prerequisite");
  });

  it("LC-11 a refused session is not a zero", () => {
    const s1 = Array.from({ length: 6 }, (_, i) =>
      obs({ sessionId: "s1", itemId: `q${i + 1}`, status: "skipped", score: null, maxPoints: null }),
    );
    const s2 = run("s2", 2, 2);
    const s3 = run("s3", 4, 5);

    expect(decide([...s1, ...s2])).toBe("collect_more_evidence");

    const r = recommend([...s1, ...s2, ...s3], { now: NOW });
    expect(r.decision).toBe("try_transfer");
    expect(r.evidence.sessionIds.sort()).toEqual(["s2", "s3"]); // s1 contributes nothing
    expect(r.evidence.percent).not.toBe(0);
    expect(r.evidence.items.some((i) => i.sessionId === "s1")).toBe(false);
  });

  it("LC-12 translated key words leave maths countable; Spanish is not Language", () => {
    const rows = [
      ...run("s1", 5, 5, { skillId: "math.subtraction_within_100", modeOfSupport: "accommodated" }, "m"),
      ...run("s2", 4, 5, { skillId: "math.subtraction_within_100", modeOfSupport: "accommodated" }, "m"),
      ...run("s1", 4, 4, { skillId: "phonics.digraphs", modeOfSupport: "prompted" }, "l"),
      ...run("s2", 4, 4, { skillId: "phonics.digraphs", modeOfSupport: "prompted" }, "l"),
      ...run("s1", 4, 4, { skillId: "enrichment.spanish" }, "e"),
      ...run("s2", 4, 4, { skillId: "enrichment.spanish" }, "e"),
    ];
    const m = byKey(rows);
    expect(m.get("math.subtraction_within_100")?.decision).toBe("try_transfer");
    // Language is all prompted, so there is nothing to decide from yet.
    expect(m.has("phonics.digraphs")).toBe(false);
    expect(decide(rows.filter((r) => r.skillId === "phonics.digraphs"))).toBe(
      "collect_more_evidence",
    );
    // Spanish stays its own group and never merges into Language.
    expect(m.get("enrichment.spanish")?.evidence.items.every((i) => i.skillId === "enrichment.spanish")).toBe(true);
    expect(m.get("phonics.digraphs")).toBeUndefined();
  });

  it("LC-14 a six-week gap means the decision rests on the new evidence only", () => {
    const sept = "2026-09-20T10:00:00Z";
    const old = [
      ...run("sept1", 5, 5, { sessionClosedAt: sept, createdAt: sept }),
      ...run("sept2", 5, 5, { sessionClosedAt: sept, createdAt: sept }),
    ];
    const nov1 = run("nov1", 1, 5);
    const nov2 = run("nov2", 2, 5);

    expect(decide([...old, ...nov1])).toBe("collect_more_evidence");

    const r = recommend([...old, ...nov1, ...nov2], { now: NOW });
    expect(r.evidence.score).toBe(3);
    expect(r.evidence.maxPoints).toBe(10);
    expect(r.decision).toBe("check_prerequisite");
  });

  it("LC-16 every filter at once", () => {
    // The sheet heads this "S1 (10 items)" and then lists eleven; its own
    // expected numbers (5/6 in S1, 9/11 overall) need eleven, so eleven it is.
    const s1: ObservationRow[] = [
      ...run("s1", 3, 3, {}, "ind_right"),                                    // counted 3/3
      obs({ sessionId: "s1", itemId: "ind_wrong", score: 0 }),                // counted 0/1
      obs({ sessionId: "s1", itemId: "ind_wrong", attempt: 2, score: 1 }),    // retry, ignored
      ...run("s1", 2, 2, { modeOfSupport: "accommodated" }, "acc"),           // counted 2/2
      ...run("s1", 2, 2, { modeOfSupport: "prompted" }, "pro"),               // not counted
      obs({ sessionId: "s1", itemId: "mod", modeOfSupport: "modelled" }),     // not counted
      obs({ sessionId: "s1", itemId: "timed", score: 0, excludeFromAdaptation: true }),
      obs({ sessionId: "s1", itemId: "skip", status: "skipped", score: null, maxPoints: null }),
    ];
    const s2 = run("s2", 4, 5, {}, "b");

    const r = recommend([...s1, ...s2], { now: NOW });
    const inS1 = r.evidence.items.filter((i) => i.sessionId === "s1");
    expect(inS1).toHaveLength(6);
    expect(inS1.reduce((n, i) => n + (i.score ?? 0), 0)).toBe(5);

    expect(r.evidence.score).toBe(9);
    expect(r.evidence.maxPoints).toBe(11);
    expect(r.evidence.percent).toBeCloseTo(9 / 11, 10);
    expect(r.decision).toBe("try_transfer");
    expect(r.evidence.items).toHaveLength(11);
  });

  it("LC-17 a looping prerequisite chain is rejected", () => {
    const node = (id: string, prerequisiteIds: string[]): SkillNode => ({
      id,
      subject: "math",
      label: id,
      minGrade: "1",
      prerequisiteIds,
      terms: [],
    });

    const loop = validateSkillGraph([node("a", ["b"]), node("b", ["a"])]);
    expect(loop.some((p) => p.kind === "cycle")).toBe(true);
    expect(loop.find((p) => p.kind === "cycle")?.message).toMatch(/loop/);

    const longer = validateSkillGraph([node("a", ["b"]), node("b", ["c"]), node("c", ["a"])]);
    expect(longer.some((p) => p.kind === "cycle")).toBe(true);

    expect(validateSkillGraph([node("a", ["a"])]).some((p) => p.kind === "self")).toBe(true);
    expect(validateSkillGraph([node("a", ["nope"])]).some((p) => p.kind === "dangling")).toBe(true);

    // A sound chain reports nothing, and so does the graph we ship.
    expect(validateSkillGraph([node("a", ["b"]), node("b", [])])).toEqual([]);
    expect(validateSkillGraph()).toEqual([]);
  });

  it("LC-18 the bottom of the chain still tells the adult what to do", () => {
    const rows = [
      ...run("s1", 1, 3, { skillId: "math.counting_to_30" }),
      ...run("s2", 1, 3, { skillId: "math.counting_to_30" }),
    ];
    const r = recommend(rows, { now: NOW });
    expect(r.decision).toBe("check_prerequisite");
    expect(r.prerequisite).toBeNull();
    expect(r.reason).toMatch(/first step in the sequence/);
    expect(r.reason).toMatch(/smaller pieces/);
    expect(r.reason).not.toMatch(/null|undefined|unmapped|prerequisite/i);
  });
});
