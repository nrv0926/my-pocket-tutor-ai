import Link from "next/link";
import { notFound } from "next/navigation";
import ProgressTracker from "@/components/ProgressTracker";
import { summarize } from "@/lib/progressEngine";
import { getServerSupabase } from "@/lib/supabaseClient";
import type { ProgressRecord } from "@/types/progress";

export const dynamic = "force-dynamic";

export default async function ChildProgressPage({
  params,
}: {
  params: { childId: string };
}) {
  const supabase = getServerSupabase();

  const [childRes, recordsRes] = await Promise.all([
    supabase
      .from("children")
      .select("id, nickname, grade, location")
      .eq("id", params.childId)
      .single(),
    supabase
      .from("progress_records")
      .select("id, child_id, session_id, skill, status, difficulty, parent_feedback, completed_independently, notes, created_at")
      .eq("child_id", params.childId)
      .order("created_at", { ascending: false }),
  ]);

  if (childRes.error || !childRes.data) notFound();
  const child = childRes.data;

  const records: ProgressRecord[] = (recordsRes.data ?? []).map((r) => ({
    id: r.id,
    childId: r.child_id,
    sessionId: r.session_id,
    skill: r.skill,
    status: r.status,
    difficulty: r.difficulty,
    parentFeedback: r.parent_feedback,
    completedIndependently: r.completed_independently,
    notes: r.notes,
    createdAt: r.created_at,
  }));
  const summary = summarize(records);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">
            Progress · {child.nickname}
          </p>
          <h1 className="mt-1 font-serif text-3xl text-ink">How things are going.</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Grade {child.grade} · {child.location}
          </p>
        </div>
        <Link
          href="/session/new"
          className="rounded-full bg-forest-500 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-600"
        >
          New session
        </Link>
      </header>

      <ProgressTracker summary={summary} />

      <section className="mt-8 rounded-2xl border border-cream-300 bg-white p-5 shadow-card">
        <h2 className="mb-3 font-serif text-xl text-ink">All sessions</h2>
        {records.length === 0 ? (
          <p className="text-sm text-ink-muted">No sessions yet.</p>
        ) : (
          <ul className="divide-y divide-cream-200 text-sm">
            {records.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <span className="text-ink">{r.skill}</span>
                <span className="flex items-center gap-2 text-ink-muted">
                  <span className="capitalize">{r.status}</span>
                  {r.parentFeedback && (
                    <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs">
                      {r.parentFeedback.replaceAll("_", " ")}
                    </span>
                  )}
                  {r.completedIndependently === true && (
                    <span className="rounded-full bg-forest-50 px-2 py-0.5 text-xs text-forest-600">
                      independent
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
