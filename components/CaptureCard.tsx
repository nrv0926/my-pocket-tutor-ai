"use client";

import { useMemo, useState } from "react";
import type { ModeOfSupport } from "@/types/progress";
import type { Worksheet } from "@/types/session";

/**
 * Record how each question went, for an adult who was sitting there.
 *
 * Designed around one number: a six-question session should take well
 * under twenty seconds. That rules out a form. Every item starts at
 * "right, on their own", because most of them are, and the adult touches
 * only the exceptions — so a session that went well is a single tap on
 * Save.
 *
 * Adult-only by construction. There is no child view, no child login, and
 * nothing here is shown to the learner.
 */

type Verdict = "correct" | "wrong" | "skipped";

export interface CaptureRow {
  itemId: string;
  verdict: Verdict;
  mode: ModeOfSupport;
  excluded: boolean;
}

const VERDICTS: { v: Verdict; label: string; hint: string }[] = [
  { v: "correct", label: "Right", hint: "Got it" },
  { v: "wrong", label: "Wrong", hint: "Did not get it" },
  { v: "skipped", label: "Skipped", hint: "Did not try it" },
];

// Plain words. The difference that matters is the last one: help that did
// not hand over the thing being tested still counts as their own work.
const MODES: { m: ModeOfSupport; label: string }[] = [
  { m: "independent", label: "On their own" },
  { m: "prompted", label: "Needed a nudge" },
  { m: "modelled", label: "I showed them" },
  { m: "accommodated", label: "Help, but not this skill" },
];

export default function CaptureCard({
  worksheet,
  answerKey,
  alreadyClosed,
  onSave,
}: {
  worksheet: Worksheet;
  answerKey: { questionId: string; answer: string }[];
  alreadyClosed: boolean;
  onSave: (rows: CaptureRow[]) => Promise<void>;
}) {
  const answers = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of answerKey) m.set(a.questionId, a.answer);
    return m;
  }, [answerKey]);

  const [rows, setRows] = useState<CaptureRow[]>(() =>
    worksheet.questions.map((q) => ({
      itemId: q.id,
      verdict: "correct" as Verdict,
      mode: "independent" as ModeOfSupport,
      excluded: false,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (i: number, patch: Partial<CaptureRow>) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const exceptions = rows.filter(
    (r) => r.verdict !== "correct" || r.mode !== "independent" || r.excluded,
  ).length;

  return (
    <div className="rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm">
      <header className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl text-pop-night">How did it go?</h2>
        <p className="text-sm text-pop-night/60">
          {exceptions === 0
            ? "Everything is set to right, on their own"
            : `${exceptions} marked differently`}
        </p>
      </header>
      <p className="mb-4 max-w-prose text-sm text-pop-night/70">
        Every question starts at <strong>Right</strong> and{" "}
        <strong>On their own</strong>. Change only the ones that went
        differently, then save. {done ? "" : "Saving finishes the session."}
      </p>

      <ol className="space-y-4">
        {worksheet.questions.map((q, i) => {
          const row = rows[i];
          const expected = answers.get(q.id);
          return (
            <li
              key={q.id}
              className={`rounded-xl border-[3px] p-3 ${
                row.excluded
                  ? "border-dashed border-pop-night/40 bg-pop-cream/60"
                  : "border-pop-night bg-pop-cream"
              }`}
            >
              <div className="mb-2">
                <span className="font-display text-sm text-pop-night/60">
                  {i + 1}.
                </span>{" "}
                <span className="text-pop-night">{q.prompt}</span>
                {expected && (
                  <p className="mt-0.5 text-sm text-pop-night/60">
                    Expected: {expected}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {VERDICTS.map((v) => (
                  <button
                    key={v.v}
                    type="button"
                    aria-pressed={row.verdict === v.v}
                    title={v.hint}
                    onClick={() => set(i, { verdict: v.v })}
                    className={`min-h-[3rem] rounded-lg border-[3px] border-pop-night text-sm font-semibold ${
                      row.verdict === v.v
                        ? "bg-pop-cyan text-pop-night"
                        : "bg-white text-pop-night/70 hover:bg-pop-cream"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MODES.map((m) => (
                  <button
                    key={m.m}
                    type="button"
                    aria-pressed={row.mode === m.m}
                    onClick={() => set(i, { mode: m.m })}
                    className={`min-h-[2.75rem] rounded-lg border-[3px] border-pop-night px-2 text-xs font-semibold leading-tight ${
                      row.mode === m.m
                        ? "bg-pop-pink text-pop-night"
                        : "bg-white text-pop-night/70 hover:bg-pop-cream"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-pop-night/70">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={row.excluded}
                  onChange={(e) => set(i, { excluded: e.target.checked })}
                />
                Don&apos;t count this one — it doesn&apos;t test the skill
              </label>
            </li>
          );
        })}
      </ol>

      {error && (
        <p className="mt-4 rounded-xl border-[3px] border-pop-magenta bg-pop-magenta/10 px-3 py-2 text-sm text-pop-night">
          {error}
        </p>
      )}
      {done && (
        <p className="mt-4 rounded-xl border-[3px] border-pop-night bg-pop-cyan px-3 py-2 text-sm font-semibold text-pop-night">
          Saved. This session now counts towards what to teach next.
        </p>
      )}

      <div className="sticky bottom-3 mt-5">
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            setError(null);
            try {
              await onSave(rows);
              setDone(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not save.");
            } finally {
              setSaving(false);
            }
          }}
          className="w-full rounded-full bg-pop-pink px-5 py-4 font-display text-lg font-semibold text-pop-night shadow disabled:opacity-50"
        >
          {saving ? "Saving…" : alreadyClosed || done ? "Save again as a retry" : "Save and finish"}
        </button>
        {(alreadyClosed || done) && (
          <p className="mt-1 text-center text-xs text-pop-night/60">
            The first save is the one that counts. A second is kept as a retry.
          </p>
        )}
      </div>
    </div>
  );
}
