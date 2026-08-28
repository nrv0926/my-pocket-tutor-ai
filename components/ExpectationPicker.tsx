"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getExpectations,
  getPrograms,
  searchExpectations,
  type ContinuumHint,
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
  const [query, setQuery] = useState("");
  const [via, setVia] = useState<ContinuumHint[]>([]);
  const [filtered, setFiltered] = useState<ExpectationGroup[] | null>(null);
  const [searching, setSearching] = useState(false);

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
    setQuery("");
  }, [subject, grade, program]);

  // Clear a selection that the new subject or grade doesn't contain.
  useEffect(() => {
    if (!groups || !value) return;
    const has = groups.some((g) => g.options.some((o) => o.code === value));
    if (!has) onChange("", program);
  }, [groups, value, onChange, program]);

  // Typing beats scrolling a list of sixty. The search runs on the server so
  // it can also reach the Foundations Continuum, where a teacher's own
  // vocabulary actually lives.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setVia([]);
      setFiltered(null);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      let live = true;
      searchExpectations(subject, grade, program, q)
        .then((r) => {
          if (!live) return;
          setFiltered(r.groups);
          setVia(r.via);
        })
        .catch(() => live && setFiltered([]))
        .finally(() => live && setSearching(false));
      return () => {
        live = false;
      };
    }, 220);
    return () => clearTimeout(t);
  }, [query, subject, grade, program]);

  const total = groups?.reduce((n, g) => n + g.options.length, 0) ?? 0;
  const view = filtered ?? groups;
  const shown = view?.reduce((n, g) => n + g.options.length, 0) ?? 0;

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
          {emptyReason(subject, grade)} The plan still works without one.
        </p>
      ) : (
        <>
        {total > 12 && (
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code or wording — try “spelling”"
            aria-label="Filter expectations"
            className="mb-2 w-full rounded-xl border-[3px] border-pop-night bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-pop-pink/30"
          />
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value, program)}
          className="w-full rounded-xl border-[3px] border-pop-night bg-pop-cream px-3 py-2.5 outline-none focus:border-pop-night focus:bg-white focus:ring-4 focus:ring-pop-pink/30"
        >
          <option value="">No specific expectation</option>
          {(view ?? []).map((g) => (
            <optgroup key={g.strandCode} label={`${g.strandCode}. ${g.strandName}`}>
              {g.options.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.code} — {truncate(o.text)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        </>
      )}

      {via.length > 0 && (
        <p className="mt-2 rounded-xl border-[3px] border-pop-night bg-pop-cyan/30 px-3 py-2 text-xs text-pop-night">
          <span className="font-display uppercase tracking-widest text-pop-magenta">
            Matched through the foundations continuum
          </span>
          <br />
          Ontario does not use that word in its expectations, but it does in the
          continuum behind them —{" "}
          {via.map((v) => `${v.section} (${v.codes.join(", ")})`).join("; ")}.
        </p>
      )}

      {total > 0 && (
        <p className="mt-1 text-xs text-pop-night/60">
          {searching
            ? "Searching…"
            : query.trim() && shown === 0
              ? `Nothing matches “${query.trim()}” at Grade ${grade}. Clear the box to see all ${total}.`
              : query.trim()
                ? `${shown} of ${total} match “${query.trim()}”.`
                : `${total} expectations for Grade ${grade}, straight from the Ontario curriculum.`}
        </p>
      )}
    </label>
  );
}

/**
 * Why the list is empty, said plainly. Ontario publishes Kindergarten as its
 * own program document rather than as a grade inside each subject, and Core
 * and Extended French only start at Grade 4 — neither is a gap in our data,
 * and saying "not transcribed yet" for them would be wrong.
 */
function emptyReason(subject: SubjectId, grade: GradeId): string {
  if (grade === "K") {
    return "Ontario publishes Kindergarten as its own program, not as expectations inside each subject.";
  }
  if (subject === "french" && ["1", "2", "3"].includes(grade)) {
    return "This French program starts at Grade 4 — only Immersion runs earlier.";
  }
  return "Not transcribed for this subject yet.";
}

function truncate(s: string, max = 90): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}
