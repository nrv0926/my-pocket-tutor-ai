import Link from "next/link";
import AnalysisResultCard from "@/components/AnalysisResultCard";
import { SAMPLE_ANALYSIS, SAMPLE_PARENT_INPUT } from "./sampleAnalysis";

export const metadata = {
  title: "See a sample plan · AI Pocket Tutor",
  description:
    "What an AI Pocket Tutor plan looks like for a Grade 3 reader who's started to dread reading.",
};

export default function TryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
      <header className="text-center">
        <span className="inline-block rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-forest-600">
          Sample plan · no signup needed
        </span>
        <h1 className="mt-4 font-serif text-3xl text-ink sm:text-4xl">
          Here's what a plan looks like.
        </h1>
        <p className="mx-auto mt-3 max-w-prose text-ink-soft">
          A real parent shares what's happening. We turn it into a clear,
          ten-minute session you can run tonight. Below is one such plan,
          generated for a Grade 3 reading worry.
        </p>
      </header>

      <section className="mt-10 rounded-2xl border border-cream-300 bg-white p-6 shadow-card">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
          The parent's worry
        </h2>
        <blockquote className="mt-3 border-l-4 border-forest-200 pl-4 text-ink">
          {SAMPLE_PARENT_INPUT}
        </blockquote>
      </section>

      <div className="mt-10">
        <AnalysisResultCard result={SAMPLE_ANALYSIS} />
      </div>

      <section className="mt-12 rounded-2xl bg-forest-500 p-8 text-center text-cream-50">
        <h2 className="font-serif text-2xl">
          Get a plan tailored to <em>your</em> child.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-cream-100">
          The sample above is fictional. Your plan will be built from your
          child's grade, what's been working, and what hasn't.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-forest-600 hover:bg-cream-100"
          >
            Start free →
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-cream-100/40 px-5 py-3 text-sm font-medium text-cream-50 hover:bg-forest-600"
          >
            Back to home
          </Link>
        </div>
        <p className="mt-4 text-xs text-cream-100/80">
          No credit card required · Ontario curriculum first
        </p>
      </section>
    </div>
  );
}
