"use client";

import { useState } from "react";
import type { ChildInput, Grade, LearningNeed, Role } from "@/types/child";
import { GRADES } from "@/types/child";
import type { LearnerKind } from "@/types/child";
import { learnerCopy } from "@/lib/roleCopy";


const NEEDS: { id: LearningNeed; label: string }[] = [
  { id: "adhd", label: "ADHD" },
  { id: "dyslexia", label: "Dyslexia" },
  { id: "anxiety", label: "Anxiety" },
  { id: "esl", label: "English as a second language" },
  { id: "other", label: "Other" },
];

export default function ChildProfileForm({
  onSubmit,
  role = null,
  allowClass = false,
}: {
  onSubmit?: (data: ChildInput) => Promise<void> | void;
  role?: Role | null;
  /** Teachers can plan for a class; everyone else profiles one learner. */
  allowClass?: boolean;
}) {
  const [needs, setNeeds] = useState<LearningNeed[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [kind, setKind] = useState<LearnerKind>("student");
  const copy = learnerCopy(role, kind);

  return (
    <form
      className="space-y-6 rounded-2xl border-[3px] border-pop-night bg-white p-6 shadow-pop-sm"
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
          kind,
          parentGoal: nullable(f.get("parentGoal")),
        };
        try {
          await onSubmit?.(payload);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {allowClass && (
        <div className="flex gap-2 rounded-xl border-[3px] border-pop-night bg-pop-cream p-2">
          {(["student", "class"] as LearnerKind[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className={`flex-1 rounded-lg border-[3px] border-pop-night px-3 py-2 font-display text-xs uppercase tracking-wide ${
                kind === k ? "bg-pop-night text-pop-cream" : "bg-white text-pop-night hover:bg-pop-yellow"
              }`}
            >
              {k === "student" ? "One student" : "A whole class"}
            </button>
          ))}
        </div>
      )}

      <Field label={copy.nicknameLabel}>
        <input
          name="nickname"
          required
          maxLength={40}
          placeholder={copy.nicknamePlaceholder}
          className={inputCls}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-3">
        {kind === "student" && (
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
        )}
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
            <option value="other">Other (we&apos;ll default to Ontario)</option>
          </select>
        </Field>
      </div>

      <Field label={copy.concernLabel}>
        <textarea
          name="mainConcern"
          rows={2}
          placeholder={copy.concernPlaceholder}
          className={inputCls}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={copy.strengthsLabel}>
          <textarea
            name="strengths"
            rows={3}
            placeholder={copy.strengthsPlaceholder}
            className={inputCls}
          />
        </Field>
        <Field label={copy.weaknessesLabel}>
          <textarea
            name="weaknesses"
            rows={3}
            placeholder={copy.weaknessesPlaceholder}
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
                    ? "border-pop-night bg-pop-cyan text-pop-magenta"
                    : "border-pop-night text-pop-night/80 hover:border-pop-night",
                ].join(" ")}
              >
                {n.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-pop-night/60">
          We use these to soften the plan. We never diagnose.
        </p>
      </Field>

      <Field label={copy.goalLabel}>
        <textarea
          name="parentGoal"
          rows={2}
          placeholder={copy.goalPlaceholder}
          className={inputCls}
        />
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-pop-pink px-6 py-3 font-semibold text-pop-night shadow hover:bg-pop-yellow disabled:opacity-60"
      >
        {submitting ? copy.submittingLabel : copy.submitLabel}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-pop-night/80">{label}</span>
      {children}
    </label>
  );
}

function nullable(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

const inputCls =
  "w-full rounded-xl border-[3px] border-pop-night bg-pop-cream px-3 py-2.5 text-pop-night outline-none transition focus:border-pop-night focus:bg-white focus:ring-4 focus:ring-forest-500/15";
