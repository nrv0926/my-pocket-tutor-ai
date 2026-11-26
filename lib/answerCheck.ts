/**
 * Reading a numeric answer, and catching an item whose key is wrong.
 *
 * Two jobs that both exist because a generated question can be wrong in a
 * way that reaches a child:
 *
 *   · scoreNumber() decides what a typed answer means. "1,200" and "1200"
 *     are the same number; "1,2" is not a number at all; an empty box is a
 *     question nobody answered, which is different evidence from a wrong
 *     answer (see item_observations.status).
 *   · checkArithmeticKey() and validateChoices() refuse an item rather than
 *     print it. A worksheet whose key says 20 x 4 = 4000 teaches a child
 *     that they were wrong when they were right, and an adult who spots it
 *     stops trusting the whole plan.
 *
 * Deliberately pure and dependency-free: no model call, no database, no
 * clock. Scope is honest rather than clever — simple binary arithmetic and
 * numeric comparison. An item it cannot parse is reported as unparsed, never
 * guessed at.
 *
 * Canadian conventions: comma thousands separators, dollar amounts. Units
 * are returned separately because the handoff asks for a separate unit
 * field rather than units typed into the number box.
 */

export type NumericVerdict = "correct" | "incorrect" | "skipped";

export interface NumberCheck {
  verdict: NumericVerdict;
  /** What the answer was understood to be, or null when unreadable. */
  value: number | null;
  /** Unit text typed alongside the number. Belongs in its own field. */
  unit: string | null;
  /** Why, when the answer was not simply right. */
  why?: string;
}

/** A grouped integer: 1,200 / 12,000 / 1,200,000. Never 1,2 or 12,00. */
const GROUPED = /^\d{1,3}(?:,\d{3})+$/;
const PLAIN = /^\d+$/;

/**
 * Understand one numeric token. Returns null when the text is not a number
 * we are willing to guess at — which includes correctly-shaped nonsense
 * like "1,2".
 */
export function parseNumber(text: string): number | null {
  const t = text.trim();
  if (t === "") return null;

  const sign = t.startsWith("-") ? -1 : 1;
  const body = t.replace(/^[+-]/, "").trim();

  // a/b, including 3 1/2
  const mixed = body.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const d = Number(mixed[3]);
    if (d === 0) return null;
    return sign * (Number(mixed[1]) + Number(mixed[2]) / d);
  }
  const frac = body.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) {
    const d = Number(frac[2]);
    if (d === 0) return null;
    return (sign * Number(frac[1])) / d;
  }

  const [intPart, decPart, ...rest] = body.split(".");
  if (rest.length > 0) return null;
  if (decPart !== undefined && !PLAIN.test(decPart)) return null;
  if (intPart === "" && decPart === undefined) return null;

  // An integer part is either plainly digits or correctly grouped. A comma
  // in the wrong place is the whole point of this check.
  if (intPart !== "") {
    if (intPart.includes(",")) {
      if (!GROUPED.test(intPart)) return null;
    } else if (!PLAIN.test(intPart)) {
      return null;
    }
  }

  const n = Number(`${intPart.replace(/,/g, "") || "0"}.${decPart ?? "0"}`);
  return Number.isFinite(n) ? sign * n : null;
}

const EPSILON = 1e-9;

/** Same number, however it was written. 0.5 and 1/2 are the same number. */
export function sameNumber(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPSILON * Math.max(1, Math.abs(a), Math.abs(b));
}

export function scoreNumber(
  given: string | null | undefined,
  expected: string | number,
): NumberCheck {
  const raw = (given ?? "").trim();
  if (raw === "") {
    return { verdict: "skipped", value: null, unit: null, why: "nothing was written" };
  }

  // Pull a trailing unit off before parsing: "120 pages", "35 cm", "50%".
  const m = raw.match(/^(\$?\s*[-+]?[\d.,/\s]*?\d)\s*([a-zA-Z%°][a-zA-Z%°.\s]*)?$/);
  const numberText = (m?.[1] ?? raw).replace(/^\$\s*/, "").trim();
  const unit = m?.[2]?.trim() || null;

  const value = parseNumber(numberText);
  const want = typeof expected === "number" ? expected : parseNumber(String(expected));

  if (value === null) {
    return {
      verdict: "incorrect",
      value: null,
      unit,
      why: numberText.includes(",")
        ? "the commas are not in thousands places, so this is not a number"
        : "this is not a number we can read",
    };
  }
  if (want === null) {
    return { verdict: "incorrect", value, unit, why: "the expected answer is not a number" };
  }
  if (sameNumber(value, want)) {
    return { verdict: "correct", value, unit };
  }
  return { verdict: "incorrect", value, unit };
}

