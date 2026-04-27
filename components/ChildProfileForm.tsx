"use client";

import { useState } from "react";
import type { ChildInput, Grade, LearningNeed } from "@/types/child";

const GRADES: Grade[] = ["K", "1", "2", "3", "4", "5", "6"];
const NEEDS: { id: LearningNeed; label: string }[] = [
  { id: "adhd", label: "ADHD" },
  { id: "dyslexia", label: "Dyslexia" },
  { id: "anxiety", label: "Anxiety" },
  { id: "esl", label: "English as a second language" },
  { id: "other", label: "Other" },
];

export default function ChildProfileForm({
  onSubmit,
}: {
  onSubmit?: (data: ChildInput) => Promise<void> | void;
}) {
  const [needs, setNeeds] = useState<LearningNeed[]>([]);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="space-y-6 rounded-2xl border border-cream-300 bg-white p-6 shadow-card"
      onSubmit={async (event) => {
        event.preventDefault();
        const f = new FormData(event.currentTarget);
        setSubmitting(true);
        const payload: ChildInput = {
          nickname: String(f.get("nickname") || "").trim(),
          age: f.get("age") ? Number(f.get("age")) : null,
          grade: (f.get("grade") as Grade) || "K",
          location: String(f.get("location") || "ON-CA"),
          curriculum: "ontario",
          learningNeeds: needs,
          mainConcern: nullable(f.get("mainConcern")),
          strengths: nullable(f.get("strengths")),
          weaknesses: nullable(f.get("weaknesses")),
          parentGoal: nullable(f.get("parentGoal")),
        };
        try {
          await onSubmit?.(payload);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <Field label="Child nickname (not their full name)">
        <input
          name="nickname"
          required
          maxLength={40}
          placeholder="e.g. Bean, R., Lulu"
          className={inputCls}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Age">
          <input
            name="age"
            type="number"
            min={4}
            max={14}
            placeholder="7"
            className={inputCls}
          />
        </Field>
        <Field label="Grade">
          <select name="grade" required defaultValue="" className={inputCls}>
            <option value="" disabled>
              Choose
            </option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g === "K" ? "Kindergarten" : `Grade ${g}`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Location">
          <select name="location" defaultValue="ON-CA" className={inputCls}>
            <option value="ON-CA">Ontario, Canada</option>
            <option value="other">Other (we'll default to Ontario)</option>
          </select>
        </Field>
      </div>

      <Field label="Main concern (one sentence)">
        <textarea
          name="mainConcern"
          rows={2}
          placeholder="e.g. Reading aloud is slow and frustrating."
          className={inputCls}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Strengths">
          <textarea
            name="strengths"
            rows={3}
            placeholder="e.g. Loves stories, great memory."
            className={inputCls}
          />
        </Field>
        <Field label="Weaknesses">
          <textarea
            name="weaknesses"
            rows={3}
            placeholder="e.g. Struggles to sound out new words."
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Learning needs (optional — used to adapt the plan)">
        <div className="flex flex-wrap gap-2">
          {NEEDS.map((n) => {
            const active = needs.includes(n.id);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() =>
                  setNeeds((prev) =>
                    prev.includes(n.id) ? prev.filter((p) => p !== n.id) : [...prev, n.id]
                  )
                }
                className={[
                  "rounded-full border px-3 py-1.5 text-sm",
                  active
                    ? "border-forest-500 bg-forest-50 text-forest-600"
                    : "border-cream-300 text-ink-soft hover:border-forest-500",
                ].join(" ")}
              >
                {n.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          We use these to soften the plan. We never diagnose.
        </p>
      </Field>

      <Field label="What's your goal for this child right now?">
        <textarea
          name="parentGoal"
          rows={2}
          placeholder="e.g. Feel confident reading a chapter book by summer."
          className={inputCls}
        />
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-forest-500 px-6 py-3 font-semibold text-white shadow hover:bg-forest-600 disabled:opacity-60"
      >
        {submitting ? "Creating profile..." : "Create child profile"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

function nullable(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

const inputCls =
  "w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2.5 text-ink outline-none transition focus:border-forest-500 focus:bg-white focus:ring-4 focus:ring-forest-500/15";
