"use client";

import { useState } from "react";
import AnalysisResultCard from "@/components/AnalysisResultCard";
import LocalTime from "@/components/LocalTime";
import type { AnalysisResult, Worksheet } from "@/types/session";

/**
 * Choose what goes on the paper, then print it.
 *
 * The controls are print:hidden, so what you see below the line is exactly
 * what comes out. Defaults are what she asked for most: the lesson and the
 * worksheet. The answer key is opt-in and always starts a new page, because
 * handing a student the answers with the questions is the one mistake this
 * page can make on her behalf.
 */
type Part = "lesson" | "worksheet" | "key";

export default function PrintClient({
  result,
  worksheet,
  answerKey,
  learner,
  grade,
  isClass,
  subject,
  createdAt,
}: {
  result: AnalysisResult;
  worksheet: Worksheet;
  answerKey: { questionId: string; answer: string }[];
  learner: string;
  grade: string;
  isClass: boolean;
  subject: string;
  createdAt: string;
}) {
  const [parts, setParts] = useState<Record<Part, boolean>>({
    lesson: true,
    worksheet: true,
    key: false,
  });

  const toggle = (p: Part) => setParts((s) => ({ ...s, [p]: !s[p] }));
  const nothing = !parts.lesson && !parts.worksheet && !parts.key;
  const gradeName = grade === "K" ? "Kindergarten" : `Grade ${grade}`;
  const variants = result.worksheetVariants ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm print:hidden">
        <p className="font-display text-[11px] uppercase tracking-widest text-pop-magenta">
          Print or save as PDF
        </p>
        <h1 className="mt-1 font-display text-2xl text-pop-night">What goes on the paper?</h1>

        <div className="mt-4 space-y-2">
          <Check
            checked={parts.lesson}
            onChange={() => toggle("lesson")}
            label="The lesson"
            hint="All nine sections, including the materials to cut out."
          />
          <Check
            checked={parts.worksheet}
            onChange={() => toggle("worksheet")}
            label="The worksheet"
            hint={
              variants.length > 0
                ? `Whole group plus ${variants.length} level${variants.length === 1 ? "" : "s"}, with room to write.`
                : "With room to write on."
            }
          />
          <Check
            checked={parts.key}
            onChange={() => toggle("key")}
            label="The answer key"
            hint="Starts a new page, so you can keep it back."
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={nothing}
            onClick={() => window.print()}
            className="rounded-full border-[3px] border-pop-night bg-pop-pink px-5 py-2.5 font-display text-xs uppercase tracking-wide text-pop-night shadow-pop-sm transition-all hover:bg-pop-yellow disabled:opacity-50"
          >
            Print / Save as PDF
          </button>
          <p className="text-xs text-pop-night/60">
            In the print dialog, choose <b>Save as PDF</b> as the destination to
            get a file you can email.
          </p>
        </div>
      </div>

      {/* Everything below prints. */}
      <header className="mb-6 border-b-[3px] border-pop-night pb-3">
        <p className="font-display text-[11px] uppercase tracking-widest text-pop-night/60">
          AI Pocket Tutor · {subject}
        </p>
        <h2 className="mt-1 font-display text-2xl text-pop-night">
          {learner}
          {grade ? ` · ${gradeName}` : ""}
          {isClass ? " · Class" : ""}
        </h2>
        <p className="mt-0.5 text-xs text-pop-night/60">
          Planned <LocalTime iso={createdAt} />
        </p>
      </header>

      {parts.lesson && <AnalysisResultCard result={result} />}

      {parts.worksheet && (
        <section className={parts.lesson ? "mt-10 break-before-page" : ""}>
          <h2 className="mb-1 font-display text-2xl text-pop-night">{worksheet.title}</h2>
          <p className="mb-4 text-sm text-pop-night/60">
            {learner} · {gradeName}
          </p>
          <WriteOn worksheet={worksheet} />
          {variants.map((v) => (
            <div key={v.level} className="mt-8 break-before-page">
              <h3 className="mb-1 font-display text-xl text-pop-night">
                {v.worksheet.title}
              </h3>
              <p className="mb-4 text-sm text-pop-night/60">Level {v.level}</p>
              <WriteOn worksheet={v.worksheet} />
            </div>
          ))}
        </section>
      )}

      {parts.key && (
        <section className="mt-10 break-before-page">
          <h2 className="mb-4 font-display text-2xl text-pop-night">
            Answer key — keep this sheet
          </h2>
          <Key answers={answerKey} />
          {variants.map((v) => (
            <div key={v.level} className="mt-6">
              <h3 className="mb-2 font-display text-lg text-pop-night">Level {v.level}</h3>
              <Key answers={v.answerKey} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function Check({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl bg-pop-cream p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-5 w-5 shrink-0 accent-pop-magenta"
      />
      <span className="text-sm text-pop-night">
        <b>{label}</b>
        <span className="block text-pop-night/70">{hint}</span>
      </span>
    </label>
  );
}

/** Questions with a ruled space underneath, because it gets written on. */
function WriteOn({ worksheet }: { worksheet: Worksheet }) {
  return (
    <ol className="space-y-6">
      {worksheet.questions.map((q, i) => (
        <li key={q.id} className="break-inside-avoid">
          <p className="text-pop-night">
            <span className="font-display mr-2">{i + 1}.</span>
            {q.prompt}
          </p>
          <span className="mt-3 block border-b border-pop-night/40" />
          <span className="mt-5 block border-b border-pop-night/40" />
        </li>
      ))}
    </ol>
  );
}

function Key({ answers }: { answers: { questionId: string; answer: string }[] }) {
  return (
    <ul className="space-y-1 text-sm text-pop-night/85">
      {answers.map((a) => (
        <li key={a.questionId}>
          <span className="font-mono text-xs text-pop-night/60">{a.questionId}</span> ·{" "}
          {a.answer}
        </li>
      ))}
    </ul>
  );
}
