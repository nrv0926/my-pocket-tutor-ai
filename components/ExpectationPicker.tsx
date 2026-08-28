"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [query, setQuery] = useState("");

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

  // Typing beats scrolling a list of sixty. Matches code or wording, so
  // "B2.1", "syllable" and "vowel" all find the same kind of thing.
  const filtered = useMemo(() => {
    if (!groups) return null;
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        options: g.options.filter(
          (o) => o.code.toLowerCase().includes(q) || o.text.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.options.length > 0);
  }, [groups, query]);

  const total = groups?.reduce((n, g) => n + g.options.length, 0) ?? 0;
  const shown = filtered?.reduce((n, g) => n + g.options.length, 0) ?? 0;

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
          {(filtered ?? []).map((g) => (
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

      {total > 0 && (
        <p className="mt-1 text-xs text-pop-night/60">
          {query.trim() && shown === 0
            ? `Nothing matches “${query.trim()}”. Ontario words its expectations broadly — a classroom term like “syllable” may not appear even where the skill does. Clear the box to see all ${total}.`
            : query.trim() && shown !== total
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
