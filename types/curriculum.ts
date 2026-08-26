/**
 * Ontario curriculum taxonomy.
 *
 * The shape mirrors how Ontario actually publishes: a subject holds strands,
 * a strand holds overall expectations, and each overall expectation holds the
 * specific expectations beneath it (B1, then B1.1, B1.2...).
 *
 * The app used to call Reading and Writing "subjects". They are not — both
 * are strands inside Language, and a teacher notices that immediately. See
 * LEGACY_SUBJECTS in lib/curriculum.ts for how stored rows still resolve.
 */

export type SubjectId =
  | "language"
  | "mathematics"
  | "science-technology"
  | "french"
  | "social-studies"
  | "health-physical-education"
  | "arts"
  | "native-languages";

export type GradeId = "K" | "1" | "2" | "3" | "4" | "5" | "6";

export interface SpecificExpectation {
  /** Ontario's own code, e.g. "B1.3". Never invent one. */
  code: string;
  text: string;
}

export interface OverallExpectation {
  /** e.g. "B1". */
  code: string;
  text: string;
  specific: SpecificExpectation[];
}

export interface Strand {
  /** Ontario's strand letter, e.g. "B". */
  code: string;
  name: string;
  /**
   * Grades this strand applies to. Ontario introduces some strands partway
   * through elementary, so this is per-strand rather than per-subject.
   */
  grades: GradeId[];
  /** Empty until the official text is loaded — see data/ontario/README.md. */
  overall: OverallExpectation[];
}

export interface Subject {
  id: SubjectId;
  /** Ontario's published name. */
  name: string;
  /** Year of the policy document this follows. */
  policyYear: number;
  /**
   * Whether AI Pocket Tutor generates plans for it today. The unsupported
   * subjects are still listed, because a teacher asking "where's Music?"
   * deserves an honest "not yet" rather than a taxonomy that pretends the
   * subject does not exist.
   */
  supported: boolean;
  /** Official URL the expectations must be transcribed from. */
  source: string;
  strands: Strand[];
}

export interface CurriculumFile {
  region: string;
  /**
   * False until every expectation below has been checked against `source`.
   * Tests refuse to let an expectation exist without a code, so a partial
   * load is safe — but a plan must not claim curriculum alignment while
   * this is false.
   */
  expectationsVerified: boolean;
  note: string;
  subjects: Subject[];
}
