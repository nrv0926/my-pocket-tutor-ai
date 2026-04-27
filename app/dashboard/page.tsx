import Link from "next/link";
import ProgressTracker from "@/components/ProgressTracker";
import type { ProgressSummary } from "@/types/progress";

/**
 * Server component shell. Real data wiring (Supabase) lands in Phase 1.5.
 * Today it renders empty/mock state so the layout is reviewable.
 */
export default async function DashboardPage() {
  const children = MOCK_CHILDREN;
  const recent = MOCK_RECENT;
  const summary = MOCK_SUMMARY;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">
            Your dashboard
          </p>
          <h1 className="mt-1 font-serif text-3xl text-ink">Welcome back.</h1>
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
            </ul>
          )}

          <h2 className="mb-3 mt-8 font-serif text-xl text-ink">Recent sessions</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-ink-muted">Your recent sessions will appear here.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-cream-300 bg-white p-4 text-sm shadow-card"
                >
                  <div>
                    <p className="font-medium text-ink">{s.title}</p>
                    <p className="text-xs text-ink-muted">
                      {s.subject} · {s.createdAt}
                    </p>
                  </div>
                  <Link
                    href={`/results/${s.id}`}
                    className="text-forest-500 hover:underline"
                  >
                    Open
                  </Link>
                </li>
              ))}
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

// Mock data — will be replaced with Supabase reads.
const MOCK_CHILDREN = [
  { id: "demo-1", nickname: "Bean", grade: "1", location: "ON-CA" },
  { id: "demo-2", nickname: "R.",   grade: "3", location: "ON-CA" },
];

const MOCK_RECENT = [
  { id: "sess-1", title: "Reading: blends + CVC warm-up", subject: "Reading", createdAt: "today" },
  { id: "sess-2", title: "Math: place value to 100",      subject: "Math",    createdAt: "yesterday" },
];

const MOCK_SUMMARY: ProgressSummary = {
  practicedCount: 7,
  masteredCount: 2,
  strugglingCount: 1,
  recentSkills: [
    { skill: "phonics.blends",  status: "practiced", lastSeen: "2026-04-26" },
    { skill: "phonics.cvc",     status: "mastered",  lastSeen: "2026-04-25" },
    { skill: "math.place_value_100", status: "struggling", lastSeen: "2026-04-24" },
  ],
};
