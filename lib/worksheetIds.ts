import { z } from "zod";
import type { AnalysisResult } from "@/types/session";

/**
 * Give every worksheet question a stable id the server chose.
 *
 * The prompt asks the model for "q1", "q2", and until now nothing checked
 * that it obliged — the result went straight into the row (there is still
 * no runtime validation of the analysis as a whole; see the TODO in
 * lib/aiService.ts). That was survivable while ids were only ever read
 * back alongside the questions they sat next to. It stopped being
 * survivable the moment item_observations began pointing at them: a
 * unique constraint resting on unvalidated model output is not a
 * constraint, and two questions sharing an id would collapse two
 * different results into one row.
 *
 * So the server assigns them, by position, overwriting whatever arrived.
 *
 * The answer key is the part that is easy to get wrong. It JOINS on these
 * ids, so renaming the questions without renaming the key detaches every
 * answer from its question — silently, because both halves still parse.
 * They move together here, and in migration 0007 for older rows.
 *
 * worksheetVariants are left alone deliberately: their ids are "L1q1" and
 * friends, they exist only for class profiles, and item_observations
 * refuses class profiles outright.
 */

const Difficulty = z.enum(["easy", "medium", "hard"]);

/**
 * Just the worksheet — not the whole nine-section result.
 *
 * Narrow on purpose. This runs on output an adult has already waited and
 * paid for, so it repairs what it safely can (a missing id, a missing
 * difficulty label) and rejects only what would make the worksheet
 * unusable: no questions, or a question with nothing to ask.
 */
export const WorksheetQuestionSchema = z.object({
  id: z.string().optional(),
  prompt: z.string().min(1, "a question with no prompt cannot be asked"),
  imageUrl: z.string().optional(),
  answer: z.string().default(""),
  difficulty: Difficulty.catch("medium"),
});

export const PracticeWorksheetSchema = z.object({
  title: z.string().min(1).catch("Practice"),
  difficulty: Difficulty.catch("medium"),
  questions: z
    .array(WorksheetQuestionSchema)
    .min(1, "a worksheet with no questions is not a worksheet"),
});

/** Thrown when the worksheet cannot be repaired into something usable. */
export class WorksheetShapeError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(`The generated worksheet could not be used: ${issues.join("; ")}`);
    this.name = "WorksheetShapeError";
    this.issues = issues;
  }
}

/** q1, q2, … by position. The order the adult reads down the page. */
export function positionalId(index: number): string {
  return `q${index + 1}`;
}

/**
 * Validate the worksheet, then renumber its questions and bring the
 * answer key with them. Returns a new object; the input is not mutated.
 */
export function assignQuestionIds(result: AnalysisResult): AnalysisResult {
  const parsed = PracticeWorksheetSchema.safeParse(result.practiceWorksheet);
  if (!parsed.success) {
    throw new WorksheetShapeError(
      parsed.error.issues.map((i) => `${i.path.join(".") || "worksheet"}: ${i.message}`),
    );
  }

  const questions = parsed.data.questions;

  // old id -> new id. First occurrence wins, because a repeated id is
  // exactly the case this exists to fix and the first one is the one the
  // answer key most likely meant.
  const rename = new Map<string, string>();
  questions.forEach((q, i) => {
    if (q.id && !rename.has(q.id)) rename.set(q.id, positionalId(i));
  });

  const renumbered = questions.map((q, i) => ({ ...q, id: positionalId(i) }));

  // The key follows: by its old id where we know it, else by position,
  // else left as it is rather than invented.
  const answerKey = (result.answerKey ?? []).map((entry, i) => {
    const byName = entry.questionId ? rename.get(entry.questionId) : undefined;
    const byPosition = i < questions.length ? positionalId(i) : undefined;
    return { ...entry, questionId: byName ?? byPosition ?? entry.questionId };
  });

  return {
    ...result,
    practiceWorksheet: { ...result.practiceWorksheet, ...parsed.data, questions: renumbered },
    answerKey,
  };
}
