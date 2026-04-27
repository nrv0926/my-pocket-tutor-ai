import Link from "next/link";
import ProgressTracker from "@/components/ProgressTracker";
import { summarize } from "@/lib/progressEngine";
import type { ProgressRecord } from "@/types/progress";

export default function ChildProgressPage({
  params,
}: {
  params: { childId: string };
}) {
  // TODO: load from progress_records WHERE child_id = params.childId (RLS)
  const records: ProgressRecord[] = MOCK_RECORDS;
  const summary = summarize(records);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">
            Progress · child {params.childId}
          </p>
          <h1 className="mt-1 font-serif text-3xl text-ink">How things are going.</h1>
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
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const MOCK_RECORDS: ProgressRecord[] = [
  {
    id: "p1", childId: "demo-1", sessionId: "s1",
    skill: "phonics.blends", status: "practiced",
    difficulty: "easy", parentFeedback: "just_right",
    completedIndependently: true, notes: null, createdAt: "2026-04-26",
  },
  {
    id: "p2", childId: "demo-1", sessionId: "s2",
    skill: "phonics.cvc", status: "mastered",
    difficulty: "easy", parentFeedback: "too_easy",
    completedIndependently: true, notes: null, createdAt: "2026-04-25",
  },
  {
    id: "p3", childId: "demo-1", sessionId: "s3",
    skill: "math.place_value_100", status: "struggling",
    difficulty: "medium", parentFeedback: "too_hard",
    completedIndependently: false, notes: null, createdAt: "2026-04-24",
  },
];
