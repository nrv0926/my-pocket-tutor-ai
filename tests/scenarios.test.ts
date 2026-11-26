import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { recommend, recommendAll, type ObservationRow } from "@/lib/recommend";
import { assignQuestionIds, WorksheetShapeError } from "@/lib/worksheetIds";
import type { AnalysisResult } from "@/types/session";

/**
 * The scenarios from Pocket_Tutor___Assessment_Engine_Test_Scenarios.xlsx,
 * one test per ID so a run fills in that sheet's Status column directly.
 *
 * Only the rows the sheet marks "Unit test" are here. The "SQL" rows live in
 * supabase/tests/assessment.sql and rls.sql; the "Manual (app)" rows need a
 * Supabase project, a signed-in adult and a saved profile, and are reported
 * as blocked rather than quietly skipped.
 *
 * Fixtures are transcribed from the Steps column, not reinterpreted. Where a
 * row's stated expectation disagrees with the code, the test records what the
 * code does and the disagreement is raised in the report — see R-03.
 */

const NOW = new Date("2026-11-26T12:00:00Z");
const RECENT = "2026-11-20T10:00:00Z";

const obs = (over: Partial<ObservationRow> = {}): ObservationRow => ({
  itemId: "q1",
  sessionId: "s1",
  sessionClosedAt: RECENT,
  skillId: "regrouping",
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

/** `right` of `total` items full credit, in one session. */
const session = (
  sessionId: string,
  right: number,
  total: number,
  over: Partial<ObservationRow> = {},
): ObservationRow[] =>
  Array.from({ length: total }, (_, i) =>
    obs({ sessionId, itemId: `q${i + 1}`, score: i < right ? 1 : 0, ...over }),
  );

const decisionOf = (rows: ObservationRow[]) => recommend(rows, { now: NOW }).decision;

// ---------------------------------------------------------------- item IDs

describe("M — item IDs", () => {
  const result = (questions: unknown[], answerKey: unknown[] = []) =>
    ({
      whatINotice: "x",
      keySkillGaps: ["a", "b"],
      whatToTeachNext: ["a", "b", "c"],
      howToTeachIt: ["a", "b", "c"],
      practiceWorksheet: { title: "W", difficulty: "easy", questions },
      answerKey,
      parentTips: ["a", "b"],
      nextStepPlan: "n",
      feedbackQuestion: "Was this too easy, just right, or too hard?",
    }) as unknown as AnalysisResult;

  it("M-05 server overwrites duplicate model IDs", () => {
    const out = assignQuestionIds(
      result(
        [
          { id: "q1", prompt: "one", answer: "1", difficulty: "easy" },
          { id: "q1", prompt: "two", answer: "2", difficulty: "easy" },
          { id: "q3", prompt: "three", answer: "3", difficulty: "easy" },
        ],
        [{ questionId: "q1", answer: "1" }],
      ),
    );
    expect(out.practiceWorksheet.questions.map((q) => q.id)).toEqual(["q1", "q2", "q3"]);
    // "No error shown to the parent": repair, never throw.
    expect(out.practiceWorksheet.questions).toHaveLength(3);
  });

  it("M-06 server fills missing model IDs", () => {
    const out = assignQuestionIds(
      result([
        { prompt: "one", answer: "1", difficulty: "easy" },
        { prompt: "two", answer: "2", difficulty: "easy" },
        { prompt: "three", answer: "3", difficulty: "easy" },
      ]),
    );
    expect(out.practiceWorksheet.questions.map((q) => q.id)).toEqual(["q1", "q2", "q3"]);
  });

  it("M-07 malformed worksheet is rejected cleanly", () => {
    // A question with no prompt cannot be asked.
    expect(() =>
      assignQuestionIds(result([{ answer: "1", difficulty: "easy" }])),
    ).toThrow(WorksheetShapeError);
    // A worksheet with no questions is not a worksheet.
    expect(() => assignQuestionIds(result([]))).toThrow(WorksheetShapeError);
  });
});

// -------------------------------------------------------------- recommend()

describe("R — recommend()", () => {
  it("R-01 one session only", () => {
    expect(decisionOf(session("s1", 5, 5))).toBe("collect_more_evidence");
  });

  it("R-02 second session too thin", () => {
    expect(decisionOf([...session("s1", 4, 4), ...session("s2", 1, 1)])).toBe(
      "collect_more_evidence",
    );
  });

  it("R-03 low regrouping, skill not in the graph", () => {
    // 1/4 + 1/4 = 25%. The sheet's fixture names the skill "regrouping",
    // which is not an id in data/skill-map.json, so there is nothing
    // underneath to name and the engine says so rather than inventing one.
    //
    // DEVIATION, raised in the report: R-03 quotes the reason as the exact
    // string "no prerequisite mapped". That string is gone. Scenario LC-18
    // in the same sheet asks for "a clear, useful result ... no null" at
    // the bottom of a chain, and CLAUDE.md §2 forbids jargon in a field a
    // parent reads. Both cannot hold, so the substance of R-03 is kept
    // (prerequisite is null and the card says there is nothing underneath)
    // and the developer shorthand is not.
    const r = recommend([...session("s1", 1, 4), ...session("s2", 1, 4)], { now: NOW });
    expect(r.decision).toBe("check_prerequisite");
    expect(r.prerequisite).toBeNull();
    expect(r.prerequisiteLabel).toBeNull();
    expect(r.reason).toMatch(/nothing underneath to check/);
  });

  it("R-03 (note) a mapped skill names its prerequisite", () => {
    // The sheet's note: "After Phase 3 this should name place value." That
    // needs the fixture to carry a real skill id, which this one does.
    const rows = [
      ...session("s1", 1, 4, { skillId: "math.subtraction_within_100" }),
      ...session("s2", 1, 4, { skillId: "math.subtraction_within_100" }),
    ];
    const r = recommend(rows, { now: NOW });
    expect(r.decision).toBe("check_prerequisite");
    expect(r.prerequisite).toBe("math.place_value_100");
    expect(r.prerequisiteLabel).toMatch(/place value/i);
  });

  it("R-04 exactly 50% practises, it does not drop down", () => {
    expect(decisionOf([...session("s1", 2, 4), ...session("s2", 2, 4)])).toBe(
      "practise_same_skill",
    );
  });

  it("R-05 just under 50% checks the prerequisite", () => {
    // 24/50 + 25/50 = 49%, counted in points rather than whole items.
    const rows = [
      obs({ sessionId: "s1", itemId: "a", score: 12, maxPoints: 25 }),
      obs({ sessionId: "s1", itemId: "b", score: 12, maxPoints: 25 }),
      obs({ sessionId: "s2", itemId: "a", score: 12, maxPoints: 25 }),
      obs({ sessionId: "s2", itemId: "b", score: 13, maxPoints: 25 }),
    ];
    const r = recommend(rows, { now: NOW });
    expect(r.evidence.percent).toBeCloseTo(0.49, 10);
    expect(r.decision).toBe("check_prerequisite");
  });

  it("R-06 between thresholds", () => {
    expect(decisionOf([...session("s1", 3, 4), ...session("s2", 3, 4)])).toBe(
      "practise_same_skill",
    );
  });

  it("R-07 exactly 80% is ready to stretch", () => {
    expect(decisionOf([...session("s1", 4, 5), ...session("s2", 4, 5)])).toBe("try_transfer");
  });

  it("R-08 only prompted answers is not evidence", () => {
    const rows = [
      ...session("s1", 4, 4, { modeOfSupport: "prompted" }),
      ...session("s2", 4, 4, { modeOfSupport: "modelled" }),
    ];
    expect(decisionOf(rows)).toBe("collect_more_evidence");
  });

  it("R-09 accommodated counts as independent", () => {
    const rows = [
      ...session("s1", 4, 4, { modeOfSupport: "accommodated" }),
      ...session("s2", 4, 4, { modeOfSupport: "accommodated" }),
    ];
    expect(decisionOf(rows)).toBe("try_transfer");
  });

  it("R-10 an excluded speed round does not drag the score down", () => {
    const rows = [
      ...session("s1", 5, 5),
      ...session("s1", 1, 4, { excludeFromAdaptation: true, itemId: "speed" }).map((r, i) => ({
        ...r,
        itemId: `speed${i + 1}`,
      })),
      ...session("s2", 4, 5),
    ];
    const r = recommend(rows, { now: NOW });
    expect(r.evidence.score).toBe(9);
    expect(r.evidence.maxPoints).toBe(10);
    expect(r.decision).toBe("try_transfer");

    // The sheet states the counterfactual: counting the speed round would
    // give 10/14 = 71% and practise instead. Proves the exclusion is load
    // bearing and not incidentally passing.
    const ignoringExclusion = rows.map((x) => ({ ...x, excludeFromAdaptation: false }));
    const r2 = recommend(ignoringExclusion, { now: NOW });
    expect(r2.evidence.score / r2.evidence.maxPoints).toBeCloseTo(10 / 14, 10);
    expect(r2.decision).toBe("practise_same_skill");
  });

  it("R-11 retries are history, not evidence", () => {
    const rows = [
      obs({ sessionId: "s1", itemId: "q1", attempt: 1, score: 0 }),
      obs({ sessionId: "s1", itemId: "q1", attempt: 2, score: 1 }),
      obs({ sessionId: "s1", itemId: "q2", attempt: 1, score: 1 }),
      ...session("s2", 2, 2),
    ];
    const r = recommend(rows, { now: NOW });
    expect(r.evidence.score).toBe(3);
    expect(r.evidence.maxPoints).toBe(4);
    expect(r.decision).toBe("practise_same_skill");
  });

  it("R-12 skipped items are left out entirely, not scored zero", () => {
    const rows = [
      ...session("s1", 2, 2),
      obs({ sessionId: "s1", itemId: "q3", status: "skipped", score: null, maxPoints: null }),
      obs({ sessionId: "s1", itemId: "q4", status: "skipped", score: null, maxPoints: null }),
      ...session("s2", 2, 2),
    ];
    const r = recommend(rows, { now: NOW });
    expect(r.evidence.score).toBe(4);
    expect(r.evidence.maxPoints).toBe(4);
    expect(r.decision).toBe("try_transfer");
  });

  it("R-13 old evidence expires out of the window", () => {
    const old = "2026-10-12T10:00:00Z"; // 45 days before NOW
    const stale = session("s0", 0, 4, { sessionClosedAt: old, createdAt: old });
    const recent = [...session("s1", 4, 4), ...session("s2", 4, 4)];
    expect(decisionOf([...stale, ...recent])).toBe("try_transfer");
    // Variant from the same row: only one recent session.
    expect(decisionOf([...stale, ...session("s1", 4, 4)])).toBe("collect_more_evidence");
  });

  it("R-14 an unclosed session is ignored", () => {
    const rows = [
      ...session("s1", 4, 4),
      ...session("s2", 4, 4, { sessionClosedAt: null }),
    ];
    expect(decisionOf(rows)).toBe("collect_more_evidence");
  });

  it("R-15 falls back to topic_id when there is no skill_id", () => {
    const rows = [
      ...session("s1", 4, 4, { skillId: null, topicId: "regrouping" }),
      ...session("s2", 4, 4, { skillId: null, topicId: "regrouping" }),
    ];
    const r = recommend(rows, { now: NOW });
    expect(r.skillKey).toBe("regrouping");
    expect(r.decision).toBe("try_transfer");
  });

  it("R-16 skills in the same sessions are kept separate", () => {
    const rows = [
      ...session("s1", 1, 4, { skillId: "regrouping" }),
      ...session("s2", 1, 4, { skillId: "regrouping" }),
      ...session("s1", 4, 4, { skillId: "addition_facts", itemId: "f" }).map((r, i) => ({
        ...r,
        itemId: `f${i + 1}`,
      })),
      ...session("s2", 4, 4, { skillId: "addition_facts", itemId: "f" }).map((r, i) => ({
        ...r,
        itemId: `f${i + 1}`,
      })),
    ];
    const all = recommendAll(rows, { now: NOW });
    const byKey = new Map(all.map((r) => [r.skillKey, r.decision]));
    expect(byKey.get("regrouping")).toBe("check_prerequisite");
    expect(byKey.get("addition_facts")).toBe("try_transfer");
    expect(all).toHaveLength(2);

    // recommend() still answers with one step, and it is the weaker skill.
    expect(recommend(rows, { now: NOW }).skillKey).toBe("regrouping");
  });

  it("R-17 evidence lists exactly the rows counted, nothing else", () => {
    const counted = [...session("s1", 2, 2), ...session("s2", 2, 2)];
    const noise = [
      obs({ sessionId: "s3", itemId: "p1", modeOfSupport: "prompted" }),
      obs({ sessionId: "s1", itemId: "q1", attempt: 2, score: 1 }),
      obs({ sessionId: "s4", itemId: "x1", sessionClosedAt: null }),
      obs({ sessionId: "s1", itemId: "sk", status: "skipped", score: null, maxPoints: null }),
    ];
    const r = recommend([...counted, ...noise], { now: NOW });
    expect(r.evidence.items).toHaveLength(counted.length);
    expect(r.evidence.items.every((i) => i.attempt === 1 && i.status === "scored")).toBe(true);
    expect([...r.evidence.sessionIds].sort()).toEqual(["s1", "s2"]);
  });

  it("R-18 the handoff acceptance table has 11 rows, not 9", () => {
    // The sheet's row R-18 says nine. The committed document says eleven.
    // Pinned here so the count cannot drift unnoticed in either direction.
    const doc = readFileSync("docs/assessment/Pocket_Tutor_Assessment_Handoff.md", "utf8");
    const section = doc.split("## Acceptance cases")[1].split("\n## ")[0];
    const rows = section
      .split("\n")
      .filter((l) => l.trim().startsWith("|"))
      .filter((l) => !/^\|[-: |]+\|$/.test(l.trim()))
      .slice(1); // drop the header row
    expect(rows).toHaveLength(11);
  });

  it("R-18 the three acceptance rows that bear on recommend()", () => {
    // "Two independent sessions with 5/6 full-credit items overall and
    //  success in each — try transfer. With 2/6, check a prerequisite.
    //  With 4/6, practise the same skill."
    expect(decisionOf([...session("s1", 3, 3), ...session("s2", 2, 3)])).toBe("try_transfer");
    expect(decisionOf([...session("s1", 1, 3), ...session("s2", 1, 3)])).toBe(
      "check_prerequisite",
    );
    expect(decisionOf([...session("s1", 2, 3), ...session("s2", 2, 3)])).toBe(
      "practise_same_skill",
    );

    // "Only skipped or assisted evidence — insufficient independent evidence."
    expect(
      decisionOf([
        ...session("s1", 2, 2, { modeOfSupport: "prompted" }),
        obs({ sessionId: "s2", itemId: "q1", status: "skipped", score: null, maxPoints: null }),
      ]),
    ).toBe("collect_more_evidence");
  });

  it("R-19 is a pure function", () => {
    const rows = [...session("s1", 4, 5), ...session("s2", 4, 5)];
    const before = JSON.stringify(rows);
    const a = recommend(rows, { now: NOW });
    const b = recommend(rows, { now: NOW });
    expect(a).toEqual(b);
    expect(JSON.stringify(rows)).toBe(before); // input not mutated

    // No database or network reachable from the module at all.
    const src = readFileSync("lib/recommend.ts", "utf8");
    expect(src).not.toMatch(/supabase|fetch\(|process\.env/);
  });
});
