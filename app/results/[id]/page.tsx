import Link from "next/link";
import { notFound } from "next/navigation";
import AnalysisResultCard from "@/components/AnalysisResultCard";
import { getServerSupabase } from "@/lib/supabaseClient";
import type { AnalysisResult } from "@/types/session";

export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: { params: { id: string } }) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("learning_sessions")
    .select("id, child_id, subject, analysis_result, created_at")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();
  const result = data.analysis_result as AnalysisResult;

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
        <div className="flex gap-2">
          <Link
            href={`/worksheet/${data.id}`}
            className="rounded-full border border-forest-500 px-4 py-2 text-sm font-medium text-forest-600 hover:bg-forest-50"
          >
            Open worksheet
          </Link>
          <Link
            href={`/progress/${data.child_id}`}
            className="rounded-full bg-forest-500 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-600"
          >
            View progress
          </Link>
        </div>
      </header>

      <AnalysisResultCard result={result} />
    </div>
  );
}
