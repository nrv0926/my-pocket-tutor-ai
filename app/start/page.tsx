import Link from "next/link";
import { redirect } from "next/navigation";
import LocalTime from "@/components/LocalTime";
import { continuityFor } from "@/lib/continuity";
import { getRole } from "@/lib/role";
import { roleCopy } from "@/lib/roleCopy";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { ProgressRecord } from "@/types/progress";

export const dynamic = "force-dynamic";

/**
 * Where a session starts: four doors instead of one text box.
 *
 * The app had a single entry — describe a problem in a large textarea — which
 * assumes the adult can already name what is wrong. Often they cannot: they
 * have a report card they do not fully understand, or they know the topic and
 * not the problem, or they simply want to carry on from last week. Each of
 * those is a different door, and all four already existed behind the scenes
 * with no screen to choose between them.
 */
export default async function StartPage({
  searchParams,
}: {
  searchParams: { child?: string };
}) {
  const role = getRole();
  if (!role) redirect("/welcome?next=%2Fstart");
  const copy = roleCopy(role);

  const supabase = getServerSupabase();
  const [childrenRes, sessionsRes, progressRes] = await Promise.all([
    supabase.from("children").select("id, nickname, grade").order("created_at", { ascending: true }),
    supabase
      .from("learning_sessions")
      .select("id, child_id, subject, created_at, analysis_result")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("progress_records")
      .select("session_id, child_id, parent_feedback, notes")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const children = childrenRes.data ?? [];
  if (children.length === 0) redirect("/children/new");

  const sessions = sessionsRes.data ?? [];
  const progress: Pick<ProgressRecord, "sessionId" | "childId" | "parentFeedback" | "notes">[] = (
    progressRes.data ?? []
  ).map((r) => ({
    sessionId: r.session_id,
    childId: r.child_id,
    parentFeedback: r.parent_feedback,
    notes: r.notes,
  }));

  // Whoever was asked for, else whoever was worked with most recently, else
  // the first profile.
  const asked = children.find((c) => c.id === searchParams.child);
  const recent = children.find((c) => c.id === sessions[0]?.child_id);
  const child = asked ?? recent ?? children[0];
  const thread = continuityFor(child.id, sessions, progress);

  const doors = [
    {
      href: `/session/new?child=${child.id}`,
      title: "Describe what's difficult",
      line: copy.startDescribe,
      tone: "bg-pop-pink",
    },
    {
      href: "/upload",
      title: "Upload something",
      line: "A report card, a marked test, a worksheet — a photo of the page is fine.",
      tone: "bg-pop-yellow",
    },
    {
      href: `/curriculum?child=${child.id}`,
      title: "Choose from the curriculum",
      line: "Grade, topic, then the exact expectation. Nothing to write.",
      tone: "bg-pop-cyan",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-pop-magenta">
          {child.nickname} · Grade {child.grade}
        </p>
        <h1 className="mt-1 font-display text-4xl leading-[1.05] text-pop-night">
          What would you like help with?
        </h1>
      </header>

      {thread.last && (
        <Link
          href={`/session/new?child=${child.id}&subject=${encodeURIComponent(thread.last.subject)}`}
          className="mb-4 block rounded-2xl border-[3px] border-pop-night bg-pop-night p-5 text-pop-cream shadow-pop-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
        >
          <p className="font-display text-[11px] uppercase tracking-widest text-pop-cyan">
            Carry on · last worked <LocalTime iso={thread.last.createdAt} />
          </p>
          <p className="mt-1 font-display text-xl">Continue where you left off</p>
          {thread.last.nextStepPlan && (
            <p className="mt-1.5 text-sm text-pop-cream/85">{thread.last.nextStepPlan}</p>
          )}
        </Link>
      )}

      <ul className="space-y-3">
        {doors.map((d) => (
          <li key={d.href}>
            <Link
              href={d.href}
              className={`block rounded-2xl border-[3px] border-pop-night ${d.tone} p-5 shadow-pop-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none`}
            >
              <p className="font-display text-xl text-pop-night">{d.title}</p>
              <p className="mt-1 text-sm text-pop-night/80">{d.line}</p>
            </Link>
          </li>
        ))}
      </ul>

      {children.length > 1 && (
        <p className="mt-6 text-sm text-pop-night/60">
          Planning for someone else?{" "}
          {children
            .filter((c) => c.id !== child.id)
            .map((c) => (
              <Link
                key={c.id}
                href={`/start?child=${c.id}`}
                className="mr-3 text-pop-magenta underline underline-offset-2"
              >
                {c.nickname}
              </Link>
            ))}
        </p>
      )}
    </div>
  );
}
