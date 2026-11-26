import { describe, expect, it } from "vitest";
import { itemEvidenceContext, recentFeedbackContext } from "@/lib/prompts";
import { aggregateMode, booleanToMode, modeToBoolean, INDEPENDENT_MODES } from "@/types/progress";
import type { ModeOfSupport } from "@/types/progress";

const row = (topicId: string, score: number, sessionId: string, label?: string) => ({
  topicId,
  label,
  sessionId,
  score,
  maxPoints: 1,
});

describe("what counts as the learner's own work", () => {
  it("counts help that did not supply the skill", () => {
    expect(INDEPENDENT_MODES).toContain("accommodated");
    expect(INDEPENDENT_MODES).toContain("independent");
  });

  it("does not count a prompt or a worked example", () => {
    expect(INDEPENDENT_MODES).not.toContain("prompted");
    expect(INDEPENDENT_MODES).not.toContain("modelled");
  });

  it("bridges to the deprecated boolean both ways", () => {
    const cases: [ModeOfSupport, boolean][] = [
      ["independent", true],
      ["accommodated", true],
      ["prompted", false],
      ["modelled", false],
    ];
    for (const [mode, bool] of cases) expect(modeToBoolean(mode)).toBe(bool);
    expect(booleanToMode(true)).toBe("independent");
    // false becomes the weaker claim: help was given, we do not know how much.
    expect(booleanToMode(false)).toBe("prompted");
    expect(booleanToMode(null)).toBeNull();
  });
});

describe("item evidence in the prompt", () => {
  it("says nothing when there is nothing counted", () => {
    expect(itemEvidenceContext([])).toBe("");
  });

  it("sums per topic and counts the sessions", () => {
    const ctx = itemEvidenceContext([
      row("math.borrowing", 1, "s1", "Regrouping"),
      row("math.borrowing", 0, "s1", "Regrouping"),
      row("math.borrowing", 1, "s2", "Regrouping"),
    ]);
    expect(ctx).toMatch(/Regrouping: 2\/3 right on their own, over 2 sessions/);
  });

  it("says session, not sessions, for one", () => {
    expect(itemEvidenceContext([row("t", 1, "s1", "Topic")])).toMatch(/over 1 session$|over 1 session\n/);
  });

  it("puts the weakest topic first, because that is where to start", () => {
    const ctx = itemEvidenceContext([
      row("strong", 1, "s1", "Strong"),
      row("weak", 0, "s1", "Weak"),
    ]);
    expect(ctx.indexOf("Weak:")).toBeLessThan(ctx.indexOf("Strong:"));
  });

  it("falls back to the id when no label was resolved", () => {
    expect(itemEvidenceContext([row("math.borrowing", 1, "s1")])).toMatch(/math\.borrowing:/);
  });

  it("tells the model this is a count and not a grade", () => {
    const ctx = itemEvidenceContext([row("t", 0, "s1", "T")]);
    expect(ctx).toMatch(/not as a grade/);
    expect(ctx).toMatch(/first attempts/);
  });
});

describe("it sits beside parent feedback without replacing it", () => {
  const feedback = [
    {
      createdAt: new Date().toISOString(),
      skill: "regrouping",
      difficulty: "easy" as const,
      parentFeedback: "too_hard" as const,
      completedIndependently: false,
    },
  ];

  it("keeps the felt-difficulty block as it was", () => {
    const ctx = recentFeedbackContext(feedback);
    expect(ctx).toMatch(/RECENT PARENT FEEDBACK/);
    expect(ctx).toMatch(/too_hard/);
  });

  it("appends counted evidence when there is some", () => {
    const ctx = recentFeedbackContext(feedback, {
      items: [row("math.borrowing", 1, "s1", "Regrouping")],
    });
    expect(ctx).toMatch(/RECENT PARENT FEEDBACK/);
    expect(ctx).toMatch(/WHAT THEY GOT RIGHT ON THEIR OWN/);
  });

  it("still returns the counts when no feedback was ever rated", () => {
    const ctx = recentFeedbackContext([], {
      items: [row("math.borrowing", 1, "s1", "Regrouping")],
    });
    expect(ctx).toMatch(/WHAT THEY GOT RIGHT ON THEIR OWN/);
    expect(ctx).not.toMatch(/RECENT PARENT FEEDBACK/);
  });

  it("is still empty when there is neither", () => {
    expect(recentFeedbackContext([], { items: [] })).toBe("");
  });

  it("never turns the felt rating into a score", () => {
    const ctx = recentFeedbackContext(feedback, { items: [] });
    expect(ctx).not.toMatch(/too_hard.*\d+\/\d+/);
  });
});

describe("one verdict for a whole session", () => {
  it("is independent only when nothing needed help", () => {
    expect(aggregateMode(["independent", "independent"])).toBe("independent");
  });

  it("treats accommodated work as the learner's own", () => {
    expect(aggregateMode(["independent", "accommodated"])).toBe("independent");
  });

  it("drops to prompted if anything needed a nudge", () => {
    expect(aggregateMode(["independent", "prompted", "accommodated"])).toBe("prompted");
  });

  it("drops to modelled if anything had to be shown, however little", () => {
    expect(aggregateMode(["independent", "prompted", "modelled"])).toBe("modelled");
  });

  it("an empty session claims nothing beyond independent", () => {
    expect(aggregateMode([])).toBe("independent");
  });
});
