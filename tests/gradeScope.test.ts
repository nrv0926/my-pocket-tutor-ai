import { describe, expect, it } from "vitest";
import {
  checkGradeScope,
  derivedCeilings,
  dropOutOfScope,
  numeralsIn,
  wholeNumberCeiling,
} from "@/lib/gradeScope";

/**
 * Scenarios GR-02 and GR-03. The sheet's own note says to check the range
 * against the config rather than trusting the note — there is no config, so
 * this checks it against Ontario's published wording, which is the only
 * source allowed to settle it (CLAUDE.md §6).
 */
describe("grade number scope", () => {
  it("reads every grade's ceiling out of B1.1, including the odd spellings", () => {
    expect(derivedCeilings()).toEqual({
      "1": 50,
      "2": 200,
      "3": 1000,
      "4": 10000, // published as "10 000", with a space
      "5": 100000,
      "6": 1000000, // published as "one million", in words
      "7": 1000000000, // "one billion"
    });
  });

  it("abstains where Ontario states no range", () => {
    // Grade 8 moves to scientific notation and states no ceiling; K has no
    // published curriculum at all. Neither is zero.
    expect(wholeNumberCeiling("8")).toBeNull();
    expect(wholeNumberCeiling("K")).toBeNull();

    const r = checkGradeScope("8", { prompt: "Write 4 500 000 000 in scientific notation." });
    expect(r.inScope).toBe(true);
    expect(r.ceiling).toBeNull();
    expect(r.why).toMatch(/states no whole-number range/);
  });

  it("GR-02 a Grade 1 item stays inside 50", () => {
    expect(checkGradeScope("1", { prompt: "12 + 7 = ?", answer: 19 }).inScope).toBe(true);

    const over = checkGradeScope("1", { prompt: "26 × 5 = ?", answer: 130 });
    expect(over.inScope).toBe(false);
    expect(over.ceiling).toBe(50);
    expect(over.over).toEqual([130]);
    expect(over.why).toMatch(/Grade 1 works to 50/);
  });

  it("GR-03 the same topic is visibly different at Grade 2 and Grade 3", () => {
    const item = { prompt: "Count by 50s to 950.", answer: 950 };
    expect(checkGradeScope("2", item).inScope).toBe(false); // ceiling 200
    expect(checkGradeScope("3", item).inScope).toBe(true); // ceiling 1000
  });

  it("the answer is checked too, not just the prompt", () => {
    // 20 x 4 is in range at Grade 2; the answer 4000 is not, which is how a
    // wrong key and an out-of-scope item look the same from here.
    const r = checkGradeScope("2", { prompt: "20 × 4 = ?", answer: "4000" });
    expect(r.inScope).toBe(false);
    expect(r.over).toEqual([4000]);
  });

  it("reads Canadian grouping and plain digits alike", () => {
    expect(numeralsIn("1,200 and 1200 and 1 200")).toEqual([1200, 1200, 1200]);
    expect(numeralsIn("26 × 5 = 130")).toEqual([26, 5, 130]);
    expect(numeralsIn("no numbers here")).toEqual([]);
    expect(checkGradeScope("3", { prompt: "1,000 marbles" }).inScope).toBe(true);
    expect(checkGradeScope("3", { prompt: "1,001 marbles" }).inScope).toBe(false);
  });

  it("drops the out-of-scope items and says which, rather than printing short", () => {
    const items = [
      { prompt: "12 + 7 = ?", answer: 19 },
      { prompt: "600 + 300 = ?", answer: 900 },
      { prompt: "8 + 5 = ?", answer: 13 },
    ];
    const { kept, dropped } = dropOutOfScope("1", items);
    expect(kept.map((i) => i.prompt)).toEqual(["12 + 7 = ?", "8 + 5 = ?"]);
    expect(dropped).toHaveLength(1);
    expect(dropped[0].result.over).toEqual([600, 300, 900]);
  });
});
