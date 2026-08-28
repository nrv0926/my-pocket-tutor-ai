import Link from "next/link";
import {
  APP_GRADES,
  SUPPORTED_SUBJECTS,
  objectivesFor,
  programsFor,
} from "@/lib/curriculum";
import type { GradeId, Program, SubjectId } from "@/types/curriculum";
import EmptyReason from "./EmptyReason";

export const metadata = {
  title: "Browse the Ontario curriculum · AI Pocket Tutor",
  description:
    "Every Ontario elementary expectation we hold, by grade, subject and strand — transcribed from the Ministry's own documents.",
};

/**
 * Browse to an objective instead of typing one.
 *
 * A server component on purpose: the transcribed curriculum is ~215 KB of
 * JSON, and the drill-down is links and <details>, so the whole page ships
 * with no client JavaScript at all. State lives in the URL, which also makes
 * a grade-and-subject view something a teacher can bookmark or send to a
 * colleague.
 */
function isGrade(v: string | undefined): v is GradeId {
  return !!v && (APP_GRADES as string[]).includes(v);
}

export default function CurriculumPage({
  searchParams,
}: {
  searchParams: { grade?: string; subject?: string; program?: string };
}) {
  const grade: GradeId = isGrade(searchParams.grade) ? searchParams.grade : "3";
  const subject = (SUPPORTED_SUBJECTS.find((s) => s.id === searchParams.subject)?.id ??
    "language") as SubjectId;

  const programs = programsFor(subject);
  const program = (programs.find((p) => p.id === searchParams.program)?.id ??
    (programs.length ? "immersion" : undefined)) as Program["id"] | undefined;

  const objectives = objectivesFor(subject, grade, program);
  const specificCount = objectives.reduce((n, o) => n + o.specifics.length, 0);
  const href = (next: Record<string, string>) => {
    const q = new URLSearchParams({ grade, subject, ...(program ? { program } : {}), ...next });
    return `/curriculum?${q.toString()}`;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-12 sm:px-6">
      <header>
        <p className="font-display text-xs uppercase tracking-widest text-pop-magenta">
          Ontario curriculum
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-none text-pop-night sm:text-4xl">
          Find what you&apos;re teaching
        </h1>
        <p className="mt-3 max-w-prose font-medium text-pop-night/80">
          Every expectation below is transcribed from the Ministry&apos;s own documents,
          word for word. Pick a grade and subject, open a strand, and plan straight from
          the objective — no typing, no guessing at a code.
        </p>
      </header>

      <nav aria-label="Grade" className="mt-8">
        <h2 className="mb-2 font-display text-xs uppercase tracking-widest text-pop-night/60">
          Grade
        </h2>
        <ul className="flex flex-wrap gap-2">
          {APP_GRADES.map((g) => (
            <li key={g}>
              <Link
                href={href({ grade: g })}
                aria-current={g === grade ? "page" : undefined}
                className={`inline-flex min-w-[44px] justify-center rounded-full border-[3px] border-pop-night px-3 py-1.5 font-display text-xs uppercase tracking-wide shadow-pop-sm ${
                  g === grade ? "bg-pop-night text-pop-cream" : "bg-white text-pop-night hover:bg-pop-yellow"
                }`}
              >
                {g}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Subject" className="mt-5">
        <h2 className="mb-2 font-display text-xs uppercase tracking-widest text-pop-night/60">
          Subject
        </h2>
        <ul className="flex flex-wrap gap-2">
          {SUPPORTED_SUBJECTS.map((s) => (
            <li key={s.id}>
              <Link
                href={`/curriculum?${new URLSearchParams({ grade, subject: s.id }).toString()}`}
                aria-current={s.id === subject ? "page" : undefined}
                className={`inline-flex whitespace-nowrap rounded-full border-[3px] border-pop-night px-4 py-1.5 font-display text-xs uppercase tracking-wide shadow-pop-sm ${
                  s.id === subject ? "bg-pop-night text-pop-cream" : "bg-white text-pop-night hover:bg-pop-yellow"
                }`}
              >
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {programs.length > 0 && (
        <nav aria-label="Program" className="mt-5">
          <h2 className="mb-2 font-display text-xs uppercase tracking-widest text-pop-night/60">
            Program
          </h2>
          <ul className="flex flex-wrap gap-2">
            {programs.map((p) => (
              <li key={p.id}>
                <Link
                  href={href({ program: p.id })}
                  aria-current={p.id === program ? "page" : undefined}
                  className={`inline-flex whitespace-nowrap rounded-full border-[3px] border-pop-night px-4 py-1.5 font-display text-xs uppercase tracking-wide shadow-pop-sm ${
                    p.id === program ? "bg-pop-night text-pop-cream" : "bg-white text-pop-night hover:bg-pop-yellow"
                  }`}
                >
                  {p.nameEn}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {objectives.length === 0 ? (
        <EmptyReason subject={subject} grade={grade} />
      ) : (
        <>
          <p className="mt-8 font-display text-xs uppercase tracking-widest text-pop-night/60">
            {objectives.length} objectives · {specificCount} expectations
          </p>

          <div className="mt-3 space-y-3">
            {objectives.map((o) => (
              <details
                key={`${o.strandCode}-${o.code}`}
                className="rounded-2xl border-[3px] border-pop-night bg-white shadow-pop-sm"
              >
                <summary className="cursor-pointer list-none p-5">
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="rounded bg-pop-cyan px-2 py-0.5 font-display text-[11px] uppercase tracking-widest text-pop-magenta">
                      {o.code}
                    </span>
                    <span className="font-display text-[11px] uppercase tracking-widest text-pop-night/50">
                      {o.strandCode}. {o.strandName}
                    </span>
                  </span>
                  <span className="mt-2 block font-medium text-pop-night">
                    {o.text || `${o.specifics.length} expectations`}
                  </span>
                  <span className="mt-1 block text-xs text-pop-night/60">
                    {o.specifics.length} expectation{o.specifics.length === 1 ? "" : "s"} — open to see them
                  </span>
                </summary>

                <ul className="space-y-2 border-t-[3px] border-pop-night bg-pop-cream p-5">
                  {o.specifics.map((spec) => (
                    <li
                      key={spec.code}
                      className="rounded-xl border-[3px] border-pop-night bg-white p-4"
                    >
                      <p className="text-pop-night">
                        <span className="font-mono text-xs font-semibold text-pop-magenta">
                          {spec.code}
                        </span>{" "}
                        {spec.text}
                      </p>
                      <Link
                        href={`/session/new?subject=${subject}&expectation=${encodeURIComponent(spec.code)}${program ? `&program=${program}` : ""}`}
                        className="mt-3 inline-flex whitespace-nowrap rounded-full border-[3px] border-pop-night bg-pop-yellow px-3 py-1.5 font-display text-[11px] uppercase tracking-wide text-pop-night shadow-pop-sm"
                      >
                        Plan this →
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </>
      )}

      <p className="mt-10 max-w-prose text-xs text-pop-night/60">
        Transcribed from the Ontario Ministry of Education&apos;s published curriculum
        documents. Expectations are copied, never generated — an invented code would be
        worse than a missing one.
      </p>
    </div>
  );
}
