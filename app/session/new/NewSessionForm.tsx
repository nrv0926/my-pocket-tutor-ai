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
  {
    id: "parent",
    icon: "👨‍👩‍👧",
    title: "Parent",
    desc: "A 10–15 minute plan for tonight at home.",
  },
  {
    id: "homeschool",
    icon: "🏠",
    title: "Homeschool",
    desc: "A full Mon–Fri week, lesson by lesson.",
  },
  {
    id: "teacher",
    icon: "🍎",
    title: "Teacher",
    desc: "A 3–5 session intervention with three levels.",
  },
];

const INPUT_TYPES: { id: SessionInputType; title: string; desc: string; placeholder: string }[] = [
  {
    id: "paste",
    title: "Paste report card / teacher note",
    desc: "A sentence or two from the term report works.",
    placeholder: "e.g. Reads grade-level texts but is hesitant with multisyllabic words...",
  },
  {
    id: "description",
    title: "Describe what you're seeing",
    desc: "Tell us what's going on in plain English.",
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
      className="space-y-7"
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
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-ink-soft">Mode</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={[
                "rounded-2xl border p-4 text-left shadow-card transition",
                mode === m.id
                  ? "border-forest-500 bg-forest-50"
                  : "border-cream-300 bg-white hover:border-forest-500",
              ].join(" ")}
            >
              <span className="text-2xl" aria-hidden>{m.icon}</span>
              <p className="mt-2 font-serif text-base font-semibold text-forest-600">
                {m.title}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">{m.desc}</p>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Which child?</span>
          <select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2.5 outline-none focus:border-forest-500 focus:bg-white focus:ring-4 focus:ring-forest-500/15"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nickname} (Grade {c.grade})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Subject</span>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as Subject)}
            className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2.5 outline-none focus:border-forest-500 focus:bg-white focus:ring-4 focus:ring-forest-500/15"
          >
            <option value="reading">Reading</option>
            <option value="writing">Writing</option>
            <option value="language">Language</option>
            <option value="math">Math</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {INPUT_TYPES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setInputType(m.id)}
            aria-pressed={inputType === m.id}
            className={[
              "rounded-2xl border p-5 text-left shadow-card transition",
              inputType === m.id
                ? "border-forest-500 bg-forest-50"
                : "border-cream-300 bg-white hover:border-forest-500",
            ].join(" ")}
          >
            <p className="font-serif text-lg text-ink">{m.title}</p>
            <p className="mt-1 text-sm text-ink-soft">{m.desc}</p>
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-soft">
          {activeInput?.title}
        </span>
        <textarea
          rows={6}
          required
          minLength={5}
          maxLength={8000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={activeInput?.placeholder}
          className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2.5 outline-none focus:border-forest-500 focus:bg-white focus:ring-4 focus:ring-forest-500/15"
        />
        <p className="mt-1 text-xs text-ink-muted">
          Don&rsquo;t include the child&rsquo;s full name, school name, or any
          other identifying info.
        </p>
      </label>

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-forest-500 px-5 py-3 text-sm font-medium text-white shadow-glow hover:bg-forest-600 disabled:opacity-60"
        >
          {submitting ? "Analyzing..." : "Analyze"}
        </button>
        {submitting && <LoadingState label="Asking Claude for the plan..." />}
      </div>
    </form>
  );
}
