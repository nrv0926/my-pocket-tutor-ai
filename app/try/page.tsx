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
        <span className="inline-block rounded-full bg-pop-cyan px-3 py-1 text-xs font-semibold uppercase tracking-widest text-pop-magenta">
          Sample plan · no signup needed
        </span>
        <h1 className="mt-4 font-display text-3xl text-pop-night sm:text-4xl">
          Here&apos;s what a plan looks like.
        </h1>
        <p className="mx-auto mt-3 max-w-prose text-pop-night/80">
          A real parent shares what&apos;s happening. We turn it into a clear,
          ten-minute session you can run tonight. Below is one such plan,
          generated for a Grade 3 reading worry.
        </p>
      </header>

      <section className="mt-10 rounded-2xl border-[3px] border-pop-night bg-white p-6 shadow-pop-sm">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-pop-night/60">
          The parent&apos;s worry
        </h2>
        <blockquote className="mt-3 border-l-4 border-pop-night pl-4 text-pop-night">
          {SAMPLE_PARENT_INPUT}
        </blockquote>
      </section>

      <div className="mt-10">
        <AnalysisResultCard result={SAMPLE_ANALYSIS} />
      </div>

      <section className="mt-12 rounded-2xl bg-pop-pink p-8 text-center text-pop-night">
        <h2 className="font-display text-2xl">
          Get a plan tailored to <em>your</em> child.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-cream-100">
          The sample above is fictional. Your plan will be built from your
          child&apos;s grade, what&apos;s been working, and what hasn&apos;t.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-pop-magenta hover:bg-pop-cream"
          >
            Start free →
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-pop-night/40 px-5 py-3 text-sm font-medium text-cream-50 hover:bg-pop-magenta"
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
