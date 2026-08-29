import { describe, expect, it } from "vitest";
import {
  continuityFor,
  feedbackLabel,
  feedbackSteer,
  type ProgressRow,
  type SessionRow,
} from "@/lib/continuity";

/**
 * The dashboard's job is to hand back the thread, not to guess at it. Every
 * field on a Continue card is read from a stored plan; a fabricated
 * "recommended next" about a real child is the same sin as an invented
 * expectation (CLAUDE.md §6).
 */

const CHILD = "child-1";
const OTHER = "child-2";

function session(over: Partial<SessionRow> & { id: string }): SessionRow {
  return {
    child_id: CHILD,
    subject: "language",
    created_at: "2026-08-20T10:00:00Z",
    analysis_result: {
      whatToTeachNext: ["Blend CVC words", "Read vowel teams", "Retell in order"],
      nextStepPlan: "Next time, move from vowel teams to r-controlled vowels.",
    },
    ...over,
  };
}

describe("continuityFor", () => {
  it("says there is nothing to continue when there is nothing to continue", () => {
    const c = continuityFor(CHILD, [], []);
    expect(c.last).toBeNull();
    expect(c.sessionCount).toBe(0);
    expect(c.feedback).toBeNull();
  });

  it("takes the newest session, trusting the caller's order", () => {
    const c = continuityFor(
      CHILD,
      [session({ id: "new" }), session({ id: "old" })],
      []
    );
    expect(c.last?.id).toBe("new");
    expect(c.sessionCount).toBe(2);
  });

  it("never picks up another child's session", () => {
    const c = continuityFor(
      CHILD,
      [session({ id: "theirs", child_id: OTHER }), session({ id: "mine" })],
      []
    );
    expect(c.last?.id).toBe("mine");
    expect(c.sessionCount).toBe(1);
  });

  it("carries what the last plan taught, capped at the top three", () => {
    const c = continuityFor(CHILD, [session({ id: "s1" })], []);
    expect(c.last?.taught).toHaveLength(3);
    expect(c.last?.taught[0]).toBe("Blend CVC words");
  });

  it("carries the plan's own next step rather than writing one", () => {
    const c = continuityFor(CHILD, [session({ id: "s1" })], []);
    expect(c.last?.nextStepPlan).toContain("r-controlled vowels");
  });

  it("returns null rather than inventing a next step when the plan had none", () => {
    const c = continuityFor(
      CHILD,
      [session({ id: "s1", analysis_result: { whatToTeachNext: ["x"] } })],
      []
    );
    expect(c.last?.nextStepPlan).toBeNull();
    expect(c.last?.taught).toEqual(["x"]);
  });

  it("treats a whitespace-only next step as none", () => {
    const c = continuityFor(
      CHILD,
      [session({ id: "s1", analysis_result: { nextStepPlan: "   " } })],
      []
    );
    expect(c.last?.nextStepPlan).toBeNull();
  });

  it("survives a session row with no analysis at all", () => {
    const c = continuityFor(CHILD, [session({ id: "s1", analysis_result: null })], []);
    expect(c.last?.taught).toEqual([]);
    expect(c.last?.nextStepPlan).toBeNull();
  });

  it("attaches the rating given for that session", () => {
    const progress: ProgressRow[] = [
      { sessionId: "s1", childId: CHILD, parentFeedback: "too_hard", notes: "Froze on the third syllable." },
    ];
    const c = continuityFor(CHILD, [session({ id: "s1" })], progress);
    expect(c.feedback).toBe("too_hard");
    expect(c.note).toBe("Froze on the third syllable.");
  });

  it("does not attach an older session's rating to a newer plan", () => {
    const progress: ProgressRow[] = [
      { sessionId: "older", childId: CHILD, parentFeedback: "too_easy", notes: null },
    ];
    const c = continuityFor(
      CHILD,
      [session({ id: "newer" }), session({ id: "older" })],
      progress
    );
    expect(c.feedback).toBeNull();
  });

  it("leaves an unanswered question unanswered", () => {
    // Nobody rating it is not the same as it going fine.
    const c = continuityFor(CHILD, [session({ id: "s1" })], []);
    expect(c.feedback).toBeNull();
    expect(feedbackLabel(c.feedback)).toBeNull();
    expect(feedbackSteer(c.feedback)).toBeNull();
  });

  it("treats an empty note as no note", () => {
    const progress: ProgressRow[] = [
      { sessionId: "s1", childId: CHILD, parentFeedback: "just_right", notes: "  " },
    ];
    expect(continuityFor(CHILD, [session({ id: "s1" })], progress).note).toBeNull();
  });
});

describe("feedback wording", () => {
  it("names each rating in the adult's words", () => {
    expect(feedbackLabel("too_easy")).toBe("Too easy");
    expect(feedbackLabel("just_right")).toBe("Just right");
    expect(feedbackLabel("too_hard")).toBe("Too hard");
  });

  it("steps down after too hard and up after too easy", () => {
    expect(feedbackSteer("too_hard")).toMatch(/back a step/i);
    expect(feedbackSteer("too_easy")).toMatch(/step it up/i);
    expect(feedbackSteer("just_right")).toMatch(/move on/i);
  });

  it("never describes the child, only the work", () => {
    // CLAUDE.md §7: we adapt the plan, we do not label the child.
    for (const f of ["too_easy", "just_right", "too_hard"] as const) {
      expect(feedbackSteer(f)).not.toMatch(/\b(struggling|behind|slow|weak|bad)\b/i);
    }
  });
});
