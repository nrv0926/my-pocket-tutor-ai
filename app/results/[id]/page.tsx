import Link from "next/link";
import { notFound } from "next/navigation";
import AnalysisResultCard from "@/components/AnalysisResultCard";
import PendingSessionRunner from "@/components/PendingSessionRunner";
import WorksheetClient from "@/app/worksheet/[id]/WorksheetClient";
import { getServerSupabase } from "@/lib/supabaseServer";
import type {
  AnswerKeyEntry,
  HomeschoolResult,
  Mode,
  ParentResult,
  TeacherResult,
  Worksheet,
} from "@/types/session";

export const dynamic = "force-dynamic";

const MODE_LABEL: Record<Mode, string> = {
  parent: "Parent mode",
  homeschool: "Homeschool mode",
  teacher: "Teacher mode",
};

type SessionStatus = "pending" | "processing" | "done" | "error";

export default async function ResultsPage({ params }: { params: { id: string } }) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("learning_sessions")
    .select(
      "id, child_id, mode, subject, status, error_message, analysis_result, worksheet, answer_key, created_at",
    )
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();

  const mode: Mode = (data.mode as Mode) ?? "parent";
  const status: SessionStatus = (data.status as SessionStatus) ?? "done";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.07em] text-teal-400">
            {MODE_LABEL[mode]} · {data.subject}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-forest-600">
            {status === "done" ? "Here's the plan." : "Working on your plan…"}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {new Date(data.created_at).toLocaleString()}
          </p>
        </div>
        {status === "done" && (
          <nav className="flex gap-2">
            <Link
              href={`/progress/${data.child_id}`}
              className="rounded-xl bg-forest-500 px-4 py-2 text-sm font-medium text-white shadow-glow hover:bg-forest-600"
            >
              View progress
            </Link>
          </nav>
        )}
      </header>

      {status === "pending" || status === "processing" ? (
        <PendingSessionRunner sessionId={data.id} initialStatus={status} />
      ) : status === "error" ? (
        <ErrorPanel
          message={data.error_message}
          childId={data.child_id}
        />
      ) : (
        <DoneSection
          sessionId={data.id}
          childId={data.child_id}
          mode={mode}
          result={data.analysis_result as ParentResult | HomeschoolResult | TeacherResult}
          worksheet={data.worksheet as Worksheet | null}
          answerKey={data.answer_key as AnswerKeyEntry[] | null}
        />
      )}
    </div>
  );
}

function ErrorPanel({
  message,
  childId,
}: {
  message: string | null;
  childId: string;
}) {
  return (
    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
      <p className="font-serif text-lg font-semibold text-forest-600">
        That one didn&rsquo;t come through.
      </p>
      <p className="mt-2">
        {message ?? "Something went wrong while generating the plan."}
      </p>
      <div className="mt-4 flex gap-2">
        <Link
          href="/session/new"
          className="rounded-xl bg-forest-500 px-4 py-2 text-sm font-medium text-white shadow-glow hover:bg-forest-600"
        >
          Try again
        </Link>
        <Link
          href={`/progress/${childId}`}
          className="rounded-xl border border-amber-400 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
        >
          View progress
        </Link>
      </div>
    </section>
  );
}

function DoneSection({
  sessionId,
  childId,
  mode,
  result,
  worksheet: storedWorksheet,
  answerKey: storedAnswerKey,
}: {
  sessionId: string;
  childId: string;
  mode: Mode;
  result: ParentResult | HomeschoolResult | TeacherResult;
  worksheet: Worksheet | null;
  answerKey: AnswerKeyEntry[] | null;
}) {
  const worksheet =
    storedWorksheet ??
    (mode === "parent" ? (result as ParentResult).practiceWorksheet : null);
  const answerKey =
    storedAnswerKey ??
    (mode === "parent" ? (result as ParentResult).answerKey : null);

  return (
    <>
      <section className="mb-10">
        {renderResultCard(mode, result)}
      </section>

      {worksheet && answerKey && (
        <>
          <section id="worksheet" className="scroll-mt-24">
            <h2 className="mb-3 font-serif text-2xl font-semibold text-forest-600">
              {mode === "parent" ? "Worksheet" : "Featured worksheet"}
            </h2>
            <WorksheetClient
              sessionId={sessionId}
              childId={childId}
              worksheet={worksheet}
              answerKey={answerKey}
            />
          </section>

          <section
            id="feedback"
            className="mt-10 rounded-2xl border border-cream-300 bg-white p-5 text-sm text-ink-soft shadow-card"
          >
            <h2 className="font-serif text-lg font-semibold text-forest-600">
              After the session
            </h2>
            <p className="mt-2">
              Once you&rsquo;ve worked through the worksheet, save your
              feedback above. We&rsquo;ll use it to choose the next
              session&rsquo;s difficulty.{" "}
              <Link
                className="text-forest-500 underline"
                href={`/progress/${childId}`}
              >
                View this child&rsquo;s full progress →
              </Link>
            </p>
          </section>
        </>
      )}
    </>
  );
}

function renderResultCard(
  mode: Mode,
  result: ParentResult | HomeschoolResult | TeacherResult,
) {
  if (mode === "homeschool") {
    return <AnalysisResultCard mode="homeschool" result={result as HomeschoolResult} />;
  }
  if (mode === "teacher") {
    return <AnalysisResultCard mode="teacher" result={result as TeacherResult} />;
  }
  return <AnalysisResultCard mode="parent" result={result as ParentResult} />;
}
