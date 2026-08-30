"use client";

import { useState } from "react";
import { explainExpectation } from "@/lib/actions/explain";
import type { Explanation } from "@/types/explain";

/**
 * One expectation, in plain English.
 *
 * The explanation is ours and this says so — Ontario's wording sits directly
 * above it, unaltered, so the two are never confused. Generated once by a
 * signed-in person and cached for everyone after that: /curriculum is public,
 * and an explanation written on every view would let a crawler spend money.
 */
export default function ExpectationNote({
  subject,
  grade,
  program,
  code,
  initial,
  canWrite,
}: {
  subject: string;
  grade: string;
  program: string | null;
  code: string;
  initial: Explanation | null;
  canWrite: boolean;
}) {
  const [note, setNote] = useState<Explanation | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!note) {
    if (!canWrite) return null;
    return (
      <div className="mt-3">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              setNote(
                await explainExpectation({
                  subject,
                  grade,
                  program: program as "core" | "extended" | "immersion" | null,
                  code,
                })
              );
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not explain that one.");
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-full border-[3px] border-pop-night bg-white px-3 py-1.5 font-display text-[11px] uppercase tracking-wide text-pop-night shadow-pop-sm hover:bg-pop-cyan disabled:opacity-60"
        >
          {busy ? "Writing…" : "Explain in plain English"}
        </button>
        {error && <p className="mt-2 text-xs text-pop-magenta">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border-[3px] border-pop-night bg-pop-cyan/25 p-4">
      <p className="font-display text-[10px] uppercase tracking-widest text-pop-magenta">
        In plain English — our wording, not Ontario&rsquo;s
      </p>

      <p className="mt-2 text-sm text-pop-night">{note.plain}</p>

      <p className="mt-3 text-sm text-pop-night/85">
        <span className="font-display text-[10px] uppercase tracking-widest text-pop-night/55">
          What it looks like
        </span>
        <br />
        {note.example}
      </p>

      <p className="mt-3 text-sm text-pop-night/85">
        <span className="font-display text-[10px] uppercase tracking-widest text-pop-night/55">
          Try this at home
        </span>
        <br />
        {note.tryAtHome}
      </p>
    </div>
  );
}
