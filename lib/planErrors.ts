/**
 * Thrown when a child has no session to build a month out of.
 *
 * Its own module because lib/actions/plans.ts is a "use server" file, and
 * those may only export async functions — a class export there fails the
 * build outright.
 */
export class NoGapsError extends Error {
  constructor() {
    super(
      "There's no session to plan from yet. Run one first — the plan is built from what it finds."
    );
    this.name = "NoGapsError";
  }
}
