import Link from "next/link";
import AnalysisResultCard from "@/components/AnalysisResultCard";
import { SAMPLES, SAMPLE_ORDER } from "@/app/try/samples";
import type { Role } from "@/types/child";

const CTA_HREF: Record<Role, string> = {
  parent: "/for/parent",
  teacher: "/for/teacher",
  homeschooler: "/for/homeschooler",
};

const CTA_LINE: Record<Role, string> = {
  parent:
    "The plan above is fictional. Yours is built from your child's grade, what's been working, and what hasn't.",
  teacher:
    "The group above is fictional. Yours is built from the grade you teach, where the students actually are, and how long your rotation runs.",
  homeschooler:
    "The sequence above is fictional. Yours is built from where you are in your scope and sequence, and how much time you have each day.",
};

/**
 * The public sample plan, rendered for one audience.
 *
 * All three roles share this page — only the scenario, the framing and the
 * closing line change. The plan itself goes through AnalysisResultCard, the
 * same renderer a real result uses, so a visitor is looking at the actual
 * product rather than a mock-up.
 */
export default function SamplePlan({ role }: { role: Role }) {
  const sample = SAMPLES[role];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
      <header className="text-center">
        <span className="inline-block rounded-full border-[3px] border-pop-night bg-pop-cyan px-3 py-1 font-display text-xs uppercase tracking-widest text-pop-magenta">
          Sample plan · no signup needed
        </span>
        <h1 className="mt-4 font-display text-3xl uppercase text-pop-night sm:text-4xl">
          {sample.title}
        </h1>
        <p className="mx-auto mt-3 max-w-prose font-medium text-pop-night/80">{sample.blurb}</p>
      </header>

      <nav aria-label="Choose an audience" className="mt-8">
        <p className="mb-2 text-center font-display text-xs uppercase tracking-widest text-pop-night/60">
          See the same product for
        </p>
        <ul className="flex flex-wrap justify-center gap-2">
          {SAMPLE_ORDER.map((r) => {
            const active = r === role;
            return (
              <li key={r}>
                <Link
                  href={SAMPLES[r].href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex whitespace-nowrap rounded-full border-[3px] border-pop-night px-4 py-2 font-display text-xs uppercase tracking-wide shadow-pop-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
                    active
                      ? "bg-pop-night text-pop-cream"
                      : "bg-white text-pop-night hover:bg-pop-yellow"
                  }`}
                >
                  {SAMPLES[r].label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="mt-10 rounded-2xl border-[3px] border-pop-night bg-white p-6 shadow-pop-sm">
        <h2 className="font-display text-xs uppercase tracking-widest text-pop-night/60">
          {sample.inputHeading}
        </h2>
        <blockquote className="mt-3 border-l-4 border-pop-night pl-4 font-medium text-pop-night">
          {sample.input}
        </blockquote>
      </section>

      <div className="mt-10">
        <AnalysisResultCard result={sample.analysis} />
      </div>

      <section className="mt-12 rounded-2xl border-[3px] border-pop-night bg-pop-pink p-8 text-center text-pop-night shadow-pop">
        <h2 className="font-display text-2xl uppercase">
          Get a plan for <em className="not-italic text-white">your</em>{" "}
          {role === "teacher" ? "group" : "child"}.
        </h2>
        <p className="mx-auto mt-2 max-w-md font-medium text-pop-night/80">{CTA_LINE[role]}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={CTA_HREF[role]}
            className="inline-flex items-center whitespace-nowrap rounded-full border-[3px] border-pop-night bg-white px-5 py-3 font-display text-sm uppercase tracking-wide text-pop-night shadow-pop-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Start free →
          </Link>
          <Link
            href="/"
            className="inline-flex items-center whitespace-nowrap rounded-full border-[3px] border-pop-night bg-pop-yellow px-5 py-3 font-display text-sm uppercase tracking-wide text-pop-night shadow-pop-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Back to home
          </Link>
        </div>
        <p className="mt-4 font-display text-[10px] uppercase tracking-widest text-pop-night/70">
          No credit card required · Ontario curriculum first
        </p>
      </section>
    </div>
  );
}
