import Link from "next/link";
import { notFound } from "next/navigation";
import AnalysisResultCard from "@/components/AnalysisResultCard";
import WorksheetClient from "@/app/worksheet/[id]/WorksheetClient";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { AnalysisResult, Worksheet } from "@/types/session";

export const dynamic = "force-dynamic";

/**
 * The single landing page after an analysis. One scroll, three sections:
 *
 *   1. Analysis     — the 9-section structured plan
 *   2. Worksheet    — printable practice sheet with answer-key toggle
 *   3. Feedback     — too easy / just right / too hard + completed
 *                     independently → writes progress_records
 *
 * Header has a quick link to the per-child progress page.
 */
export default async function ResultsPage({ params }: { params: { id: string } }) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("learning_sessions")
    .select("id, child_id, subject, analysis_result, worksheet, answer_key, created_at")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();

  const result = data.analysis_result as AnalysisResult;
  const worksheet = (data.worksheet as Worksheet | null) ?? result.practiceWorksheet;
  const answerKey =
    (data.answer_key as { questionId: string; answer: string }[] | null) ??
    result.answerKey;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">
            Analysis · {data.subject}
          </p>
          <h1 className="mt-1 font-serif text-3xl text-ink">Here's the plan.</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {new Date(data.created_at).toLocaleString()}
          </p>
        </div>
        <nav className="flex gap-2">
          <a
            href="#worksheet"
            className="rounded-full border border-cream-300 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-cream-50"
          >
            Jump to worksheet
          </a>
          <a
            href="#feedback"
            className="rounded-full border border-cream-300 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-cream-50"
          >
            Feedback
          </a>
          <Link
            href={`/progress/${data.child_id}`}
            className="rounded-full bg-forest-500 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-600"
          >
            View progress
          </Link>
        </nav>
      </header>

      {/* 1. Analysis */}
      <section className="mb-10">
        <AnalysisResultCard result={result} />
      </section>

      {/* 2 + 3. Worksheet + feedback (client) */}
      <section id="worksheet" className="scroll-mt-24">
        <h2 className="mb-3 font-serif text-2xl text-ink">Worksheet</h2>
        <WorksheetClient
          sessionId={data.id}
          childId={data.child_id}
          worksheet={worksheet}
          answerKey={answerKey}
        />
      </section>

      <section id="feedback" className="mt-10 rounded-2xl border border-cream-300 bg-white p-5 text-sm text-ink-soft shadow-card">
        <h2 className="font-serif text-lg text-ink">After the session</h2>
        <p className="mt-2">
          Once you've worked through the worksheet, save your feedback above.
          We'll use it to choose the next session's difficulty.{" "}
          <Link className="text-forest-500 underline" href={`/progress/${data.child_id}`}>
            View this child's full progress →
          </Link>
        </p>
      </section>
    </div>
  );
}
