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

type Verdict = "correct" | "wrong" | "skipped" | "unsure";

export interface CaptureRow {
  itemId: string;
  verdict: Verdict;
  mode: ModeOfSupport;
  excluded: boolean;
}

/** Standing accommodations from the profile. See migration 0011. */
export type Accommodation = "read_aloud" | "timed_never_counts" | "plain_literal_wording";

const VERDICTS: { v: Verdict; label: string; hint: string }[] = [
  { v: "correct", label: "Right", hint: "Got it" },
  { v: "wrong", label: "Wrong", hint: "Did not get it" },
  { v: "skipped", label: "Skipped", hint: "Did not try it" },
  // The honest option. A mumbled answer, handwriting she cannot read back:
  // without this she has to guess right or wrong, and a guess is worse
  // evidence than an admission. Saves as pending_review, carries no score,
  // and stays out of the decision until she confirms it.
  { v: "unsure", label: "Not sure", hint: "Could not tell — decide later" },
];

// Plain words. The difference that matters is the last one: help that did
// not hand over the thing being tested still counts as their own work.
const MODES: { m: ModeOfSupport; label: string }[] = [
  { m: "independent", label: "On their own" },
  { m: "prompted", label: "Needed a nudge" },
  { m: "modelled", label: "I showed them" },
  { m: "accommodated", label: "Help, but not this skill" },
];

/**
 * A fresh capture key. crypto.randomUUID needs a secure context, which
 * localhost and https both are; the fallback keeps a plain-http preview
 * working rather than throwing on a screen whose whole job is one tap.
 */
function newKey(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b);
  else for (let i = 0; i < 16; i += 1) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = [...b].map((n) => n.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function CaptureCard({
  worksheet,
  answerKey,
  alreadyClosed,
  accommodations = [],
  sessionExcluded = false,
  onSave,
  onExcludeSession,
}: {
  worksheet: Worksheet;
  answerKey: { questionId: string; answer: string }[];
  alreadyClosed: boolean;
  /**
   * From the profile, so she is not re-tapping the same accommodation on
   * every question for the rest of the year (scenario LC-04). Only
   * read_aloud changes anything here: it is help that does not supply the
   * skill being measured, so it sets the default mode to "accommodated"
   * rather than "prompted" — which is why a reading difficulty does not
   * drag maths down.
   *
   * timed_never_counts cannot be applied here yet: nothing marks a question
   * as timed, so there is no per-item signal to act on. plain_literal_wording
   * is a generation hint and never reaches this screen.
   */
  accommodations?: Accommodation[];
  sessionExcluded?: boolean;
  onSave: (rows: CaptureRow[], captureKey: string) => Promise<void>;
  onExcludeSession?: (excluded: boolean, reason: string) => Promise<void>;
}) {
  const answers = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of answerKey) m.set(a.questionId, a.answer);
    return m;
  }, [answerKey]);

  const readAloud = accommodations.includes("read_aloud");

  const [rows, setRows] = useState<CaptureRow[]>(() =>
    worksheet.questions.map((q) => ({
      itemId: q.id,
      verdict: "correct" as Verdict,
      mode: (readAloud ? "accommodated" : "independent") as ModeOfSupport,
      excluded: false,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /**
   * One key per filled-in form. The same key twice is the same save, so a
   * double tap or a resubmit writes nothing the second time (scenario
   * C-08). Changing anything after a save mints a new one, because that is
   * a deliberate recapture and should become attempt 2 (C-06).
   */
  const [captureKey, setCaptureKey] = useState(() => newKey());
  const [excluded, setExcluded] = useState(sessionExcluded);
  const [reason, setReason] = useState("");

  const set = (i: number, patch: Partial<CaptureRow>) => {
    if (done) {
      setCaptureKey(newKey());
      setDone(false);
    }
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  };

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

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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

      {onExcludeSession && (
        <div className="mt-5 rounded-xl border-[3px] border-dashed border-pop-night/40 bg-pop-cream/60 p-3">
          {/*
            Scenario LC-15. A meltdown halfway through, or a child who was
            ill: the sitting says nothing about the skill. Ticking each
            question in turn is the wrong shape — it was not six bad
            questions, it was one bad day. The session stays in history
            either way; it just stops being counted.
          */}
          <label className="flex cursor-pointer items-start gap-2 text-sm text-pop-night/80">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5"
              checked={excluded}
              onChange={async (e) => {
                const next = e.target.checked;
                setExcluded(next);
                setError(null);
                try {
                  await onExcludeSession(next, next ? reason : "");
                } catch (err) {
                  setExcluded(!next);
                  setError(err instanceof Error ? err.message : "Could not update the session.");
                }
              }}
            />
            <span>
              <strong>Today wasn&apos;t a fair test.</strong> Keep this session
              in their history, but leave it out of what to teach next.
            </span>
          </label>
          {excluded && (
            <input
              type="text"
              value={reason}
              maxLength={300}
              placeholder="Why, if you want to remember (optional)"
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => void onExcludeSession(true, reason)}
              className="mt-2 w-full rounded-lg border-[3px] border-pop-night bg-white px-3 py-2 text-sm text-pop-night"
            />
          )}
        </div>
      )}

      <div className="sticky bottom-3 mt-5">
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            setError(null);
            try {
              await onSave(rows, captureKey);
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
