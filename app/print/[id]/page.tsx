import { notFound } from "next/navigation";
import PrintClient from "./PrintClient";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { AnalysisResult, Worksheet } from "@/types/session";

export const dynamic = "force-dynamic";

/**
 * The printable lesson pack — the thing she carries to class.
 *
 * A separate route rather than a print stylesheet over the results page,
 * because what you print is not what you browse: no navigation, no feedback
 * form, a header that says whose plan this is, and the answer key on its own
 * sheet so it can be kept back from the person doing the worksheet.
 *
 * "Export" and "print" are the same act here. A browser's Save as PDF over a
 * page built for paper produces a real file she can email, which is what
 * this page exists to be good at.
 */
export default async function PrintPage({ params }: { params: { id: string } }) {
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from("learning_sessions")
    .select("id, child_id, subject, analysis_result, worksheet, answer_key, created_at")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();

  const { data: child } = await supabase
    .from("children")
    .select("nickname, grade, kind")
    .eq("id", data.child_id)
    .single();

  const result = data.analysis_result as AnalysisResult;

  return (
    <PrintClient
      result={result}
      worksheet={(data.worksheet as Worksheet | null) ?? result.practiceWorksheet}
      answerKey={
        (data.answer_key as { questionId: string; answer: string }[] | null) ?? result.answerKey
      }
      learner={child?.nickname ?? "Learner"}
      grade={child?.grade ?? ""}
      isClass={(child?.kind ?? "student") === "class"}
      subject={data.subject}
      createdAt={data.created_at}
    />
  );
}
