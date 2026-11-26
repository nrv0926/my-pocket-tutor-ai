import { describe, expect, it } from "vitest";
import { recommend, qualifies, groupKey, type ObservationRow } from "@/lib/recommend";
import { ASSESSMENT_DEFAULTS } from "@/lib/config/assessment";
import type { ModeOfSupport } from "@/types/progress";

/**
 * DERIVED FROM THE HANDOFF ACCEPTANCE TABLE — not ported from it.
 *
 * docs/assessment/Pocket_Tutor_Assessment_Handoff.md carries an eleven-row
 * acceptance table written in prose, and a reference module with no tests
 * of its own. There was nothing to port unchanged. Three of those rows
 * bear on recommend(); they are named below where they are covered. The
 * other eight belong to modules outside Phase 2 (calendarPattern,
 * scoreNumber, markRubric, print and student views, item versioning,
 * curriculum mapping) and are listed at the foot of this file so the gap
 * stays visible rather than being quietly forgotten.
 *
 * No database and no model calls. Every clock is passed in.
 */

const NOW = new Date("2026-11-26T12:00:00.000Z");
const recent = (daysAgo: number) =>
  new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString();

let seq = 0;
function obs(p: Partial<ObservationRow> = {}): ObservationRow {
  seq += 1;
  return {
    itemId: `q${seq}`,
    sessionId: "s1",
    sessionClosedAt: recent(1),
    skillId: null,
    topicId: "math.borrowing",
    modeOfSupport: "independent" as ModeOfSupport,
    status: "scored",
    score: 1,
    maxPoints: 1,
    attempt: 1,
    excludeFromAdaptation: false,
    createdAt: recent(1),
    ...p,
  };
}

/** n items in one session, `right` of them fully correct. */
function session(id: string, right: number, total: number, p: Partial<ObservationRow> = {}) {
  return Array.from({ length: total }, (_, i) =>
    obs({ sessionId: id, score: i < right ? 1 : 0, ...p }),
  );
}

const run = (rows: ObservationRow[], o = {}) => recommend(rows, { now: NOW, ...o });

// ---------------------------------------------------------------------
// Acceptance table row: "Two independent sessions with 5/6 full-credit
// items overall and success in each | Try transfer. With 2/6, check a
// prerequisite. With 4/6, practise the same skill."
// ---------------------------------------------------------------------
describe("table row: two sessions, 5/6, 2/6, 4/6", () => {
  it("5 of 6 with success in each -> try_transfer", () => {
    const r = run([...session("s1", 3, 3), ...session("s2", 2, 3)]);
    expect(r.decision).toBe("try_transfer");
    expect(r.evidence.score).toBe(5);
    expect(r.evidence.maxPoints).toBe(6);
    expect(r.skillKey).toBe("math.borrowing");
  });

  it("2 of 6 -> check_prerequisite", () => {
    const r = run([...session("s1", 1, 3), ...session("s2", 1, 3)]);
    expect(r.decision).toBe("check_prerequisite");
    expect(r.evidence.score).toBe(2);
  });

  it("4 of 6 -> practise_same_skill", () => {
    const r = run([...session("s1", 2, 3), ...session("s2", 2, 3)]);
    expect(r.decision).toBe("practise_same_skill");
    expect(r.evidence.score).toBe(4);
  });

  it("check_prerequisite says so plainly when none is mapped", () => {
    const r = run([...session("s1", 1, 3), ...session("s2", 1, 3)]);
    expect(r.prerequisite).toBeNull();
    // Scenario LC-18: the field is read by a parent, so it has to name an
    // action, not report a missing graph edge.
    expect(r.reason).toMatch(/first step in the sequence/);
  });
});

// ---------------------------------------------------------------------
// Acceptance table row: "Only skipped or assisted evidence | Insufficient
// independent evidence. The app still shows what happened..."
// ---------------------------------------------------------------------
describe("table row: only skipped or assisted evidence", () => {
  it("prompted work alone is not evidence", () => {
    const r = run([
      ...session("s1", 3, 3, { modeOfSupport: "prompted" }),
      ...session("s2", 3, 3, { modeOfSupport: "prompted" }),
    ]);
    expect(r.decision).toBe("collect_more_evidence");
    expect(r.skillKey).toBeNull();
  });

  it("modelled work alone is not evidence either", () => {
    const r = run([
      ...session("s1", 3, 3, { modeOfSupport: "modelled" }),
      ...session("s2", 3, 3, { modeOfSupport: "modelled" }),
    ]);
    expect(r.decision).toBe("collect_more_evidence");
  });

  it("skipped items are not evidence", () => {
    const r = run([
      ...session("s1", 0, 3, { status: "skipped", score: null, maxPoints: null }),
      ...session("s2", 0, 3, { status: "skipped", score: null, maxPoints: null }),
    ]);
    expect(r.decision).toBe("collect_more_evidence");
  });

  it("still shows what happened, so the page is not blank", () => {
    const rows = session("s1", 2, 3, { modeOfSupport: "prompted" });
    const r = run(rows);
    expect(r.decision).toBe("collect_more_evidence");
    expect(r.reason).toMatch(/Nothing has been recorded|Not enough yet/);
  });

  it("help that did not supply the skill DOES count", () => {
    const r = run([
      ...session("s1", 3, 3, { modeOfSupport: "accommodated" }),
      ...session("s2", 2, 3, { modeOfSupport: "accommodated" }),
    ]);
    expect(r.decision).toBe("try_transfer");
  });
});

