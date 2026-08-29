"use client";

import type { SessionInputType } from "@/types/session";

/**
 * How the adult is telling us what this session is for.
 *
 * Two of the three modes are diagnostic — she describes something and we
 * work out what is underneath it. The third is not: she already knows what
 * to teach, picked it from the curriculum, and has nothing to write. That
 * one is why the text box below can be empty.
 */
export interface SessionMode {
  id: SessionInputType;
  title: string;
  desc: string;
  /** Label above the text box, which changes with what the box is for. */
  label: string;
  placeholder: string;
}

export const SESSION_MODES: SessionMode[] = [
  {
    id: "paste",
    title: "Paste report card comments",
    desc: "A sentence or two from the term report works.",
    label: "Paste report card comments",
    placeholder: "e.g. Reads grade-level texts but is hesitant with multisyllabic words...",
  },
  {
    id: "description",
    title: "Describe a homework struggle",
    desc: "Tell us what's going on in plain English.",
    label: "Describe a homework struggle",
    placeholder: "e.g. He freezes when subtraction has borrowing.",
  },
  {
    id: "plan",
    title: "I know what to teach",
    desc: "Pick it above. Nothing to write.",
    label: "Anything else we should know? (optional)",
    placeholder: "Optional. e.g. Third period, twenty minutes, no printer today.",
  },
];

export function sessionMode(id: SessionInputType): SessionMode {
  return SESSION_MODES.find((m) => m.id === id) ?? SESSION_MODES[0];
}

export default function SessionModePicker({
  value,
  onChange,
}: {
  value: SessionInputType;
  onChange: (mode: SessionInputType) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {SESSION_MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          aria-pressed={value === m.id}
          className={[
            "rounded-2xl border p-5 text-left shadow-pop-sm transition",
            value === m.id
              ? "border-pop-night bg-pop-cyan"
              : "border-pop-night bg-white hover:border-pop-night",
          ].join(" ")}
        >
          <p className="font-display text-lg text-pop-night">{m.title}</p>
          <p className="mt-1 text-sm text-pop-night/80">{m.desc}</p>
        </button>
      ))}
    </div>
  );
}
