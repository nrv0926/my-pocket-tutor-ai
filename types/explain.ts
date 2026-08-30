/**
 * A plain-English gloss on one curriculum expectation.
 *
 * Ours, not Ontario's — the page says so wherever one appears. Stored rather
 * than regenerated, because /curriculum is public and an explanation that
 * costs a model call every time a crawler passes is a bill, not a feature.
 */
export interface Explanation {
  /** Two sentences at most: what the child is learning to do. */
  plain: string;
  /** One concrete example, specific enough to picture. */
  example: string;
  /** Five minutes, no printing, no buying. */
  tryAtHome: string;
}

export interface StoredExplanation extends Explanation {
  subject: string;
  grade: string;
  program: string | null;
  code: string;
  createdAt: string;
}
