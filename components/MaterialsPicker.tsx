"use client";

import type { ExtraKind } from "@/types/session";

/**
 * One control, not ten AI features.
 *
 * Most of what an adult asks for is already in every plan: the mini-lesson,
 * the vocabulary cards and word lists, the small-group tracks, the levelled
 * worksheets. Three things are genuinely extra, and each costs output to
 * write — so they are ticked, never assumed. A parent who wanted tonight's
 * worksheet did not ask for homework.
 */
const CHOICES: { kind: ExtraKind; label: string; hint: string }[] = [
  {
    kind: "exitTicket",
    label: "Exit ticket",
    hint: "Two or three questions at the end, markable at a glance.",
  },
  {
    kind: "homework",
    label: "Homework",
    hint: "Ten minutes alone, same skill, nothing new to learn.",
  },
  {
    kind: "challenge",
    label: "Challenge",
    hint: "For whoever finishes early. Deeper, not longer.",
  },
];

export default function MaterialsPicker({
  value,
  onChange,
}: {
  value: ExtraKind[];
  onChange: (next: ExtraKind[]) => void;
}) {
  const toggle = (k: ExtraKind) =>
    onChange(value.includes(k) ? value.filter((v) => v !== k) : [...value, k]);

  return (
    <fieldset className="rounded-2xl border-[3px] border-pop-night bg-white p-4">
      <legend className="px-1 font-display text-sm uppercase tracking-widest text-pop-night">
        Also make <span className="text-pop-night/50">(optional)</span>
      </legend>
      <p className="mb-3 text-xs text-pop-night/65">
        The lesson, materials and worksheet always come. These do not, unless
        you ask.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {CHOICES.map((c) => (
          <label
            key={c.kind}
            className={`flex cursor-pointer items-start gap-2.5 rounded-xl border-[3px] border-pop-night p-3 transition ${
              value.includes(c.kind) ? "bg-pop-cyan" : "bg-pop-cream hover:bg-white"
            }`}
          >
            <input
              type="checkbox"
              checked={value.includes(c.kind)}
              onChange={() => toggle(c.kind)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-pop-magenta"
            />
            <span className="text-sm text-pop-night">
              <b>{c.label}</b>
              <span className="mt-0.5 block text-xs text-pop-night/70">{c.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
