"use client";

import {
  ACHIEVEMENT_LEVELS,
  ACHIEVEMENT_LABEL,
  ACHIEVEMENT_SHORT,
  type AchievementLevel,
} from "@/types/child";

/**
 * Ontario's achievement chart, 1 to 4.
 *
 * A teacher reads this scale without explanation — it is on every report card
 * she writes. Level 3 is the provincial standard, not a middling grade, so
 * nothing here implies 4 is the goal and 3 is a shortfall.
 *
 * Optional, and shown only to teachers and homeschoolers: a parent has never
 * been asked to place their child on the chart and guessing would be worse
 * than leaving it blank.
 */
export default function AchievementLevelPicker({
  value,
  onChange,
}: {
  value: AchievementLevel | null;
  onChange: (level: AchievementLevel | null) => void;
}) {
  return (
    <fieldset className="rounded-xl border-[3px] border-pop-night bg-pop-cream p-4">
      <legend className="px-2 text-sm font-medium text-pop-night/80">
        Achievement level <span className="text-pop-night/50">(optional)</span>
      </legend>

      <div className="flex flex-wrap gap-2">
        {ACHIEVEMENT_LEVELS.map((l) => {
          const active = value === l;
          return (
            <button
              key={l}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : l)}
              title={ACHIEVEMENT_LABEL[l]}
              className={`flex-1 whitespace-nowrap rounded-lg border-[3px] border-pop-night px-3 py-2 text-left transition-all ${
                active ? "bg-pop-night text-pop-cream" : "bg-white text-pop-night hover:bg-pop-yellow"
              }`}
            >
              <span className="block font-display text-sm uppercase tracking-wide">
                Level {l}
              </span>
              <span className={`block text-[11px] ${active ? "text-pop-cream/80" : "text-pop-night/60"}`}>
                {ACHIEVEMENT_SHORT[l]}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-pop-night/60">
        {value
          ? ACHIEVEMENT_LABEL[value]
          : "Level 3 is the provincial standard. Leave blank if you'd rather we work it out from what you describe."}
      </p>
    </fieldset>
  );
}
