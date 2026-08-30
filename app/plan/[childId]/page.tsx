import Link from "next/link";
import { notFound } from "next/navigation";
import LocalTime from "@/components/LocalTime";
import WeeklyPlanCard from "@/components/WeeklyPlanCard";
import ThisWeek from "./ThisWeek";
import { currentWeek } from "@/lib/planWeek";
import BuildPlanButton from "./BuildPlanButton";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { WeeklyPlan } from "@/types/plan";

export const dynamic = "force-dynamic";

/**
 * One child's four-week plan — the month, rather than the sitting.
 *
 * Shows the most recent plan and lets the adult build a fresh one. RLS
 * scopes both queries to the signed-in owner, so a childId that isn't
 * theirs returns nothing and 404s rather than leaking that it exists.
 */
export default async function PlanPage({ params }: { params: { childId: string } }) {
  const supabase = getServerSupabase();

  const [childRes, planRes, sessionRes] = await Promise.all([
    supabase.from("children").select("id, nickname, grade").eq("id", params.childId).single(),
    supabase
      .from("learning_plans")
      .select("id, plan, source_gaps, completed, created_at")
      .eq("child_id", params.childId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("learning_sessions")
      .select("id, top_skill_gaps")
      .eq("child_id", params.childId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const child = childRes.data;
  if (!child) notFound();

  const row = planRes.data?.[0] ?? null;
  const plan = (row?.plan ?? null) as WeeklyPlan | null;
  const completed = ((row?.completed ?? []) as string[]) ?? [];
  const week = plan ? currentWeek(plan, completed) : null;
  const hasGaps = (sessionRes.data ?? []).some(
    (s) => ((s.top_skill_gaps ?? []) as string[]).length > 0
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-pop-magenta">
          Four-week plan
        </p>
        <h1 className="mt-1 font-display text-3xl text-pop-night">
          {child.nickname}&rsquo;s next month
        </h1>
        <p className="mt-2 text-pop-night/80">
          Five short sessions a week. Friday is review plus one small win.
        </p>
      </header>

      {plan === null ? (
        <div className="rounded-2xl border-[3px] border-dashed border-pop-night/40 bg-pop-cream p-6">
          {hasGaps ? (
            <>
              <p className="font-medium text-pop-night">No plan yet.</p>
              <p className="mt-1 text-sm text-pop-night/75">
                We&rsquo;ll build it from what the last session found, and sequence it so
                nothing gets skipped.
              </p>
              <div className="mt-4">
                <BuildPlanButton childId={params.childId} label="Build the plan" />
              </div>
            </>
          ) : (
            <>
              <p className="font-medium text-pop-night">
                There&rsquo;s nothing to plan from yet.
              </p>
              <p className="mt-1 text-sm text-pop-night/75">
                A month is built from what a session actually finds. Run one first —
                we&rsquo;d rather ask than invent four weeks of work for {child.nickname}.
              </p>
              <Link
                href={`/session/new?child=${params.childId}`}
                className="mt-4 inline-flex rounded-full border-[3px] border-pop-night bg-pop-pink px-4 py-2.5 font-display text-xs uppercase tracking-wide text-pop-night shadow-pop-sm hover:bg-pop-yellow"
              >
                Start a session
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <p className="text-xs text-pop-night/60">
              Built <LocalTime iso={row!.created_at as string} /> from{" "}
              {((row!.source_gaps ?? []) as string[]).length} skill gaps.
            </p>
            <BuildPlanButton childId={params.childId} label="Rebuild from the latest session" />
          </div>

          {week && (
            <div className="mb-8">
              <ThisWeek
                childId={params.childId}
                plan={plan}
                week={week}
                initialCompleted={completed}
              />
            </div>
          )}

          <h2 className="mb-3 font-display text-xs uppercase tracking-widest text-pop-night/60 print:hidden">
            The whole month
          </h2>
          <WeeklyPlanCard plan={plan} />

          <p className="mt-6 text-sm text-pop-night/60 print:hidden">
            <Link className="underline" href={`/progress/${params.childId}`}>
              Progress
            </Link>{" "}
            ·{" "}
            <Link className="underline" href={`/session/new?child=${params.childId}`}>
              New session
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
