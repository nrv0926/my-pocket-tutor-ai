import Link from "next/link";
import { notFound } from "next/navigation";
import ProgressTracker from "@/components/ProgressTracker";
import { isRepeatedStruggle, summarize } from "@/lib/progressEngine";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { ProgressRecord } from "@/types/progress";

export const dynamic = "force-dynamic";

/**
 * Per-child progress page. Four sections:
 *
 *   1. Skills practiced       — unique skills with practice counts
 *   2. Repeated struggles     — skills appearing as struggling >= 3 times
 *   3. Difficulty history     — chronological per-session difficulty
 *   4. Independence           — how often the child completed solo
 */
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
      .select(
        "id, child_id, session_id, skill, status, difficulty, parent_feedback, completed_independently, notes, created_at"
      )
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

  // -------------- derived views --------------
  const practicedBySkill = new Map<
    string,
    { count: number; lastSeen: string; status: ProgressRecord["status"] }
  >();
  for (const r of records) {
    const prev = practicedBySkill.get(r.skill);
    practicedBySkill.set(r.skill, {
      count: (prev?.count ?? 0) + 1,
      lastSeen: prev && prev.lastSeen > r.createdAt ? prev.lastSeen : r.createdAt,
      status: prev?.status ?? r.status,
    });
  }

  const skillsList = [...practicedBySkill.entries()]
    .sort((a, b) => b[1].lastSeen.localeCompare(a[1].lastSeen))
    .map(([skill, v]) => ({ skill, ...v }));

  const uniqueSkills = [...new Set(records.map((r) => r.skill))];
  const repeatedStruggles = uniqueSkills.filter((s) =>
    isRepeatedStruggle(records, s, 3)
  );

  const difficultyHistory = records
    .filter((r) => r.difficulty)
    .slice(0, 12)
    .map((r) => ({
      when: new Date(r.createdAt).toLocaleDateString(),
      skill: r.skill,
      difficulty: r.difficulty!,
      feedback: r.parentFeedback,
    }));

  const independent = records.filter((r) => r.completedIndependently === true).length;
  const withHelp = records.filter((r) => r.completedIndependently === false).length;
  const independencePct =
    records.length === 0 ? 0 : Math.round((independent / (independent + withHelp || 1)) * 100);

  // -------------- render --------------
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
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

      {records.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-cream-300 bg-white p-8 text-center text-sm text-ink-muted shadow-card">
          No sessions yet. Run a learning session and your progress will appear here.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {/* 1. Skills practiced */}
          <section className="rounded-2xl border border-cream-300 bg-white p-5 shadow-card">
            <h2 className="mb-3 font-serif text-xl text-ink">Skills practiced</h2>
            <ul className="divide-y divide-cream-200 text-sm">
              {skillsList.map((s) => (
                <li key={s.skill} className="flex items-center justify-between py-2">
                  <span className="text-ink">{s.skill}</span>
                  <span className="flex items-center gap-2 text-ink-muted">
                    <span>×{s.count}</span>
                    <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs capitalize">
                      {s.status}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* 2. Repeated struggles */}
          <section className="rounded-2xl border border-cream-300 bg-white p-5 shadow-card">
            <h2 className="mb-3 font-serif text-xl text-ink">Repeated struggles</h2>
            {repeatedStruggles.length === 0 ? (
              <p className="text-sm text-ink-muted">
                None right now — nothing has come up as struggling three or more times in a row.
              </p>
            ) : (
              <>
                <p className="mb-3 text-sm text-ink-soft">
                  These skills have shown up as <strong>struggling</strong> three or
                  more times. Consider stepping back to a simpler micro-skill next session.
                </p>
                <ul className="ml-5 list-disc space-y-1 text-sm text-ink">
                  {repeatedStruggles.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* 3. Difficulty history */}
          <section className="rounded-2xl border border-cream-300 bg-white p-5 shadow-card">
            <h2 className="mb-3 font-serif text-xl text-ink">Difficulty history</h2>
            {difficultyHistory.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Difficulty will appear here as you complete sessions.
              </p>
            ) : (
              <ol className="space-y-2 text-sm">
                {difficultyHistory.map((d, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="text-ink-muted">{d.when}</span>
                    <span className="flex-1 px-3 truncate text-ink">{d.skill}</span>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-xs capitalize",
                        d.difficulty === "easy"
                          ? "bg-forest-50 text-forest-600"
                          : d.difficulty === "hard"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-cream-100 text-ink-soft",
                      ].join(" ")}
                    >
                      {d.difficulty}
                    </span>
                    {d.feedback && (
                      <span className="ml-2 text-xs text-ink-muted">
                        ({d.feedback.replaceAll("_", " ")})
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* 4. Independence */}
          <section className="rounded-2xl border border-cream-300 bg-white p-5 shadow-card">
            <h2 className="mb-3 font-serif text-xl text-ink">Completed independently</h2>
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <p className="font-serif text-4xl text-forest-600">{independencePct}%</p>
                <p className="text-xs text-ink-muted">of sessions answered solo</p>
              </div>
              <div className="text-sm text-ink-soft">
                <p>
                  <strong>{independent}</strong> session{independent === 1 ? "" : "s"} on their own
                </p>
                <p>
                  <strong>{withHelp}</strong> session{withHelp === 1 ? "" : "s"} with help
                </p>
              </div>
            </div>
            {independencePct < 50 && independent + withHelp > 2 && (
              <p className="mt-3 text-xs text-ink-muted">
                Tip: when independence drops below 50%, the next session's difficulty will
                step down automatically.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
