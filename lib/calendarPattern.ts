/**
 * Repeating-date patterns, and the one key both the screen and the printout
 * are built from.
 *
 * "The visits are November 2, 8 and 14. When is the very next visit? Show
 * how you know." That item needs an answer and it needs the working — the
 * hops a child is asked to show — and the two have to come from the same
 * calculation. A printed key computed separately from the on-screen key is
 * two keys, and one of them will be wrong eventually.
 *
 * Ported from the reference module in docs/assessment/
 * Pocket_Tutor_Assessment_Handoff.md, which is where this behaviour was
 * specified. Changes from it, all small:
 *
 *   · typed, and the field names kept as the handoff wrote them
 *   · returns `shown` and `proof` as readonly arrays, so a caller cannot
 *     reorder the working by accident
 *   · one error type (CalendarPatternError) rather than bare RangeError, so
 *     a caller can tell a bad fixture from a genuine runtime fault
 *   · arithmetic in whole UTC days throughout. A local-time Date would drift
 *     by an hour across a daylight-saving boundary and land the answer on
 *     the wrong day, which is the classic way this kind of item goes wrong.
 */

const DAY_MS = 86_400_000;

export class CalendarPatternError extends RangeError {
  constructor(message: string) {
    super(message);
    this.name = "CalendarPatternError";
  }
}

/**
 * An ISO date (YYYY-MM-DD) as whole UTC milliseconds.
 *
 * Rejects an impossible date rather than rolling it over: `new Date` turns
 * 2026-02-30 into March 2 quite happily, and a question built on a date
 * that does not exist is a question with no answer.
 */
export function utcDay(iso: string): number {
  if (typeof iso !== "string" || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(iso)) {
    throw new CalendarPatternError("Expected an ISO date such as 2026-11-02");
  }
  const date = new Date(`${iso}T00:00:00.000Z`);
  const t = date.getTime();
  if (!Number.isFinite(t) || date.toISOString().slice(0, 10) !== iso) {
    throw new CalendarPatternError(`${iso} is not a date on the calendar`);
  }
  return t;
}

export function isoFromUtcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export interface CalendarPatternInput {
  /** The first date in the pattern, ISO. */
  firstDate: string;
  /** Days between one date and the next. */
  stepDays: number;
  /** How many dates the child is shown. */
  shownCount: number;
  /** Which term they are asked for. Must be past the ones shown. */
  targetTerm: number;
}

export interface CalendarPattern {
  /** The dates the question shows. */
  shown: readonly string[];
  /** The answer: the date at targetTerm. */
  answer: string;
  /** Every date from the first to the answer — the working, in order. */
  proof: readonly string[];
  stepDays: number;
}

export function calendarPattern({
  firstDate,
  stepDays,
  shownCount,
  targetTerm,
}: CalendarPatternInput): CalendarPattern {
  const start = utcDay(firstDate);

  if (!Number.isInteger(stepDays) || stepDays < 1 || stepDays > 366) {
    throw new CalendarPatternError("stepDays must be a whole number of days from 1 to 366");
  }
  if (!Number.isInteger(shownCount) || shownCount < 2 || shownCount > 20) {
    throw new CalendarPatternError("shownCount must be a whole number from 2 to 20");
  }
  if (!Number.isInteger(targetTerm) || targetTerm > 30) {
    throw new CalendarPatternError("targetTerm must be a whole number no greater than 30");
  }
  if (targetTerm <= shownCount) {
    // Otherwise the answer is one of the dates already printed on the page.
    throw new CalendarPatternError("targetTerm must come after the dates shown");
  }

  const proof = Array.from({ length: targetTerm }, (_, i) =>
    isoFromUtcDay(start + i * stepDays * DAY_MS),
  );

  return {
    shown: Object.freeze(proof.slice(0, shownCount)),
    answer: proof[proof.length - 1],
    proof: Object.freeze(proof),
    stepDays,
  };
}

/**
 * The question and its key, from one calculation.
 *
 * `answer` and `proof` are the same objects the key is rendered from, so
 * the printed sheet and the screen cannot disagree.
 */
export function calendarPatternItem(
  input: CalendarPatternInput,
  opts: { what?: string } = {},
): { prompt: string; answer: string; workingOut: readonly string[] } {
  const p = calendarPattern(input);
  const what = opts.what ?? "visit";
  const dates = p.shown.join(", ");
  return {
    prompt:
      `The ${what}s shown are ${dates}. ` +
      `When is ${p.shown.length + 1 === input.targetTerm ? "the very next" : `${ordinal(input.targetTerm)}`} ${what}? ` +
      `Show how you know.`,
    answer: p.answer,
    workingOut: p.proof,
  };
}

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `the ${n}th`;
  const suffix = ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `the ${n}${n % 10 >= 1 && n % 10 <= 3 ? suffix : "th"}`;
}
