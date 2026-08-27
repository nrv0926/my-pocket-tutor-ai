import index from "@/data/ontario/subjects.json";
import languageData from "@/data/ontario/language.json";
import mathematicsData from "@/data/ontario/mathematics.json";
import type {
  CurriculumFile,
  GradeId,
  OverallExpectation,
  SourceGrade,
  SpecificExpectation,
  Strand,
  Subject,
  SubjectId,
} from "@/types/curriculum";

/**
 * Ontario curriculum lookups.
 *
 * subjects.json holds the taxonomy; the per-subject files hold expectations
 * transcribed from the Ministry PDFs by scripts/extract_ontario.py. Subjects
 * with no file yet resolve with empty strands, which is honest — see
 * data/ontario/README.md on why nothing here is ever written from memory.
 */
interface TranscribedStrand {
  code: string;
  name: string;
  grades: string[];
  sourceFile: string;
  overall: OverallExpectation[];
  specific: Record<string, SpecificExpectation[]>;
}

interface TranscribedSubject {
  subject: string;
  policyYear: number;
  source: string;
  transcribedFrom: string[];
  strands: TranscribedStrand[];
}

const TRANSCRIBED: Record<string, TranscribedSubject> = {
  language: languageData as TranscribedSubject,
  mathematics: mathematicsData as TranscribedSubject,
};

/** Grades the product covers. Ontario publishes 1-8; we surface K-6. */
export const APP_GRADES: GradeId[] = ["K", "1", "2", "3", "4", "5", "6"];

function build(): Subject[] {
  const file = index as unknown as CurriculumFile;
  return file.subjects.map((subject) => {
    const t = TRANSCRIBED[subject.id];
    if (!t) return subject;

    const strands: Strand[] = t.strands.map((ts) => ({
      code: ts.code,
      name: ts.name,
      grades: ts.grades.filter((g): g is GradeId =>
        (APP_GRADES as string[]).includes(g)
      ),
      overall: ts.overall,
      specific: ts.specific as Partial<Record<SourceGrade, SpecificExpectation[]>>,
    }));

    return { ...subject, policyYear: t.policyYear, source: t.source, strands };
  });
}

export const SUBJECTS: Subject[] = build();

/** Subjects the product actually generates plans for today. */
export const SUPPORTED_SUBJECTS: Subject[] = SUBJECTS.filter((s) => s.supported);

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

export interface ExpectationOption {
  code: string;
  text: string;
  strandCode: string;
  strandName: string;
}

/**
 * Every specific expectation for a subject at a grade, flattened for a
 * picker and grouped by strand in the order Ontario publishes them.
 */
export function expectationOptions(id: SubjectId, grade: GradeId): ExpectationOption[] {
  const out: ExpectationOption[] = [];
  for (const strand of strandsFor(id, grade)) {
    for (const spec of strand.specific?.[grade as SourceGrade] ?? []) {
      out.push({
        code: spec.code,
        text: spec.text,
        strandCode: strand.code,
        strandName: strand.name,
      });
    }
  }
  return out;
}

/** Overall expectations for a subject, which are shared across its grades. */
export function overallFor(id: SubjectId, grade: GradeId): OverallExpectation[] {
  return strandsFor(id, grade).flatMap((s) => s.overall);
}

/** How many expectations are loaded — used by the UI and by tests. */
export function loadedExpectationCount(): number {
  let n = 0;
  for (const s of SUBJECTS) {
    for (const strand of s.strands) {
      for (const list of Object.values(strand.specific ?? {})) n += list?.length ?? 0;
    }
  }
  return n;
}

/** Which subjects actually have transcribed expectations behind them. */
export function subjectsWithExpectations(): SubjectId[] {
  return SUBJECTS.filter((s) =>
    s.strands.some((st) =>
      Object.values(st.specific ?? {}).some((l) => (l?.length ?? 0) > 0)
    )
  ).map((s) => s.id);
}

export interface ResolvedExpectation {
  code: string;
  text: string;
  strandCode: string;
  strandName: string;
}

/**
 * Look up a specific expectation by code.
 *
 * The caller passes a code that came from a browser, so it is resolved
 * against the transcribed data rather than trusted: an unknown code returns
 * null and the plan is built without one. That keeps a fabricated code from
 * ever reaching a prompt (CLAUDE.md §6).
 */
export function findExpectation(
  subject: SubjectId,
  grade: GradeId,
  code: string
): ResolvedExpectation | null {
  for (const strand of strandsFor(subject, grade)) {
    for (const spec of strand.specific?.[grade as SourceGrade] ?? []) {
      if (spec.code === code) {
        return {
          code: spec.code,
          text: spec.text,
          strandCode: strand.code,
          strandName: strand.name,
        };
      }
    }
  }
  return null;
}
