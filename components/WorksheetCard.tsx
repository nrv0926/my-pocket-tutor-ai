"use client";

import { useState } from "react";
import type { ParentFeedback } from "@/types/progress";
import type { Worksheet } from "@/types/session";

/**
 * Printable worksheet view with an answer-key toggle and the post-session
 * feedback step. Calls onFeedback with both the difficulty signal and
 * whether the child completed it independently.
 */
export default function WorksheetCard({
  worksheet,
  answerKey,
  onFeedback,
}: {
  worksheet: Worksheet;
  answerKey: { questionId: string; answer: string }[];
  onFeedback?: (data: {
    feedback: ParentFeedback;
    completedIndependently: boolean;
  }) => Promise<void> | void;
}) {
  const [showKey, setShowKey] = useState(false);
  const [feedback, setFeedback] = useState<ParentFeedback | null>(null);
  const [independent, setIndependent] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = feedback !== null && independent !== null && !submitted && !submitting;

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

      <ol className="space-y-4">
        {worksheet.questions.map((q, i) => {
          const a = answerKey.find((k) => k.questionId === q.id)?.answer;
          return (
            <li
              key={q.id}
              className="rounded-2xl border border-cream-300 bg-cream-50 p-4 print:rounded-none print:border-0 print:border-b print:bg-white print:p-0 print:pb-4"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest-500 font-serif text-base font-semibold text-white print:bg-white print:text-ink">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-base leading-relaxed text-ink sm:text-lg">
                  {q.prompt}
                </p>
              </div>
              {showKey && a && (
                <p className="ml-11 mt-2 rounded-lg bg-forest-50 px-3 py-2 text-sm text-forest-600">
                  Answer: <span className="font-medium">{a}</span>
                </p>
              )}
              {!showKey && (
                <div className="ml-11 mt-2 h-9 border-b-2 border-dashed border-cream-300 print:h-12" />
              )}
            </li>
          );
        })}
      </ol>

      <footer className="space-y-4 rounded-xl bg-cream-50 p-4 print:hidden">
        <div>
          <p className="mb-2 text-sm font-medium text-ink">
            Was this too easy, just right, or too hard?
          </p>
          <div className="flex flex-wrap gap-2">
            {([
              { val: "too_easy", label: "😴 Too easy" },
              { val: "just_right", label: "🙂 Just right" },
              { val: "too_hard", label: "😖 Too hard" },
            ] as { val: ParentFeedback; label: string }[]).map((f) => (
              <button
                key={f.val}
                disabled={submitted}
                onClick={() => setFeedback(f.val)}
                className={[
                  "rounded-full border px-4 py-2 text-sm transition",
                  feedback === f.val
                    ? "border-forest-500 bg-forest-50 font-medium text-forest-600"
                    : "border-cream-300 hover:border-forest-500",
                ].join(" ")}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">
            Did your child complete this independently?
          </p>
          <div className="flex flex-wrap gap-2">
            {([
              { val: true, label: "Yes, on their own" },
              { val: false, label: "No, with help" },
            ] as { val: boolean; label: string }[]).map((opt) => (
              <button
                key={String(opt.val)}
                disabled={submitted}
                onClick={() => setIndependent(opt.val)}
                className={[
                  "rounded-full border px-4 py-2 text-sm",
                  independent === opt.val
                    ? "border-forest-500 bg-forest-50 text-forest-600"
                    : "border-cream-300 hover:border-forest-500",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!canSubmit}
          onClick={async () => {
            if (!canSubmit || feedback === null || independent === null) return;
            setSubmitting(true);
            try {
              await onFeedback?.({
                feedback,
                completedIndependently: independent,
              });
              setSubmitted(true);
            } finally {
              setSubmitting(false);
            }
          }}
          className="rounded-full bg-forest-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-forest-600 disabled:opacity-50"
        >
          {submitted ? "Saved ✓" : submitting ? "Saving..." : "Save feedback"}
        </button>
      </footer>
    </div>
  );
}
