import LocalTime from "@/components/LocalTime";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalysisResultCard from "@/components/AnalysisResultCard";
import PlanBridge from "@/components/PlanBridge";
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

  // Whether a month already exists decides whether we offer to build one or
  // to open it. Both queries are RLS-scoped, so a session that is not theirs
  // never got this far.
  const [childRes, planRes] = await Promise.all([
    supabase.from("children").select("nickname").eq("id", data.child_id).single(),
    supabase
      .from("learning_plans")
      .select("id")
      .eq("child_id", data.child_id)
      .limit(1),
  ]);
  const nickname = childRes.data?.nickname ?? "them";
  const hasPlan = (planRes.data ?? []).length > 0;

  const result = data.analysis_result as AnalysisResult;
  const worksheet = (data.worksheet as Worksheet | null) ?? result.practiceWorksheet;
  const answerKey =
    (data.answer_key as { questionId: string; answer: string }[] | null) ??
    result.answerKey;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-pop-magenta">
            Analysis · {data.subject}
          </p>
          <h1 className="mt-1 font-display text-3xl text-pop-night">Here&apos;s the plan.</h1>
          <p className="mt-1 text-sm text-pop-night/60">
            <LocalTime iso={data.created_at} />
          </p>
        </div>
        <nav className="flex gap-2 print:hidden">
          <a
            href="#worksheet"
            className="rounded-full border-[3px] border-pop-night bg-white px-4 py-2 text-sm font-medium text-pop-night hover:bg-pop-cream"
          >
            Jump to worksheet
          </a>
          <Link
            href={`/print/${data.id}`}
            className="rounded-full border-[3px] border-pop-night bg-pop-yellow px-4 py-2 text-sm font-medium text-pop-night hover:bg-pop-cyan"
          >
            Print / PDF
          </Link>
          <Link
            href={`/worksheet/${data.id}`}
            className="rounded-full border-[3px] border-pop-night bg-white px-4 py-2 text-sm font-medium text-pop-night hover:bg-pop-cream"
          >
            Worksheet only
          </Link>
          <a
            href="#feedback"
            className="rounded-full border-[3px] border-pop-night bg-white px-4 py-2 text-sm font-medium text-pop-night hover:bg-pop-cream"
          >
            Feedback
          </a>
          <Link
            href={`/progress/${data.child_id}`}
            className="rounded-full bg-pop-pink px-4 py-2 text-sm font-semibold text-pop-night hover:bg-pop-yellow"
          >
            View progress
          </Link>
        </nav>
      </header>

      {/* 1. Analysis */}
      <section className="mb-10">
        <AnalysisResultCard result={result} />
      </section>

      {/* 2. The month this session belongs to */}
      <section className="mb-10">
        <PlanBridge childId={data.child_id} nickname={nickname} hasPlan={hasPlan} />
      </section>

      {/* 3 + 4. Worksheet + feedback (client) */}
      <section id="worksheet" className="scroll-mt-24">
        <h2 className="mb-3 font-display text-2xl text-pop-night">Worksheet</h2>
        <WorksheetClient
          sessionId={data.id}
          childId={data.child_id}
          worksheet={worksheet}
          answerKey={answerKey}
        />
      </section>

      <section id="feedback" className="mt-10 rounded-2xl border-[3px] border-pop-night bg-white p-5 text-sm text-pop-night/80 shadow-pop-sm">
        <h2 className="font-display text-lg text-pop-night">After the session</h2>
        <p className="mt-2">
          Once you&apos;ve worked through the worksheet, save your feedback above.
          We&apos;ll use it to choose the next session&apos;s difficulty.{" "}
          <Link className="text-pop-magenta underline" href={`/progress/${data.child_id}`}>
            View this child&apos;s full progress →
          </Link>
        </p>
      </section>
    </div>
  );
}