// ---------------------------------------------------------------------
// Acceptance table row: "Marked answer arrives twice or an adult refreshes
// during submission | Single official result and unchanged recommendation."
// (The idempotent write is Phase 1's server action; this is the half that
// belongs to recommend: a retry must not move the answer.)
// ---------------------------------------------------------------------
describe("table row: a retry leaves the recommendation unchanged", () => {
  const first = [...session("s1", 2, 3), ...session("s2", 2, 3)];

  it("attempt 2 is ignored, however well it went", () => {
    const retried = [...first, ...session("s1", 3, 3, { attempt: 2 })];
    expect(run(retried).decision).toBe(run(first).decision);
    expect(run(retried).evidence.score).toBe(run(first).evidence.score);
  });

  it("a retry cannot turn practise into transfer", () => {
    const retried = [...first, ...session("s2", 3, 3, { attempt: 2 })];
    expect(run(retried).decision).toBe("practise_same_skill");
  });
});

// ---------------------------------------------------------------------
// Boundaries and exclusions
// ---------------------------------------------------------------------
describe("the boundaries themselves", () => {
  it("exactly 50% practises rather than stepping down", () => {
    const r = run([...session("s1", 1, 2), ...session("s2", 1, 2)]);
    expect(r.evidence.percent).toBe(0.5);
    expect(r.decision).toBe("practise_same_skill");
  });

  it("a hair under 50% steps down", () => {
    // 2/5 = 0.4
    const r = run([...session("s1", 1, 2), ...session("s2", 1, 3)]);
    expect(r.decision).toBe("check_prerequisite");
  });

  it("exactly 80% transfers", () => {
    const r = run([...session("s1", 4, 5), ...session("s2", 4, 5)]);
    expect(r.evidence.percent).toBe(0.8);
    expect(r.decision).toBe("try_transfer");
  });

  it("a hair under 80% practises", () => {
    // 7/9 = 0.777…
    const r = run([...session("s1", 4, 5), ...session("s2", 3, 4)]);
    expect(r.decision).toBe("practise_same_skill");
  });

  it("the bands come from config, not from the code", () => {
    const rows = [...session("s1", 1, 2), ...session("s2", 1, 2)]; // 50%
    expect(run(rows, { transferAtOrAbove: 0.5 }).decision).toBe("try_transfer");
    expect(run(rows, { prerequisiteBelow: 0.6 }).decision).toBe("check_prerequisite");
  });
});

describe("what is left out of the count", () => {
  it("items the adult flagged as off-target", () => {
    const r = run([
      ...session("s1", 2, 2),
      ...session("s2", 2, 2),
      ...session("s2", 0, 4, { excludeFromAdaptation: true }),
    ]);
    expect(r.evidence.maxPoints).toBe(4);
    expect(r.decision).toBe("try_transfer");
  });

  it("sessions outside the window", () => {
    const r = run([
      ...session("s1", 2, 2, { sessionClosedAt: recent(2) }),
      ...session("s2", 2, 2, { sessionClosedAt: recent(90) }),
    ]);
    expect(r.decision).toBe("collect_more_evidence");
  });

  it("a session the adult never closed", () => {
    const r = run([
      ...session("s1", 2, 2),
      ...session("s2", 2, 2, { sessionClosedAt: null }),
    ]);
    expect(r.decision).toBe("collect_more_evidence");
  });

  it("a skipped item moves neither the top nor the bottom of the fraction", () => {
    const withSkips = [
      ...session("s1", 2, 2),
      ...session("s2", 1, 2),
      ...session("s2", 0, 3, { status: "skipped", score: null, maxPoints: null }),
    ];
    const r = run(withSkips);
    expect(r.evidence.score).toBe(3);
    expect(r.evidence.maxPoints).toBe(4);
  });

  it("one session with plenty of items is still one session", () => {
    expect(run(session("s1", 9, 10)).decision).toBe("collect_more_evidence");
  });

  it("two sessions with only one item each are not enough", () => {
    const r = run([...session("s1", 1, 1), ...session("s2", 1, 1)]);
    expect(r.decision).toBe("collect_more_evidence");
  });

  it("a row with neither skill nor topic cannot name a next step", () => {
    const r = run([
      ...session("s1", 2, 2, { topicId: null }),
      ...session("s2", 2, 2, { topicId: null }),
    ]);
    expect(r.decision).toBe("collect_more_evidence");
    expect(groupKey(obs({ topicId: null }))).toBeNull();
  });
});

