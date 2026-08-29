import { notFound } from "next/navigation";
import WorksheetClient from "./WorksheetClient";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { AnalysisResult, Worksheet } from "@/types/session";

export const dynamic = "force-dynamic";

export default async function WorksheetPage({ params }: { params: { id: string } }) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("learning_sessions")
    .select("id, child_id, worksheet, answer_key, analysis_result")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();

  const worksheet = data.worksheet as Worksheet | null;
  // This page is the one worksheet you sit down and do, with feedback
  // attached to it. When the session also carries a set per level, say so
  // and point at the plan rather than letting them look lost.
  const variants = (data.analysis_result as AnalysisResult).worksheetVariants ?? [];
  // analysis_result.answerKey is the canonical source; the answer_key column
  // is a denormalised copy that may be empty for older rows.
  const answerKey =
    (data.answer_key as { questionId: string; answer: string }[] | null) ??
    (data.analysis_result as { answerKey: { questionId: string; answer: string }[] }).answerKey;

  if (!worksheet) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm text-pop-night/60">No worksheet attached to this session.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-pop-magenta">
        Worksheet
      </p>
      {variants.length > 0 && (
        <p className="mb-4 rounded-xl border-[3px] border-pop-night bg-pop-cyan/30 px-3 py-2 text-sm text-pop-night">
          This is the whole-group worksheet. There{" "}
          {variants.length === 1 ? "is also a set" : "are also sets"} for{" "}
          {variants.map((v) => `Level ${v.level}`).join(", ")} —{" "}
          <a href={`/results/${data.id}`} className="underline">
            they print with the full plan
          </a>
          .
        </p>
      )}
      <WorksheetClient
        sessionId={data.id}
        childId={data.child_id}
        worksheet={worksheet}
        answerKey={answerKey ?? []}
      />
    </div>
  );
}
