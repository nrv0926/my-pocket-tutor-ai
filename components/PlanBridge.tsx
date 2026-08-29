import Link from "next/link";
import BuildPlanButton from "@/app/plan/[childId]/BuildPlanButton";

/**
 * The step after "here's the plan": a month, not just today.
 *
 * A report card analysis names the top three priorities and then used to
 * stop, leaving the adult to work out what a month of acting on it looks
 * like. That is exactly the work they came here to avoid. The four-week
 * generator was already sitting behind /plan; this is the bridge to it from
 * the moment they most want it.
 */
export default function PlanBridge({
  childId,
  nickname,
  hasPlan,
}: {
  childId: string;
  nickname: string;
  hasPlan: boolean;
}) {
  return (
    <section className="rounded-2xl border-[3px] border-pop-night bg-pop-cyan/30 p-5 shadow-pop-sm print:hidden">
      <p className="font-display text-[11px] uppercase tracking-widest text-pop-magenta">
        Next
      </p>
      <h2 className="mt-1 font-display text-xl text-pop-night">
        {hasPlan ? `${nickname} already has a month mapped out.` : `Turn this into ${nickname}'s next month.`}
      </h2>
      <p className="mt-1.5 text-sm text-pop-night/80">
        {hasPlan
          ? "Open it, or rebuild it from what this session just found."
          : "Four weeks, five short sessions each, built from the gaps above and sequenced so nothing gets skipped."}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {hasPlan ? (
          <Link
            href={`/plan/${childId}`}
            className="inline-flex rounded-full border-[3px] border-pop-night bg-pop-pink px-4 py-2.5 font-display text-xs uppercase tracking-wide text-pop-night shadow-pop-sm hover:bg-pop-yellow"
          >
            Open the 4-week plan
          </Link>
        ) : (
          <BuildPlanButton childId={childId} label="Build the 4-week plan" />
        )}
      </div>
    </section>
  );
}