describe("choosing between skills", () => {
  it("picks the weakest, because that is where to start", () => {
    const r = run([
      ...session("a1", 2, 2, { topicId: "strong" }),
      ...session("a2", 2, 2, { topicId: "strong" }),
      ...session("b1", 0, 2, { topicId: "weak" }),
      ...session("b2", 0, 2, { topicId: "weak" }),
    ]);
    expect(r.skillKey).toBe("weak");
    expect(r.decision).toBe("check_prerequisite");
  });

  it("prefers skill_id over topic_id when both are present", () => {
    const r = run([
      ...session("s1", 2, 2, { skillId: "phonics.cvc", topicId: "ignored" }),
      ...session("s2", 2, 2, { skillId: "phonics.cvc", topicId: "ignored" }),
    ]);
    expect(r.skillKey).toBe("phonics.cvc");
  });

  it("is deterministic when two skills tie", () => {
    const rows = [
      ...session("a1", 1, 2, { topicId: "bbb" }),
      ...session("a2", 1, 2, { topicId: "bbb" }),
      ...session("b1", 1, 2, { topicId: "aaa" }),
      ...session("b2", 1, 2, { topicId: "aaa" }),
    ];
    expect(run(rows).skillKey).toBe(run([...rows].reverse()).skillKey);
  });
});

describe("evidence is shown, not just asserted", () => {
  it("returns the exact rows and sessions it counted", () => {
    const r = run([...session("s1", 2, 3), ...session("s2", 2, 3)]);
    expect(r.evidence.items).toHaveLength(6);
    expect(r.evidence.sessionIds.sort()).toEqual(["s1", "s2"]);
    expect(r.evidence.items.every((i) => i.attempt === 1)).toBe(true);
  });

  it("qualifies() is the single gate, and says no for each reason", () => {
    const cutoff = new Date(NOW.getTime() - 30 * 86_400_000);
    expect(qualifies(obs(), cutoff)).toBe(true);
    expect(qualifies(obs({ attempt: 2 }), cutoff)).toBe(false);
    expect(qualifies(obs({ status: "skipped" }), cutoff)).toBe(false);
    expect(qualifies(obs({ status: "pending_review" }), cutoff)).toBe(false);
    expect(qualifies(obs({ modeOfSupport: "prompted" }), cutoff)).toBe(false);
    expect(qualifies(obs({ modeOfSupport: "modelled" }), cutoff)).toBe(false);
    expect(qualifies(obs({ modeOfSupport: "accommodated" }), cutoff)).toBe(true);
    expect(qualifies(obs({ excludeFromAdaptation: true }), cutoff)).toBe(false);
    expect(qualifies(obs({ sessionClosedAt: null }), cutoff)).toBe(false);
    expect(qualifies(obs({ maxPoints: 0 }), cutoff)).toBe(false);
    expect(qualifies(obs({ sessionClosedAt: recent(60) }), cutoff)).toBe(false);
  });
});

describe("the one place the reference adds a rule the blueprint did not", () => {
  // See AssessmentConfig.requireSuccessInEverySession. Flagged for review.
  const rows = [...session("s1", 5, 5), ...session("s2", 0, 2)]; // 5/7 = 71%
  const strong = [...session("s1", 8, 8), ...session("s2", 0, 2)]; // 8/10 = 80%

  it("by default a session with nothing right blocks transfer", () => {
    expect(run(strong).decision).toBe("practise_same_skill");
    expect(run(strong).reason).toMatch(/one whole session had nothing right/);
  });

  it("turning the gate off follows the percentage alone", () => {
    expect(run(strong, { requireSuccessInEverySession: false }).decision).toBe("try_transfer");
  });

  it("the gate never changes a decision below the transfer band", () => {
    expect(run(rows).decision).toBe("practise_same_skill");
    expect(run(rows, { requireSuccessInEverySession: false }).decision).toBe("practise_same_skill");
  });
});

describe("no achievement levels anywhere", () => {
  it("the config carries no 1-4 scale", () => {
    const serialized = JSON.stringify(ASSESSMENT_DEFAULTS);
    expect(serialized).not.toMatch(/level/i);
    expect(ASSESSMENT_DEFAULTS.prerequisiteBelow).toBeLessThan(ASSESSMENT_DEFAULTS.transferAtOrAbove);
  });

  it("a recommendation never carries a level", () => {
    const r = run([...session("s1", 2, 3), ...session("s2", 2, 3)]);
    expect(JSON.stringify({ d: r.decision, k: r.skillKey, p: r.evidence.percent })).not.toMatch(/level/i);
  });
});

/**
 * NOT COVERED HERE, and why — the other eight acceptance-table rows:
 *
 *  · ISO calendar fixture            -> calendarPattern, not built
 *  · Numeric answers 1,200 / 0 / 1,2 -> scoreNumber, not built
 *  · APE, one of two criteria        -> markRubric, Phase 4
 *  · Sound cue before a correct read -> capture UI; the data side is
 *                                       Phase 1's mode_of_support
 *  · Old snapshot, later bank edits  -> item versioning, out of scope
 *  · Expectation unavailable         -> curriculum mapping, Phase 3
 *  · Student view or student PDF     -> learner surface, out of scope
 *  · Grade 5 takes a Grade 4 check   -> enrolled vs instructional grade,
 *                                       already separate fields today
 */
