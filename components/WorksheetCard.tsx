"use client";

import { useState } from "react";
import type { ParentFeedback } from "@/types/progress";
import type { Worksheet } from "@/types/session";

/**
 * Printable worksheet view with an answer-key toggle and the post-session
 * "too easy / just right / too hard" feedback step. Calls the optional
 * onFeedback so the dashboard can update progress.
 */
export default function WorksheetCard({
  worksheet,
  answerKey,
  onFeedback,
}: {
  worksheet: Worksheet;
  answerKey: { questionId: string; answer: string }[];
  onFeedback?: (f: ParentFeedback) => Promise<void> | void;
}) {
  const [showKey, setShowKey] = useState(false);
  const [submitted, setSubmitted] = useState<ParentFeedback | null>(null);

  return (
    <div className="space-y-6 rounded-2xl border border-cream-300 bg-white p-6 shadow-card print:border-0 print:p-0 print:shadow-none">
      <header className="flex items-start justify-between gap-4 print:block">
        <div>
          <h1 className="font-serif text-2xl text-ink">{worksheet.title}</h1>
          <p className="mt-1 text-sm text-ink-muted capitalize">
            Difficulty: {worksheet.difficulty} · {worksheet.questions.length} questions
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={() => setShowKey((v) => !v)}
            className="rounded-full border border-cream-300 px-4 py-2 text-sm hover:bg-cream-50"
          >
            {showKey ? "Hide answers" : "Show answers"}
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-full bg-forest-500 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-600"
          >
            Print
          </button>
        </div>
      </header>

      <ol className="ml-5 list-decimal space-y-3 text-ink">
        {worksheet.questions.map((q) => {
          const a = answerKey.find((k) => k.questionId === q.id)?.answer;
          return (
            <li key={q.id} className="leading-relaxed">
              <p>{q.prompt}</p>
              {showKey && a && (
                <p className="mt-1 rounded-lg bg-forest-50 px-3 py-2 text-sm text-forest-600">
                  Answer: <span className="font-medium">{a}</span>
                </p>
              )}
              {!showKey && (
                <div className="mt-1 h-8 border-b border-dashed border-cream-300 print:h-12" />
              )}
            </li>
          );
        })}
      </ol>

      <footer className="rounded-xl bg-cream-50 p-4 print:hidden">
        <p className="mb-2 text-sm font-medium text-ink">
          Was this too easy, just right, or too hard?
        </p>
        <div className="flex flex-wrap gap-2">
          {(["too_easy", "just_right", "too_hard"] as ParentFeedback[]).map((f) => (
            <button
              key={f}
              disabled={Boolean(submitted)}
              onClick={async () => {
                setSubmitted(f);
                await onFeedback?.(f);
              }}
              className={[
                "rounded-full border px-4 py-2 text-sm",
                submitted === f
                  ? "border-forest-500 bg-forest-50 text-forest-600"
                  : "border-cream-300 hover:border-forest-500",
              ].join(" ")}
            >
              {f.replaceAll("_", " ")}
            </button>
          ))}
        </div>
        {submitted && (
          <p className="mt-2 text-xs text-ink-muted">
            Thanks — we'll use this to pick the next session's difficulty.
          </p>
        )}
      </footer>
    </div>
  );
}
