import Link from "next/link";
import ProgressTracker from "@/components/ProgressTracker";
import { getServerSupabase } from "@/lib/supabaseServer";
import { summarize } from "@/lib/progressEngine";
import type { ProgressRecord } from "@/types/progress";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Middleware already redirected unauthenticated users; keep this for safety.
  if (!user) return null;

  // Pull the parent's children, recent sessions, and progress records in
  // parallel. RLS scopes everything to this auth.uid().
  const [childrenRes, sessionsRes, progressRes] = await Promise.all([
    supabase
      .from("children")
      .select("id, nickname, grade, location")
      .order("created_at", { ascending: true }),
    supabase
      .from("learning_sessions")
      .select("id, child_id, subject, created_at, analysis_result")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("progress_records")
      .select("id, child_id, session_id, skill, status, difficulty, parent_feedback, completed_independently, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const children = childrenRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const progressRows: ProgressRecord[] = (progressRes.data ?? []).map((r) => ({
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
  const summary = summarize(progressRows);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">
            Your dashboard
          </p>
          <h1 className="mt-1 font-serif text-3xl text-ink">Welcome back.</h1>
          <p className="mt-1 text-sm text-ink-muted">{user.email}</p>
        </div>
        <Link
          href="/session/new"
          className="rounded-full bg-forest-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-forest-600"
        >
          New learning session
        </Link>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <section className="md:col-span-2">
          <h2 className="mb-3 font-serif text-xl text-ink">Children</h2>
          {children.length === 0 ? (
            <EmptyState
              title="No children yet"
              ctaHref="/children/new"
              ctaLabel="Create child profile"
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {children.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-2xl border border-cream-300 bg-white p-5 shadow-card"
                >
                  <div>
                    <p className="font-serif text-lg text-ink">{c.nickname}</p>
                    <p className="text-sm text-ink-muted">
                      Grade {c.grade} · {c.location}
                    </p>
                  </div>
                  <Link
                    href={`/progress/${c.id}`}
                    className="text-sm text-forest-500 hover:underline"
                  >
                    View progress →
                  </Link>
                </li>
              ))}
              <li className="flex items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-50 p-5 text-sm text-ink-soft hover:border-forest-500">
                <Link href="/children/new">+ Add another child</Link>
              </li>
            </ul>
          )}

          <h2 className="mb-3 mt-8 font-serif text-xl text-ink">Recent sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Your recent sessions will appear here.
            </p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => {
                const title =
                  (s.analysis_result as { whatINotice?: string } | null)?.whatINotice?.slice(0, 80) ??
                  `${s.subject} session`;
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-cream-300 bg-white p-4 text-sm shadow-card"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{title}</p>
                      <p className="text-xs text-ink-muted">
                        {s.subject} · {new Date(s.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Link
                      href={`/results/${s.id}`}
                      className="ml-4 shrink-0 text-forest-500 hover:underline"
                    >
                      Open
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside>
          <h2 className="mb-3 font-serif text-xl text-ink">Progress</h2>
          <ProgressTracker summary={summary} />
        </aside>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-cream-300 bg-white p-8 text-center shadow-card">
      <p className="font-serif text-lg text-ink">{title}</p>
      <Link
        href={ctaHref}
        className="mt-3 inline-flex items-center rounded-full bg-forest-500 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-600"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
