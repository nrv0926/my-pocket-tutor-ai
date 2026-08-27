"use client";

import { useEffect, useState } from "react";
import {
  getExpectations,
  getPrograms,
  type ExpectationGroup,
  type ProgramOption,
} from "@/lib/actions/curriculum";
import type { GradeId, Program, SubjectId } from "@/types/curriculum";

/**
 * Optional Ontario expectation selector.
 *
 * Teachers plan against a named expectation, so letting them say "B2.1" up
 * front beats hoping the model infers it. Optional on purpose: a parent at
 * 9pm has no idea what B2.1 is, and the plan works without one.
 *
 * Subjects with no transcription yet say so rather than showing an empty
 * dropdown — CLAUDE.md §6 forbids inventing expectations, so an honest
 * "not loaded yet" is the correct empty state.
 */
export default function ExpectationPicker({
  subject,
  grade,
  value,
  onChange,
}: {
  subject: SubjectId;
  grade: GradeId;
  value: string;
  onChange: (code: string, program?: Program["id"]) => void;
}) {
  const [groups, setGroups] = useState<ExpectationGroup[] | null>(null);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [program, setProgram] = useState<Program["id"] | undefined>(undefined);

  // FSL is the only subject that asks which program you teach.
  useEffect(() => {
    let live = true;
    getPrograms(subject)
      .then((p) => {
        if (!live) return;
        setPrograms(p);
        setProgram(p.length ? p[p.length - 1].id : undefined);
      })
      .catch(() => live && setPrograms([]));
    return () => {
      live = false;
    };
  }, [subject]);

  useEffect(() => {
    let live = true;
    setGroups(null);
    getExpectations(subject, grade, program)
      .then((g) => {
        if (live) setGroups(g);
      })
      .catch(() => {
        if (live) setGroups([]);
      });
    return () => {
      live = false;
    };
  }, [subject, grade, program]);

  // Clear a selection that the new subject or grade doesn't contain.
  useEffect(() => {
    if (!groups || !value) return;
    const has = groups.some((g) => g.options.some((o) => o.code === value));
    if (!has) onChange("", program);
  }, [groups, value, onChange, program]);

  const total = groups?.reduce((n, g) => n + g.options.length, 0) ?? 0;

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-pop-night/80">
        Ontario expectation <span className="text-pop-night/50">(optional)</span>
      </span>

      {programs.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {programs.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProgram(p.id);
                onChange("", p.id);
              }}
              className={`rounded-full border-[3px] border-pop-night px-3 py-1 font-display text-[11px] uppercase tracking-wide ${
                program === p.id ? "bg-pop-night text-pop-cream" : "bg-white text-pop-night"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {groups === null ? (
        <div className="h-[46px] animate-pulse rounded-xl border-[3px] border-pop-night bg-pop-cream" />
      ) : total === 0 ? (
        <p className="rounded-xl border-[3px] border-dashed border-pop-night/40 bg-pop-cream px-3 py-2.5 text-sm text-pop-night/70">
          Not transcribed for this subject yet — the plan still works without one.
        </p>
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value, program)}
          className="w-full rounded-xl border-[3px] border-pop-night bg-pop-cream px-3 py-2.5 outline-none focus:border-pop-night focus:bg-white focus:ring-4 focus:ring-pop-pink/30"
        >
          <option value="">No specific expectation</option>
          {groups.map((g) => (
            <optgroup key={g.strandCode} label={`${g.strandCode}. ${g.strandName}`}>
              {g.options.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.code} — {truncate(o.text)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      )}

      {total > 0 && (
        <p className="mt-1 text-xs text-pop-night/60">
          {total} expectations for Grade {grade}, straight from the Ontario curriculum.
        </p>
      )}
    </label>
  );
}

function truncate(s: string, max = 90): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}
