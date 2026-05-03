import { notFound } from "next/navigation";
import WorksheetClient from "./WorksheetClient";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { Worksheet } from "@/types/session";

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
  // answer_key is a denormalised copy; for parent-mode rows the canonical
  // copy is also at analysis_result.answerKey. Pending sessions have a
  // null analysis_result, so we have to be defensive here.
  const fromColumn =
    data.answer_key as { questionId: string; answer: string }[] | null;
  const fromResult =
    data.analysis_result &&
    typeof data.analysis_result === "object" &&
    "answerKey" in data.analysis_result
      ? ((data.analysis_result as { answerKey: { questionId: string; answer: string }[] })
          .answerKey ?? null)
      : null;
  const answerKey = fromColumn ?? fromResult;

  if (!worksheet || !answerKey) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm text-ink-muted">No worksheet attached to this session.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-forest-600">
        Worksheet
      </p>
      <WorksheetClient
        sessionId={data.id}
        childId={data.child_id}
        worksheet={worksheet}
        answerKey={answerKey ?? []}
      />
    </div>
  );
}
