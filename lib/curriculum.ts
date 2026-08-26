import file from "@/data/ontario/subjects.json";
import type {
  CurriculumFile,
  GradeId,
  Strand,
  Subject,
  SubjectId,
} from "@/types/curriculum";

/**
 * Ontario curriculum lookups.
 *
 * Structure is real; expectation text is not loaded yet. Anything that would
 * claim curriculum alignment to a user must check `expectationsVerified`
 * first — an empty strand is honest, an invented expectation is not.
 */
const CURRICULUM = file as CurriculumFile;

export const SUBJECTS: Subject[] = CURRICULUM.subjects;

/** Subjects the product actually generates plans for today. */
export const SUPPORTED_SUBJECTS: Subject[] = SUBJECTS.filter((s) => s.supported);

export const EXPECTATIONS_VERIFIED = CURRICULUM.expectationsVerified;

/**
 * Sessions saved before the taxonomy was corrected stored Reading and Writing
 * as if they were subjects. They are strands of Language, so old rows resolve
 * to Language plus the strand they meant.
 */
export const LEGACY_SUBJECTS: Record<string, { subject: SubjectId; strand?: string }> = {
  reading: { subject: "language", strand: "C" },
  writing: { subject: "language", strand: "D" },
  language: { subject: "language" },
  math: { subject: "mathematics" },
};

export function resolveSubject(stored: string): { subject: Subject; strand?: Strand } | null {
  const legacy = LEGACY_SUBJECTS[stored];
  const id = (legacy?.subject ?? stored) as SubjectId;
  const subject = SUBJECTS.find((s) => s.id === id);
  if (!subject) return null;
  const strand = legacy?.strand
    ? subject.strands.find((s) => s.code === legacy.strand)
    : undefined;
  return { subject, strand };
}

export function getSubject(id: SubjectId): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}

/** Strands that apply at a given grade — Ontario phases some in partway. */
export function strandsFor(id: SubjectId, grade: GradeId): Strand[] {
  return getSubject(id)?.strands.filter((s) => s.grades.includes(grade)) ?? [];
}

/**
 * Every specific expectation for a subject at a grade, flattened for a
 * picker. Empty until the official text is transcribed, which is why the
 * caller should render "not loaded yet" rather than an empty dropdown.
 */
export function expectationOptions(
  id: SubjectId,
  grade: GradeId
): { code: string; text: string; strand: string }[] {
  const out: { code: string; text: string; strand: string }[] = [];
  for (const strand of strandsFor(id, grade)) {
    for (const overall of strand.overall) {
      for (const spec of overall.specific) {
        out.push({ code: spec.code, text: spec.text, strand: strand.name });
      }
    }
  }
  return out;
}

/** How many expectations are actually loaded — used by the UI and by tests. */
export function loadedExpectationCount(): number {
  let n = 0;
  for (const s of SUBJECTS) {
    for (const strand of s.strands) {
      for (const o of strand.overall) n += o.specific.length;
    }
  }
  return n;
}
