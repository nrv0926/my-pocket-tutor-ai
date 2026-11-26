import { describe, expect, it } from "vitest";
import { SHOWCASE_CLASS_PLAN, SHOWCASE_INPUT, SHOWCASE_PLAN } from "@/app/demo/showcase/plan";
import { checkArithmeticKey } from "@/lib/answerCheck";
import { checkGradeScope } from "@/lib/gradeScope";
import { findExpectation } from "@/lib/curriculum";
import type { AnalysisResult, Worksheet } from "@/types/session";

/**
 * The showcase plan is hand-written, so nothing generated it and nothing
 * checked it. These checks are the substitute, and they use the modules the
 * product uses: a wrong key on the page a visitor is shown would be the
 * worst possible first impression.
 */

const sheets = (p: AnalysisResult): { label: string; worksheet: Worksheet; key: { questionId: string; answer: string }[] }[] => [
  { label: "whole group", worksheet: p.practiceWorksheet, key: p.answerKey },
  ...(p.worksheetVariants ?? []).map((v) => ({
    label: `level ${v.level}`,
    worksheet: v.worksheet,
    key: v.answerKey,
  })),
];

describe("the showcase plan", () => {
  it("quotes a real Ontario expectation, transcribed not typed", () => {
    const found = findExpectation("mathematics", "3", SHOWCASE_INPUT.expectation);
    expect(found, `${SHOWCASE_INPUT.expectation} is not in the transcribed curriculum`).toBeTruthy();
    // The wording on the page must be the published wording, verbatim.
    expect(found?.text).toBe(SHOWCASE_INPUT.expectationText);
  });

  it("has all nine sections and the exact feedback question", () => {
    for (const p of [SHOWCASE_PLAN, SHOWCASE_CLASS_PLAN]) {
      expect(p.whatINotice.length).toBeGreaterThan(40);
      expect(p.keySkillGaps.length).toBeGreaterThan(0);
      expect(p.whatToTeachNext).toHaveLength(3); // top 3 only
      expect(p.howToTeachIt.length).toBeGreaterThan(0);
      expect(p.practiceWorksheet.questions.length).toBeGreaterThanOrEqual(5);
      expect(p.practiceWorksheet.questions.length).toBeLessThanOrEqual(8);
      expect(p.answerKey).toHaveLength(p.practiceWorksheet.questions.length);
      expect(p.parentTips.length).toBeGreaterThanOrEqual(2);
      expect(p.parentTips.length).toBeLessThanOrEqual(3);
      expect(p.nextStepPlan.length).toBeGreaterThan(40);
      expect(p.feedbackQuestion).toBe("Was this too easy, just right, or too hard?");
    }
  });

  it("every answer key joins to a question, in every worksheet", () => {
    for (const p of [SHOWCASE_PLAN, SHOWCASE_CLASS_PLAN]) {
      for (const s of sheets(p)) {
        const ids = s.worksheet.questions.map((q) => q.id);
        expect(new Set(ids).size, `${s.label} has a duplicate id`).toBe(ids.length);
        expect(s.key.map((k) => k.questionId).sort()).toEqual([...ids].sort());
      }
    }
  });

  it("every arithmetic key is actually correct", () => {
    // The module built for exactly this. An item it cannot recompute is
    // reported, not assumed right — so the count is asserted too.
    let checked = 0;
    for (const p of [SHOWCASE_PLAN, SHOWCASE_CLASS_PLAN]) {
      for (const s of sheets(p)) {
        for (const q of s.worksheet.questions) {
          const sum = q.prompt.match(/(\d[\d\s+]*\d)\s*=\s*\?/);
          if (!sum) continue;
          const parts = sum[1].split("+").map((x) => Number(x.trim()));
          const total = parts.reduce((a, b) => a + b, 0);
          expect(Number(q.answer), `${s.label} ${q.id}: ${q.prompt}`).toBe(total);
          if (parts.length === 2) {
            const r = checkArithmeticKey(`${parts[0]} + ${parts[1]} = ?`, q.answer);
            expect(r.verdict, `${s.label} ${q.id}`).toBe("ok");
          }
          checked += 1;
        }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(15);
  });

  it("the answer-key prose agrees with the answer", () => {
    for (const p of [SHOWCASE_PLAN, SHOWCASE_CLASS_PLAN]) {
      for (const s of sheets(p)) {
        for (const q of s.worksheet.questions) {
          if (!/^\d+$/.test(q.answer)) continue;
          const entry = s.key.find((k) => k.questionId === q.id);
          expect(entry?.answer.startsWith(q.answer), `${s.label} ${q.id}`).toBe(true);
        }
      }
    }
  });

  it("stays inside Grade 3's published number range", () => {
    // Ontario Grade 3 works to 1000. A showcase that quotes B2.5 — "add up
    // to no more than 1000" — and then prints 1 240 would undercut itself.
    for (const p of [SHOWCASE_PLAN, SHOWCASE_CLASS_PLAN]) {
      for (const s of sheets(p)) {
        if (s.label === "level 2") continue; // two-digit sums, trivially inside
        for (const q of s.worksheet.questions) {
          const r = checkGradeScope("3", { prompt: q.prompt, answer: q.answer });
          expect(r.inScope, `${s.label} ${q.id}: ${r.why ?? ""}`).toBe(true);
        }
      }
    }
  });

  it("omits the class-only fields for one learner, and carries them for a class", () => {
    // One learner has nobody to differentiate between, and one level needs
    // one worksheet (CLAUDE.md §5).
    expect(SHOWCASE_PLAN.differentiation).toBeUndefined();
    expect(SHOWCASE_PLAN.worksheetVariants).toBeUndefined();

    expect(SHOWCASE_CLASS_PLAN.differentiation).toBeTruthy();
    expect(SHOWCASE_CLASS_PLAN.worksheetVariants).toHaveLength(3);
    // The support track is a smaller step of the SAME skill, never busywork.
    expect(SHOWCASE_CLASS_PLAN.differentiation?.needsSupport).toMatch(/same skill|one step smaller/i);
  });

  it("names only Ontario's 1–4 levels, and never treats 4 as the goal", () => {
    const levels = (SHOWCASE_CLASS_PLAN.worksheetVariants ?? []).map((v) => v.level);
    expect(levels).toEqual(["2", "3", "4"]);
    for (const l of levels) expect(["1", "2", "3", "4"]).toContain(l);

    const prose = JSON.stringify(SHOWCASE_CLASS_PLAN) + JSON.stringify(SHOWCASE_PLAN);
    expect(prose).not.toMatch(/3\+|R\b|half level/);
  });

  it("names no condition anywhere", () => {
    // CLAUDE.md §7: we acknowledge and adapt, we never label.
    const prose = JSON.stringify(SHOWCASE_PLAN) + JSON.stringify(SHOWCASE_CLASS_PLAN) + JSON.stringify(SHOWCASE_INPUT);
    expect(prose).not.toMatch(/dyslexi|dyscalculi|ADHD|autis|disorder|disabilit|delay/i);
  });

  it("puts no real learner on a public page", () => {
    const prose = JSON.stringify(SHOWCASE_PLAN) + JSON.stringify(SHOWCASE_CLASS_PLAN) + JSON.stringify(SHOWCASE_INPUT);
    expect(prose).not.toMatch(/\b(Penny|Penelope|Iliana|Leo)\b/);
  });
});