// --------------------------------------------------------------- item keys

export interface KeyCheck {
  verdict: "ok" | "wrong" | "unparsed";
  computed: number | null;
  why?: string;
}

const OPS: Record<string, (a: number, b: number) => number> = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => a / b,
};

const NORMALISE: Record<string, string> = {
  "×": "*", "x": "*", "X": "*", "·": "*",
  "÷": "/", "/": "/",
  "−": "-", "–": "-", "-": "-",
  "+": "+",
};

/**
 * Recompute a simple two-number question and compare it with its key.
 *
 * Handles the shape the generator actually produces — "26 × 5 = ?",
 * "93 - 48", "200 ÷ 5" — and nothing more. Anything else is "unparsed",
 * which is not a failure: it means this check has no opinion and the item
 * needs a human or a rubric. Guessing would be worse than abstaining.
 */
export function checkArithmeticKey(prompt: string, answer: string | number): KeyCheck {
  const cleaned = prompt
    .replace(/\?|=\s*$/g, " ")
    .replace(/[^\d.,+\-*/×÷x·−–\s]/g, " ")
    .trim();

  const m = cleaned.match(
    /^([\d.,]+)\s*([+\-*/×÷x·−–])\s*([\d.,]+)\s*$/,
  );
  if (!m) return { verdict: "unparsed", computed: null, why: "not a simple two-number question" };

  const a = parseNumber(m[1]);
  const b = parseNumber(m[3]);
  const op = OPS[NORMALISE[m[2]] ?? m[2]];
  if (a === null || b === null || !op) {
    return { verdict: "unparsed", computed: null, why: "could not read both numbers" };
  }
  if (NORMALISE[m[2]] === "/" && b === 0) {
    return { verdict: "wrong", computed: null, why: "divides by zero" };
  }

  const computed = op(a, b);
  const key = typeof answer === "number" ? answer : parseNumber(String(answer).trim());
  if (key === null) {
    return { verdict: "wrong", computed, why: "the key is not a number" };
  }
  return sameNumber(computed, key)
    ? { verdict: "ok", computed }
    : { verdict: "wrong", computed, why: `the key says ${key}, the arithmetic gives ${computed}` };
}

// --------------------------------------------------------------- choices

export interface ChoiceProblem {
  kind: "correct_among_distractors" | "duplicate" | "equivalent";
  choices: string[];
  message: string;
}

/**
 * Refuse a multiple-choice item whose options do not work.
 *
 * Three ways they fail, all of which make the question unanswerable rather
 * than merely ugly: a distractor that IS the right answer, the same
 * distractor twice, and two distractors that are the same number written
 * differently. 0.5 and 1/2 look like two options and are one.
 */
export function validateChoices(correct: string, distractors: string[]): ChoiceProblem[] {
  const problems: ChoiceProblem[] = [];
  const want = parseNumber(correct);

  distractors.forEach((d) => {
    const v = parseNumber(d);
    const matches =
      want !== null && v !== null ? sameNumber(v, want) : d.trim() === correct.trim();
    if (matches) {
      problems.push({
        kind: "correct_among_distractors",
        choices: [correct, d],
        message: `the distractor ${d} is the right answer`,
      });
    }
  });

  for (let i = 0; i < distractors.length; i += 1) {
    for (let j = i + 1; j < distractors.length; j += 1) {
      const a = distractors[i];
      const b = distractors[j];
      const va = parseNumber(a);
      const vb = parseNumber(b);
      if (a.trim() === b.trim()) {
        problems.push({
          kind: "duplicate",
          choices: [a, b],
          message: `${a} appears twice`,
        });
      } else if (va !== null && vb !== null && sameNumber(va, vb)) {
        problems.push({
          kind: "equivalent",
          choices: [a, b],
          message: `${a} and ${b} are the same number written two ways`,
        });
      }
    }
  }

  return problems;
}
