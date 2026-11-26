import { describe, expect, it } from "vitest";
import {
  assignQuestionIds,
  positionalId,
  PracticeWorksheetSchema,
  WorksheetShapeError,
} from "@/lib/worksheetIds";
import type { AnalysisResult } from "@/types/session";

/**
 * item_observations.item_id points at these, so they cannot be left to
 * the model. The answer key joins on them, which is the part that fails
 * silently if it is got wrong: both halves still parse.
 */
const base = (questions: unknown[], answerKey: unknown[] = []) =>
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

const q = (id: string | undefined, prompt: string) => ({
  ...(id === undefined ? {} : { id }),
  prompt,
  answer: "a",
  difficulty: "easy",
});

describe("server-assigned question ids", () => {
  it("numbers by position, whatever the model sent", () => {
    const out = assignQuestionIds(base([q("zzz", "one"), q("q9", "two"), q("zzz", "three")]));
    expect(out.practiceWorksheet.questions.map((x) => x.id)).toEqual(["q1", "q2", "q3"]);
  });

  it("fills in an id that was never there", () => {
    const out = assignQuestionIds(base([q(undefined, "only")]));
    expect(out.practiceWorksheet.questions[0].id).toBe("q1");
  });

  it("keeps the questions themselves untouched", () => {
    const out = assignQuestionIds(base([q("zzz", "one"), q("yyy", "two")]));
    expect(out.practiceWorksheet.questions.map((x) => x.prompt)).toEqual(["one", "two"]);
  });

  it("does not mutate the input", () => {
    const input = base([q("zzz", "one")]);
    assignQuestionIds(input);
    expect(input.practiceWorksheet.questions[0].id).toBe("zzz");
  });
});

describe("the answer key follows the questions", () => {
  it("remaps by old id, so answers stay with their question", () => {
    const out = assignQuestionIds(
      base(
        [q("zzz", "one"), q("mmm", "two"), q("q9", "three")],
        [
          { questionId: "q9", answer: "third" },
          { questionId: "zzz", answer: "first" },
        ],
      ),
    );
    // q9 was question 3, zzz was question 1 — the answers must follow.
    expect(out.answerKey).toEqual([
      { questionId: "q3", answer: "third" },
      { questionId: "q1", answer: "first" },
    ]);
  });

  it("falls back to position when the key names an id no question has", () => {
    const out = assignQuestionIds(
      base([q("a", "one"), q("b", "two")], [{ questionId: "ghost", answer: "x" }]),
    );
    expect(out.answerKey[0].questionId).toBe("q1");
  });

  it("with a duplicated model id, the first question wins", () => {
    const out = assignQuestionIds(
      base([q("dup", "one"), q("dup", "two")], [{ questionId: "dup", answer: "x" }]),
    );
    expect(out.answerKey[0].questionId).toBe("q1");
  });

  it("every answer still points at a real question", () => {
    const out = assignQuestionIds(
      base(
        [q("a", "one"), q("b", "two"), q("c", "three")],
        [
          { questionId: "a", answer: "1" },
          { questionId: "b", answer: "2" },
          { questionId: "c", answer: "3" },
        ],
      ),
    );
    const ids = new Set(out.practiceWorksheet.questions.map((x) => x.id));
    for (const a of out.answerKey) expect(ids.has(a.questionId)).toBe(true);
  });

  it("an empty answer key stays empty rather than being invented", () => {
    expect(assignQuestionIds(base([q("a", "one")])).answerKey).toEqual([]);
  });
});

describe("what it repairs and what it refuses", () => {
  it("repairs a missing difficulty rather than throwing away the plan", () => {
    const out = assignQuestionIds(
      base([{ id: "a", prompt: "one", answer: "a" } as unknown as never]),
    );
    expect(out.practiceWorksheet.questions[0].difficulty).toBe("medium");
  });

  it("refuses a worksheet with no questions", () => {
    expect(() => assignQuestionIds(base([]))).toThrow(WorksheetShapeError);
  });

  it("refuses a question with nothing to ask", () => {
    expect(() => assignQuestionIds(base([q("a", "")]))).toThrow(WorksheetShapeError);
  });

  it("names what was wrong, so the failure is debuggable", () => {
    try {
      assignQuestionIds(base([]));
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(WorksheetShapeError);
      expect((err as WorksheetShapeError).issues.join(" ")).toMatch(/not a worksheet/);
    }
  });

  it("leaves worksheetVariants alone — class ids are a separate space", () => {
    const input = base([q("a", "one")]);
    (input as AnalysisResult).worksheetVariants = [
      {
        level: "1",
        worksheet: { title: "L1", difficulty: "easy", questions: [{ id: "L1q1", prompt: "p", answer: "a", difficulty: "easy" }] },
        answerKey: [{ questionId: "L1q1", answer: "a" }],
      },
    ];
    const out = assignQuestionIds(input);
    expect(out.worksheetVariants?.[0].worksheet.questions[0].id).toBe("L1q1");
  });
});

describe("the schema itself", () => {
  it("positionalId is one-based", () => {
    expect(positionalId(0)).toBe("q1");
    expect(positionalId(5)).toBe("q6");
  });

  it("accepts a worksheet with no ids at all", () => {
    const r = PracticeWorksheetSchema.safeParse({
      title: "W",
      difficulty: "easy",
      questions: [{ prompt: "p", answer: "a", difficulty: "easy" }],
    });
    expect(r.success).toBe(true);
  });
});
