import mathematics from "@/data/ontario/mathematics.json";

/**
 * Is a generated maths item inside the grade's number range?
 *
 * SERVER ONLY. This imports the transcribed Mathematics curriculum at module
 * scope. Reach it through a server action, never from a "use client" file —
 * tests/clientBundle.test.ts fails the build if you forget, because
 * @/data/ is on its DATA_HEAVY list.
 *
 * The ranges are DERIVED, not typed. Ontario states each grade's whole-number
 * range in the Number strand's B1.1, in its own words:
 *
 *   Grade 1  "whole numbers up to and including 50"
 *   Grade 3  "... up to and including 1000"
 *   Grade 4  "... up to and including 10 000"      (space, not comma)
 *   Grade 6  "... up to and including one million"  (in words)
 *
 * so the number is read out of the published wording the same way a topic's
 * membership is. Nobody types 50 into a config file, which means nobody can
 * type the wrong one. Grade 8's B1.1 states no ceiling at all — it moves to
 * scientific notation — and Kindergarten has no published curriculum, so
 * both return null and the check abstains rather than inventing a bound.
 *
 * Honest about its limits: it reads numerals out of text, so a year or a page
 * count in a word problem counts as a number. That is the right bias for the
 * thing it guards — an item that mentions 4,000 to a Grade 1 child is worth a
 * second look whatever the 4,000 is — but it is a reason to treat the result
 * as "drop this item", not "the model is broken".
 */

const WORDS: Record<string, number> = {
  ten: 10,
  hundred: 100,
  thousand: 1_000,
  million: 1_000_000,
  billion: 1_000_000_000,
};

/** Ontario writes large numbers with a space: "10 000", "100 000". */
function readCeiling(text: string): number | null {
  const m = text.match(/up to and including\s+([^,]+?)(?:,|\s+using|\s+and\s+describe|$)/i);
  if (!m) return null;
  const phrase = m[1].trim().toLowerCase();

  const word = phrase.match(/^(?:one\s+)?(ten|hundred|thousand|million|billion)$/);
  if (word) return WORDS[word[1]];

  const digits = phrase.replace(/[\s,]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  return Number(digits);
}

const CEILINGS: Map<string, number> = (() => {
  const out = new Map<string, number>();
  const strands = (mathematics as { strands: Strandish[] }).strands;
  const number = strands.find((s) => s.code === "B");
  for (const [grade, list] of Object.entries(number?.specific ?? {})) {
    const b11 = (list ?? []).find((e) => e.code === "B1.1");
    if (!b11) continue;
    const ceiling = readCeiling(b11.text);
    if (ceiling !== null) out.set(grade, ceiling);
  }
  return out;
})();

interface Strandish {
  code: string;
  specific?: Record<string, { code: string; text: string }[] | undefined>;
}

/**
 * The grade's whole-number ceiling, or null where Ontario states none.
 * Null means "no opinion", never "zero".
 */
export function wholeNumberCeiling(grade: string): number | null {
  return CEILINGS.get(grade) ?? null;
}

/** Every grade we could derive a ceiling for, for tests and diagnostics. */
export function derivedCeilings(): Record<string, number> {
  return Object.fromEntries([...CEILINGS.entries()].sort((a, b) => Number(a[0]) - Number(b[0])));
}

/**
 * Numerals in a piece of text, reading Canadian grouping and bare digits.
 * "1,200" and "1 200" and "1200" are all twelve hundred.
 */
export function numeralsIn(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(/\d[\d,  ]*(?:\.\d+)?/g)) {
    const raw = m[0].trim().replace(/[, \s]+$/, "");
    const n = Number(raw.replace(/[, \s]/g, ""));
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

export interface ScopeResult {
  inScope: boolean;
  /** The grade's ceiling, or null when there is none to check against. */
  ceiling: number | null;
  /** The numbers that went over it, in the order they appeared. */
  over: number[];
  why?: string;
}

/**
 * Check one item against its grade.
 *
 * Abstains — inScope true, ceiling null — where Ontario states no range, so a
 * missing bound never silently rejects every item.
 */
export function checkGradeScope(
  grade: string,
  item: { prompt?: string; answer?: string | number },
): ScopeResult {
  const ceiling = wholeNumberCeiling(grade);
  if (ceiling === null) {
    return {
      inScope: true,
      ceiling: null,
      over: [],
      why: `Ontario states no whole-number range for Grade ${grade}, so this is not checked`,
    };
  }

  const text = [item.prompt ?? "", item.answer === undefined ? "" : String(item.answer)].join(" ");
  const over = numeralsIn(text).filter((n) => n > ceiling);

  return over.length === 0
    ? { inScope: true, ceiling, over: [] }
    : {
        inScope: false,
        ceiling,
        over,
        why:
          `Grade ${grade} works to ${ceiling.toLocaleString("en-CA")}; this item uses ` +
          over.map((n) => n.toLocaleString("en-CA")).join(", "),
      };
}

/**
 * Keep the items that belong at this grade and report the rest.
 *
 * Returns both halves because a dropped item is worth logging — a generation
 * that loses half its questions to the scope check is a prompt problem, and
 * silently printing a shorter worksheet hides it.
 */
export function dropOutOfScope<T extends { prompt?: string; answer?: string | number }>(
  grade: string,
  items: T[],
): { kept: T[]; dropped: { item: T; result: ScopeResult }[] } {
  const kept: T[] = [];
  const dropped: { item: T; result: ScopeResult }[] = [];
  for (const item of items) {
    const result = checkGradeScope(grade, item);
    if (result.inScope) kept.push(item);
    else dropped.push({ item, result });
  }
  return { kept, dropped };
}
