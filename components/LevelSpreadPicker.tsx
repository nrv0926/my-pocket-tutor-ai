"use client";

import {
  ACHIEVEMENT_LEVELS,
  ACHIEVEMENT_SHORT,
  type AchievementLevel,
} from "@/types/child";

export type LevelSpread = Partial<Record<AchievementLevel, number>>;

/**
 * How many students sit at each level.
 *
 * This is what makes a class plan a class plan: the three differentiation
 * tracks get sized to the room, so the support track is written for the six
 * students who need it rather than for a hypothetical one.
 *
 * Optional in full. A teacher who does not know the split leaves it blank and
 * still gets a lesson.
 */
export default function LevelSpreadPicker({
  value,
  onChange,
}: {
  value: LevelSpread;
  onChange: (next: LevelSpread) => void;
}) {
  const total = ACHIEVEMENT_LEVELS.reduce((n, l) => n + (value[l] ?? 0), 0);

  return (
    <fieldset className="rounded-xl border-[3px] border-pop-night bg-pop-cream p-4">
      <legend className="px-2 text-sm font-medium text-pop-night/80">
        How the class splits <span className="text-pop-night/50">(optional)</span>
      </legend>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACHIEVEMENT_LEVELS.map((l) => (
          <label
            key={l}
            className="rounded-lg border-[3px] border-pop-night bg-white p-3"
          >
            <span className="block font-display text-xs uppercase tracking-wide text-pop-night">
              Level {l}
            </span>
            <span className="mt-0.5 block text-[11px] text-pop-night/60">
              {ACHIEVEMENT_SHORT[l]}
            </span>
            <input
              type="number"
              min={0}
              max={60}
              inputMode="numeric"
              value={value[l] ?? ""}
              placeholder="0"
              aria-label={`Students at Level ${l}`}
              onChange={(e) => {
                const n = e.target.value === "" ? undefined : Math.max(0, Number(e.target.value));
                const next = { ...value };
                if (n === undefined || Number.isNaN(n)) delete next[l];
                else next[l] = n;
                onChange(next);
              }}
              className="mt-2 w-full rounded-lg border-[3px] border-pop-night bg-pop-cream px-2 py-1.5 text-center font-display outline-none focus:bg-white focus:ring-4 focus:ring-pop-pink/30"
            />
          </label>
        ))}
      </div>

      <p className="mt-2 text-xs text-pop-night/60">
        {total > 0
          ? `${total} student${total === 1 ? "" : "s"} — we'll size the three tracks to match.`
          : "Leave blank and we'll write one lesson with the usual three tracks."}
      </p>
    </fieldset>
  );
}
