import index from "@/data/ontario/subjects.json";
import languageData from "@/data/ontario/language.json";
import mathematicsData from "@/data/ontario/mathematics.json";
import frenchData from "@/data/ontario/french.json";
import type {
  CurriculumFile,
  Program,
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

interface TranscribedProgramFile {
  subject: string;
  policyYear: number;
  language: "en" | "fr";
  source: string;
  programs: {
    id: Program["id"];
    name: string;
    nameEn: string;
    strands: (TranscribedStrand & { nameEn?: string })[];
  }[];
}

const FRENCH = frenchData as unknown as TranscribedProgramFile;

/** Grades the product covers — the full Ontario elementary range. */
export const APP_GRADES: GradeId[] = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];

function toStrands(list: TranscribedStrand[]): Strand[] {
  return list.map((ts) => ({
    code: ts.code,
    name: ts.name,
    grades: ts.grades.filter((g): g is GradeId => (APP_GRADES as string[]).includes(g)),
    overall: ts.overall,
    specific: ts.specific as Partial<Record<SourceGrade, SpecificExpectation[]>>,
  }));
}

function build(): Subject[] {
  const file = index as unknown as CurriculumFile;
  return file.subjects.map((subject) => {
    if (subject.id === "french") {
      return {
        ...subject,
        policyYear: FRENCH.policyYear,
        source: FRENCH.source,
        language: FRENCH.language,
        strands: [],
        programs: FRENCH.programs.map((p) => ({
          id: p.id,
          name: p.name,
          nameEn: p.nameEn,
          strands: toStrands(p.strands),
        })),
      };
    }

    const t = TRANSCRIBED[subject.id];
    if (!t) return subject;

    return {
      ...subject,
      policyYear: t.policyYear,
      source: t.source,
      strands: toStrands(t.strands),
    };
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

/** Programs a subject offers, or [] when it has none (every subject but FSL). */
export function programsFor(id: SubjectId): Program[] {
  return getSubject(id)?.programs ?? [];
}

/**
 * Strands that apply at a given grade — Ontario phases some in partway.
 *
 * For FSL a program must be named, because Core, Extended and Immersion set
 * different expectations for the same grade. Passing none falls back to
 * Immersion, which is the only program that runs the full K-6 range.
 */
export function strandsFor(
  id: SubjectId,
  grade: GradeId,
  program?: Program["id"]
): Strand[] {
  const subject = getSubject(id);
  if (!subject) return [];
  if (subject.programs?.length) {
    const chosen =
      subject.programs.find((p) => p.id === program) ??
      subject.programs.find((p) => p.id === "immersion") ??
      subject.programs[0];
    return chosen.strands.filter((s) => s.grades.includes(grade));
  }
  return subject.strands.filter((s) => s.grades.includes(grade));
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
export function expectationOptions(
  id: SubjectId,
  grade: GradeId,
  program?: Program["id"]
): ExpectationOption[] {
  const out: ExpectationOption[] = [];
  for (const strand of strandsFor(id, grade, program)) {
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
export function overallFor(
  id: SubjectId,
  grade: GradeId,
  program?: Program["id"]
): OverallExpectation[] {
  return strandsFor(id, grade, program).flatMap((s) => s.overall);
}

/** How many expectations are loaded — used by the UI and by tests. */
export function loadedExpectationCount(): number {
  let n = 0;
  for (const s of SUBJECTS) {
    for (const strand of allStrands(s)) {
      for (const list of Object.values(strand.specific ?? {})) n += list?.length ?? 0;
    }
  }
  return n;
}

/** Which subjects actually have transcribed expectations behind them. */
export function subjectsWithExpectations(): SubjectId[] {
  return SUBJECTS.filter((s) =>
    allStrands(s).some((st) =>
      Object.values(st.specific ?? {}).some((l) => (l?.length ?? 0) > 0)
    )
  ).map((s) => s.id);
}

/** Every strand of a subject, across programs when it has them. */
export function allStrands(s: Subject): Strand[] {
  return s.programs?.length ? s.programs.flatMap((p) => p.strands) : s.strands;
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
  code: string,
  program?: Program["id"]
): ResolvedExpectation | null {
  for (const strand of strandsFor(subject, grade, program)) {
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
