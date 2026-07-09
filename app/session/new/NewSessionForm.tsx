"use client";

import { useState } from "react";
import LoadingState from "@/components/LoadingState";
import { createLearningSession } from "@/lib/actions/sessions";
import type { Subject } from "@/types/child";
import type { Mode, SessionInputType } from "@/types/session";

function isRedirectSignal(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

type ChildOption = { id: string; nickname: string; grade: string };

const MODES: { id: Mode; icon: string; title: string; desc: string }[] = [
  { id: "parent", icon: "👨‍👩‍👧", title: "Parent", desc: "10–15 min plan for tonight" },
  { id: "homeschool", icon: "🏠", title: "Homeschool", desc: "Full Mon–Fri week" },
  { id: "teacher", icon: "🍎", title: "Teacher", desc: "3–5 session intervention" },
];

const SUBJECTS: { id: Subject; icon: string; label: string }[] = [
  { id: "reading", icon: "📖", label: "Reading" },
  { id: "writing", icon: "✏️", label: "Writing" },
  { id: "language", icon: "💬", label: "Language" },
  { id: "math", icon: "🔢", label: "Math" },
];

const INPUT_TYPES: { id: SessionInputType; title: string; placeholder: string }[] = [
  {
    id: "paste",
    title: "Paste a report card or teacher note",
    placeholder: "e.g. Reads grade-level texts but is hesitant with multisyllabic words...",
  },
  {
    id: "description",
    title: "Describe what you're seeing",
    placeholder: "e.g. He freezes when subtraction has borrowing.",
  },
];

export default function NewSessionForm({
  children,
  initialMode,
}: {
  children: ChildOption[];
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode ?? "parent");
  const [childId, setChildId] = useState(children[0]?.id ?? "");
  const [inputType, setInputType] = useState<SessionInputType>("paste");
  const [subject, setSubject] = useState<Subject>("reading");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeInput = INPUT_TYPES.find((m) => m.id === inputType);

  return (
    <form
      className="space-y-8"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!childId) return setError("Choose a child first.");
        if (text.trim().length < 5) return setError("Tell us a little more so we can help.");
        setSubmitting(true);
        setError(null);
        try {
          await createLearningSession({
            childId,
            mode,
            inputType,
            subject,
            text: text.trim(),
          });
        } catch (err) {
          if (isRedirectSignal(err)) throw err;
          setError(err instanceof Error ? err.message : "Could not create session.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <Step n={1} label="I am a…">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={[
                "rounded-2xl border p-3 text-center transition sm:p-4",
                mode === m.id
                  ? "border-forest-500 bg-forest-50 shadow-glow"
                  : "border-cream-300 bg-white hover:border-forest-400",
              ].join(" ")}
            >
              <span className="text-2xl" aria-hidden>{m.icon}</span>
              <p className="mt-1.5 font-serif text-sm font-semibold text-forest-600 sm:text-base">
                {m.title}
              </p>
              <p className="mt-0.5 hidden text-[11px] text-ink-muted sm:block">{m.desc}</p>
            </button>
          ))}
        </div>
      </Step>

      <Step n={2} label="Who and what">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            aria-label="Which child"
            className="rounded-xl border border-cream-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-500/15"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nickname} · Grade {c.grade}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Subject">
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSubject(s.id)}
                aria-pressed={subject === s.id}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition",
                  subject === s.id
                    ? "border-forest-500 bg-forest-50 font-medium text-forest-600"
                    : "border-cream-300 bg-white text-ink-soft hover:border-forest-400",
                ].join(" ")}
              >
                <span aria-hidden>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Step>

      <Step n={3} label="What's going on?">
        <div
          className="mb-3 inline-flex rounded-full border border-cream-300 bg-white p-1"
          role="tablist"
        >
          {INPUT_TYPES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={inputType === m.id}
              onClick={() => setInputType(m.id)}
              className={[
                "rounded-full px-4 py-1.5 text-[13px] transition",
                inputType === m.id
                  ? "bg-forest-500 font-medium text-white"
                  : "text-ink-soft hover:text-forest-600",
              ].join(" ")}
            >
              {m.title}
            </button>
          ))}
        </div>
        <textarea
          rows={5}
          required
          minLength={5}
          maxLength={8000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={activeInput?.placeholder}
          className="w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-ink-muted/60 focus:border-forest-500 focus:ring-4 focus:ring-forest-500/15"
        />
        <p className="mt-1.5 text-xs text-ink-muted">
          🔒 No full names, school names, or other identifying info, please.
        </p>
      </Step>

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-forest-500 px-7 py-3.5 text-[15px] font-medium text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-forest-600 disabled:opacity-60"
        >
          {submitting ? "Creating your plan…" : "Get my plan →"}
        </button>
        {submitting && <LoadingState label="One moment..." />}
      </div>
    </form>
  );
}

function Step({
  n,
  label,
  children,
}: {
  n: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-3 flex items-center gap-2.5">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-forest-500 text-xs font-semibold text-white">
          {n}
        </span>
        <span className="text-sm font-medium text-ink">{label}</span>
      </legend>
      {children}
    </fieldset>
  );
}
