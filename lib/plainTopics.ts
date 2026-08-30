import vocabulary from "@/data/topics.json";
import { expectationOptions } from "@/lib/curriculum";
import type { GradeId, Program, SubjectId } from "@/types/curriculum";

/**
 * Topics in the words the adult uses, over expectations in Ontario's.
 *
 * "B2 — Language Foundations for Reading and Writing" is what Ontario calls
 * it, and a teacher recognises it. A parent looking for help with times
 * tables does not, and neither does a homeschooler planning a week. So there
 * is a second way to narrow the list, phrased the way people actually ask.
 *
 * The split of responsibility is the whole point, and it is the same rule
 * that governs everything else here (CLAUDE.md §6):
 *
 *   - The LABEL is ours. "Multiplying and dividing" appears nowhere in the
 *     curriculum, and the UI never presents it as Ontario's wording.
 *   - The MEMBERSHIP is not. A topic collects the transcribed expectations
 *     whose own published text matches its terms. Nothing is filed by hand,
 *     so a topic cannot quietly claim an expectation that is not about it.
 *
 * A topic with no matches at a grade is not returned, because an empty topic
 * is a promise the curriculum does not keep. Whatever no topic claims stays
 * reachable through "All topics" — the plain layer narrows, it never hides.
 */

interface RawTopic {
  id: string;
  label: string;
  /** Matched against Ontario's own wording, never against a label. */
  terms: string[];
}

const SUBJECTS: Record<string, RawTopic[]> = vocabulary.subjects;

export interface PlainTopic {
  id: string;
  label: string;
  /** Expectation codes whose published wording matched. Never empty. */
  codes: string[];
}

/**
 * Anchored at a word boundary, because a substring match is wrong in a way
 * that is hard to see: "rate" inside "demonstrate" put a third of Grade 8
 * mathematics under Ratios before this was fixed.
 */
function matcher(terms: string[]): RegExp {
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(?:${escaped.join("|")})`, "i");
}

const compiled = new Map<string, { id: string; label: string; re: RegExp }[]>();

function topicsFor(subject: string) {
  let list = compiled.get(subject);
  if (!list) {
    list = (SUBJECTS[subject] ?? []).map((t) => ({
      id: t.id,
      label: t.label,
      re: matcher(t.terms),
    }));
    compiled.set(subject, list);
  }
  return list;
}

/** Which plain topics have anything real behind them at this grade. */
export function plainTopicsFor(
  subject: SubjectId,
  grade: GradeId,
  program?: Program["id"]
): PlainTopic[] {
  const expectations = expectationOptions(subject, grade, program);
  const out: PlainTopic[] = [];

  for (const t of topicsFor(subject)) {
    const codes = expectations.filter((e) => t.re.test(e.text)).map((e) => e.code);
    if (codes.length > 0) out.push({ id: t.id, label: t.label, codes });
  }

  return out;
}

/** True when a subject has a plain-English layer at all. */
export function hasPlainTopics(subject: SubjectId): boolean {
  return (SUBJECTS[subject] ?? []).length > 0;
}
