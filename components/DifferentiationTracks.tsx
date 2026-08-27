import type { Differentiation } from "@/types/session";

/**
 * One lesson, three tracks, side by side.
 *
 * A teacher runs all three in the same room at the same time, so they are
 * laid out to be read together rather than as three separate plans. The
 * support track is deliberately first on mobile: it is the one she came
 * here for.
 */
export default function DifferentiationTracks({ tracks }: { tracks: Differentiation }) {
  const columns = [
    { key: "needsSupport", label: "Needs support", tone: "bg-pop-tangerine", body: tracks.needsSupport },
    { key: "wholeGroup", label: "Whole group", tone: "bg-pop-cyan", body: tracks.wholeGroup },
    { key: "readyForMore", label: "Ready for more", tone: "bg-pop-lime", body: tracks.readyForMore },
  ];

  return (
    <div className="mt-6">
      <h3 className="font-display text-xs uppercase tracking-widest text-pop-night/60">
        Same lesson, three tracks
      </h3>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {columns.map((c) => (
          <section
            key={c.key}
            className="rounded-xl border-[3px] border-pop-night bg-white p-4 print:break-inside-avoid"
          >
            <span
              className={`inline-block rounded-full border-[3px] border-pop-night ${c.tone} px-3 py-1 font-display text-[10px] uppercase tracking-widest text-pop-night`}
            >
              {c.label}
            </span>
            <p className="mt-3 text-sm text-pop-night/85">{c.body}</p>
          </section>
        ))}
      </div>
      {tracks.watchFor && (
        <p className="mt-3 rounded-xl border-[3px] border-pop-night bg-pop-cream px-4 py-3 text-sm font-medium text-pop-night/85 print:break-inside-avoid">
          <span className="font-display text-[10px] uppercase tracking-widest text-pop-magenta">
            Watch for
          </span>{" "}
          {tracks.watchFor}
        </p>
      )}
    </div>
  );
}
