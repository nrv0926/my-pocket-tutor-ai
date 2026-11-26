import { describe, expect, it } from "vitest";
import {
  markRubric,
  rubricMaxPoints,
  suggestionDiverged,
  RubricShapeError,
  type RubricCriterion,
} from "@/lib/rubric";

/**
 * DERIVED FROM THE HANDOFF ACCEPTANCE TABLE — not ported.
 *
 * The row this covers: "Correct APE answer with one of two reasoning
 * criteria met | 2/3 after adult confirmation. The answer can earn credit
 * even when reasoning is incomplete. A missing criterion means pending
 * review until the adult explicitly chooses a mark, including zero."
 */
const APE: RubricCriterion[] = [
  { id: "answer", label: "Found the answer", maxPoints: 1 },
  { id: "prove", label: "Showed how", maxPoints: 1 },
  { id: "explain", label: "Explained the rule", maxPoints: 1 },
];

describe("table row: APE, one of two reasoning criteria met", () => {
  it("scores 2 of 3 once the adult has confirmed", () => {
    const r = markRubric(APE, { answer: 1, prove: 1, explain: 0 });
    expect(r.status).toBe("scored");
    expect(r.score).toBe(2);
    expect(r.maxPoints).toBe(3);
  });

  it("the answer earns credit even when the reasoning does not", () => {
    expect(markRubric(APE, { answer: 1, prove: 0, explain: 0 }).score).toBe(1);
  });

  it("a missing criterion holds the whole item at pending review", () => {
    const r = markRubric(APE, { answer: 1, prove: 1 });
    expect(r.status).toBe("pending_review");
    expect(r.score).toBeNull();
  });

  it("zero is a mark, and has to be chosen", () => {
    // The distinction the row insists on: unmarked is not zero.
    expect(markRubric(APE, { answer: 1, prove: 1, explain: 0 }).status).toBe("scored");
    expect(markRubric(APE, { answer: 1, prove: 1, explain: null }).status).toBe(
      "pending_review",
    );
  });

  it("says which criteria are still waiting on a person", () => {
    expect(markRubric(APE, { answer: 1 }).awaiting).toEqual(["prove", "explain"]);
  });

  it("nothing confirmed yet is the ordinary opening state, not an error", () => {
    expect(markRubric(APE, null).status).toBe("pending_review");
    expect(markRubric(APE, undefined).awaiting).toHaveLength(3);
    expect(markRubric(APE, {}).awaiting).toHaveLength(3);
  });
});

describe("what a rubric refuses", () => {
  it("an empty rubric", () => {
    expect(() => markRubric([], {})).toThrow(RubricShapeError);
  });

  it("two criteria with the same id", () => {
    expect(() =>
      markRubric([APE[0], { ...APE[1], id: "answer" }], {}),
    ).toThrow(/Duplicate criterion id/);
  });

  it("a criterion worth no points", () => {
    expect(() => markRubric([{ id: "a", label: "x", maxPoints: 0 }], {})).toThrow(
      RubricShapeError,
    );
  });

  it("a score above the criterion's maximum", () => {
    expect(() => markRubric(APE, { answer: 2, prove: 1, explain: 1 })).toThrow(
      /between 0 and 1/,
    );
  });

  it("a negative or fractional score", () => {
    expect(() => markRubric(APE, { answer: -1, prove: 1, explain: 1 })).toThrow();
    expect(() => markRubric(APE, { answer: 0.5, prove: 1, explain: 1 })).toThrow();
  });

  it("totals correctly across uneven criteria", () => {
    const uneven: RubricCriterion[] = [
      { id: "places", label: "Two places named", maxPoints: 2 },
      { id: "reasons", label: "A reason for each", maxPoints: 2 },
      { id: "order", label: "Hangs together", maxPoints: 1 },
    ];
    expect(rubricMaxPoints(uneven)).toBe(5);
    expect(markRubric(uneven, { places: 2, reasons: 1, order: 1 }).score).toBe(4);
  });
});

describe("the suggestion is kept beside the confirmation", () => {
  it("notices when an adult overruled the app", () => {
    expect(suggestionDiverged(3, 2)).toBe(true);
  });

  it("stays quiet when they agree", () => {
    expect(suggestionDiverged(2, 2)).toBe(false);
  });

  it("claims nothing when there was no suggestion or no decision", () => {
    expect(suggestionDiverged(null, 2)).toBe(false);
    expect(suggestionDiverged(undefined, 2)).toBe(false);
    expect(suggestionDiverged(2, null)).toBe(false);
  });
});
