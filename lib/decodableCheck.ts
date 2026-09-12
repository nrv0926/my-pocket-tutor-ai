import progression from "@/data/literacy-progression.json";

/**
 * Does every word in a decodable passage actually decode at the stage it
 * claims?
 *
 * The decodable extra's whole value is a constraint the model has to keep:
 * use the stage taught and the stages below it, nothing above. That promise
 * is worth exactly as much as our ability to check it, and "it looked fine"
 * does not scale past the first few passages. One untaught pattern and the
 * child stalls, and the adult concludes they have gone backwards.
 *
 * This is a HEURISTIC, and deliberately so. English spelling does not
 * reduce to seven clean tiers, so the checker is tuned to catch the failure
 * that actually happens — a word from a LATER stage slipping in — and to
 * stay quiet otherwise. It reads the stage list and grapheme sets from
 * data/literacy-progression.json rather than carrying its own copy.
 *
 * Not wired into generation. It is a measuring instrument: run it over real
 * output (scripts/tryDecodable.mjs) to get a pass rate instead of a hunch.
 */

const STAGES = progression.phonics_progression;

/** Stage number → its published name, e.g. 2 → "Digraphs". */
export function stageName(stage: number): string {
  return STAGES.find((s) => s.stage === stage)?.name ?? `Stage ${stage}`;
}

export const MAX_STAGE = STAGES.length;

const VOWELS = "aeiou";
const DIGRAPHS = STAGES.find((s) => s.stage === 2)?.graphemes ?? [];
const VOWEL_TEAMS = STAGES.find((s) => s.stage === 5)?.graphemes ?? [];
const R_CONTROLLED = STAGES.find((s) => s.stage === 6)?.graphemes ?? [];

/** Strip anything that is not a letter, and fold case. */
function normalize(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, "").replace(/'/g, "");
}

/**
 * Count vowel groups, treating a final silent e as part of its own syllable
 * rather than a new one — "cake" is one syllable, "picnic" is two.
 */
function syllables(word: string): number {
  const trimmed = /[aeiou][^aeiou]e$/.test(word) ? word.slice(0, -1) : word;
  return (trimmed.match(/[aeiou]+/g) ?? []).length;
}

/** Consonant runs that are not a single digraph — i.e. real blends. */
function hasBlend(word: string): boolean {
  for (const run of word.match(/[^aeiou]{2,}/g) ?? []) {
    let rest = run;
    // Peel off digraphs; whatever consonant letters remain adjacent form a
    // blend. "ck" alone is a digraph; "nd" is not; "nch" is n + ch.
    for (const d of DIGRAPHS) rest = rest.split(d).join("|");
    if (/[a-z]{2,}/.test(rest)) return true;
    const pieces = rest.split("|").filter(Boolean);
    if (pieces.join("").length + pieces.length > 1 && /[a-z]/.test(rest)) return true;
  }
  return false;
}

export interface WordStage {
  stage: number;
  reason: string;
}

/**
 * The earliest phonics stage at which a word becomes decodable.
 *
 * Checked from the top down: the most advanced pattern a word contains is
 * what a child needs in order to read it.
 */
export function stageOf(raw: string): WordStage {
  const word = normalize(raw);
  if (!word) return { stage: 1, reason: "no letters" };

  if (syllables(word) > 1) {
    return { stage: 7, reason: "more than one syllable" };
  }
  for (const g of R_CONTROLLED) {
    if (word.includes(g)) return { stage: 6, reason: `r-controlled "${g}"` };
  }
  for (const g of VOWEL_TEAMS) {
    if (word.includes(g)) return { stage: 5, reason: `vowel team "${g}"` };
  }
  if (/[aeiou][^aeiou]e$/.test(word)) {
    return { stage: 4, reason: "silent e" };
  }
  if (hasBlend(word)) {
    return { stage: 3, reason: "consonant blend" };
  }
  for (const g of DIGRAPHS) {
    if (word.includes(g)) return { stage: 2, reason: `digraph "${g}"` };
  }
  return { stage: 1, reason: "CVC" };
}

export interface Violation extends WordStage {
  word: string;
  stageName: string;
}

export interface CheckResult {
  /** The stage the passage claimed to be written for. */
  stage: number;
  ok: boolean;
  violations: Violation[];
  /** Words actually checked — tricky words are excluded by design. */
  checked: number;
  /** Tricky words declared but never used. A list that is not doing its job. */
  unusedTrickyWords: string[];
}

/**
 * Check a passage against the stage it was generated for.
 *
 * `trickyWords` are exempt: they are the irregular high-frequency words the
 * adult pre-teaches, and being undecodable is the entire reason they are
 * listed. Anything else needing a later stage is a violation.
 */
export function checkPassage(
  sentences: string[],
  stage: number,
  trickyWords: string[] = [],
): CheckResult {
  const tricky = new Set(trickyWords.map(normalize).filter(Boolean));
  const seen = new Set<string>();
  const violations: Violation[] = [];
  let checked = 0;

  for (const sentence of sentences) {
    for (const token of sentence.split(/\s+/)) {
      const word = normalize(token);
      if (!word) continue;
      if (tricky.has(word)) {
        seen.add(word);
        continue;
      }
      checked += 1;
      const at = stageOf(word);
      if (at.stage > stage && !violations.some((v) => v.word === word)) {
        violations.push({ ...at, word, stageName: stageName(at.stage) });
      }
    }
  }

  return {
    stage,
    ok: violations.length === 0,
    violations,
    checked,
    unusedTrickyWords: [...tricky].filter((w) => !seen.has(w)),
  };
}
