import Link from "next/link";
import AnalysisResultCard from "@/components/AnalysisResultCard";
import { SAMPLE_ANALYSIS, SAMPLE_PARENT_INPUT } from "./sampleAnalysis";

export const metadata = {
  title: "See a sample plan · Pocket Tutor",
  description:
    "What a Pocket Tutor plan looks like for a Grade 3 reader who's started to dread reading.",
};

export default function TryPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-cream-50 to-forest-50 px-4 pt-16 pb-10 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-forest-100 bg-forest-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-forest-500">
            ✦ Sample plan · no signup needed
          </span>
          <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight text-forest-600 sm:text-4xl">
            Here&rsquo;s what a plan looks like.
          </h1>
          <p className="mx-auto mt-3 max-w-prose text-lg font-light text-ink-soft">
            A real parent shares what&rsquo;s happening. We turn it into a
            clear, ten-minute session you can run tonight. Below is one such
            plan, generated for a Grade 3 reading worry &mdash; in Parent
            mode.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <section className="mt-8 rounded-2xl border border-cream-300 bg-white p-6 shadow-card">
          <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-teal-400">
            The parent&rsquo;s worry
          </p>
          <blockquote className="mt-3 border-l-4 border-forest-100 pl-4 text-ink">
            {SAMPLE_PARENT_INPUT}
          </blockquote>
        </section>

        <div className="mt-10">
          <AnalysisResultCard mode="parent" result={SAMPLE_ANALYSIS} />
        </div>

        <section className="mt-12 rounded-2xl bg-gradient-to-br from-forest-600 to-teal-700 p-8 text-center text-white">
          <h2 className="font-serif text-2xl font-semibold">
            Get a plan tailored to your child.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-white/70">
            The sample above is fictional. Your plan will be built from your
            child&rsquo;s grade, what&rsquo;s been working, and what
            hasn&rsquo;t.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/login?next=${encodeURIComponent("/session/new")}`}
              className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-medium text-forest-600 hover:bg-cream-100"
            >
              Start free →
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-white/30 px-5 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              Back to home
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/55">
            No credit card required · Ontario curriculum first
          </p>
        </section>
      </div>
    </>
  );
}
