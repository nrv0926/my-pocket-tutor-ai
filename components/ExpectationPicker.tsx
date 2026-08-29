"use client";

import { useEffect, useMemo, useState } from "react";
import { GRADES } from "@/types/child";
import {
  getPrograms,
  getTopics,
  searchExpectations,
  type ContinuumHint,
  type ProgramOption,
  type Topic,
} from "@/lib/actions/curriculum";
import { emptyKind } from "@/lib/emptyReason";
import type { GradeId, Program, SubjectId } from "@/types/curriculum";

/**
 * Optional Ontario expectation selector — grade, then topic, then the item.
 *
 * Teachers plan against a named expectation, so letting her say "B2.1" up
 * front beats hoping the model infers it. Optional on purpose: a parent at
 * 9pm has no idea what B2.1 is, and the plan works without one.
 *
 * Three narrowing steps rather than one long list. Sixty specific
 * expectations in a single dropdown is complete and unusable at the same
 * time — you have to know the wording to find anything. Ontario already
 * groups them under objectives, so that is the middle step, and the grade is
 * choosable because the whole point of planning for the group that is behind
 * is reaching for a grade below the one on the register.
 *
 * Subjects with no transcription yet say so rather than showing an empty
 * dropdown — CLAUDE.md §6 forbids inventing expectations, so an honest
 * "not transcribed yet" is the correct empty state.
 */
export default function ExpectationPicker({
  subject,
  grade,
  onGradeChange,
  childGrade,
  value,
  onChange,
}: {
  subject: SubjectId;
  grade: GradeId;
  /** Omit to lock the picker to one grade; supply it to let her retarget. */
  onGradeChange?: (grade: GradeId) => void;
  /** The grade on the profile, so a deliberate step down can be named. */
  childGrade?: GradeId;
  value: string;
  onChange: (code: string, program?: Program["id"]) => void;
}) {
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [program, setProgram] = useState<Program["id"] | undefined>(undefined);
  const [topicCode, setTopicCode] = useState("");
  const [query, setQuery] = useState("");
  const [via, setVia] = useState<ContinuumHint[]>([]);
  const [matches, setMatches] = useState<Set<string> | null>(null);
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
    setTopics(null);
    getTopics(subject, grade, program)
      .then((t) => live && setTopics(t))
      .catch(() => live && setTopics([]));
    return () => {
      live = false;
    };
  }, [subject, grade, program]);

  // A code arriving from /curriculum's "Plan this" already names its topic.
  useEffect(() => {
    if (value) setTopicCode(value.split(".")[0]);
  }, [value]);

  // Clear a selection the new grade or subject doesn't contain.
  useEffect(() => {
    if (!topics || !value) return;
    const has = topics.some((t) => t.items.some((i) => i.code === value));
    if (!has) onChange("", program);
  }, [topics, value, onChange, program]);

  // Typing beats narrowing when she already knows the word. The search runs
  // on the server so it can also reach the Foundations Continuum, where a
  // teacher's own vocabulary actually lives.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setVia([]);
      setMatches(null);
      return;
    }
    setSearching(true);
    let live = true;
    const t = setTimeout(() => {
      searchExpectations(subject, grade, program, q)
        .then((r) => {
          if (!live) return;
          setMatches(new Set(r.groups.flatMap((g) => g.options.map((o) => o.code))));
          setVia(r.via);
        })
        .catch(() => live && setMatches(new Set()))
        .finally(() => live && setSearching(false));
    }, 220);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [query, subject, grade, program]);

  const total = topics?.reduce((n, t) => n + t.items.length, 0) ?? 0;

  // Searching spans every topic; otherwise the chosen topic is the filter.
  const shownTopics = useMemo(() => {
    if (!topics) return [];
    const scoped = matches
      ? topics
          .map((t) => ({ ...t, items: t.items.filter((i) => matches.has(i.code)) }))
          .filter((t) => t.items.length > 0)
      : topicCode
        ? topics.filter((t) => t.code === topicCode)
        : topics;
    return scoped;
  }, [topics, matches, topicCode]);

  const shown = shownTopics.reduce((n, t) => n + t.items.length, 0);
  const chosen = topics?.find((t) => t.code === topicCode) ?? null;
  const steppedDown = childGrade && childGrade !== grade;

  return (
    <div className="rounded-2xl border-[3px] border-pop-night bg-white p-4">
      <p className="font-display text-sm uppercase tracking-widest text-pop-night">
        What are you teaching? <span className="text-pop-night/50">(optional)</span>
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-pop-night/80">Grade</span>
          <select
            value={grade}
            disabled={!onGradeChange}
            onChange={(e) => {
              setTopicCode("");
              setQuery("");
              onGradeChange?.(e.target.value as GradeId);
            }}
            className="w-full rounded-xl border-[3px] border-pop-night bg-pop-cream px-3 py-2.5 outline-none focus:border-pop-night focus:bg-white focus:ring-4 focus:ring-pop-pink/30 disabled:opacity-60"
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g === "K" ? "Kindergarten" : `Grade ${g}`}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-pop-night/80">Topic</span>
          <select
            value={topicCode}
            onChange={(e) => {
              setTopicCode(e.target.value);
              setQuery("");
              onChange("", program);
            }}
            disabled={!topics || topics.length === 0}
            className="w-full rounded-xl border-[3px] border-pop-night bg-pop-cream px-3 py-2.5 outline-none focus:border-pop-night focus:bg-white focus:ring-4 focus:ring-pop-pink/30 disabled:opacity-60"
          >
            <option value="">All topics</option>
            {(topics ?? []).map((t) => (
              <option key={t.code} value={t.code}>
                {t.code} — {truncate(t.label, 60)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {programs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {programs.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProgram(p.id);
                setTopicCode("");
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

      {steppedDown && (
        <p className="mt-3 rounded-xl border-[3px] border-pop-night bg-pop-yellow/40 px-3 py-2 text-xs text-pop-night">
          Planning at {gradeName(grade)} for a {gradeName(childGrade)} profile. The
          plan will say so, so nobody reading it later thinks it was a mistake.
        </p>
      )}

      {topics === null ? (
        <div className="mt-3 h-[46px] animate-pulse rounded-xl border-[3px] border-pop-night bg-pop-cream" />
      ) : total === 0 ? (
        <p className="mt-3 rounded-xl border-[3px] border-dashed border-pop-night/40 bg-pop-cream px-3 py-2.5 text-sm text-pop-night/70">
          {emptyReason(subject, grade)} The plan still works without one.
        </p>
      ) : (
        <>
          {chosen && chosen.text && (
            <p className="mt-3 rounded-xl bg-pop-cream px-3 py-2 text-xs text-pop-night/75">
              <b>{chosen.code}</b> — {chosen.text}
            </p>
          )}

          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-medium text-pop-night/80">
              Or search all {total} by wording
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try &ldquo;syllable&rdquo;, &ldquo;spelling&rdquo;, or a code"
              className="w-full rounded-xl border-[3px] border-pop-night bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-pop-pink/30"
            />
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-medium text-pop-night/80">
              What they&apos;ll work on
            </span>
            <select
              value={value}
              onChange={(e) => onChange(e.target.value, program)}
              className="w-full rounded-xl border-[3px] border-pop-night bg-pop-cream px-3 py-2.5 outline-none focus:border-pop-night focus:bg-white focus:ring-4 focus:ring-pop-pink/30"
            >
              <option value="">No specific expectation</option>
              {shownTopics.map((t) => (
                <optgroup key={t.code} label={`${t.code}. ${truncate(t.label, 60)}`}>
                  {t.items.map((i) => (
                    <option key={i.code} value={i.code}>
                      {i.code} — {truncate(i.text)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
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
              ? `Nothing matches “${query.trim()}” at ${gradeName(grade)}. Clear the box to see all ${total}.`
              : query.trim()
                ? `${shown} of ${total} match “${query.trim()}”.`
                : topicCode
                  ? `${shown} to choose from in this topic.`
                  : `${total} expectations for ${gradeName(grade)}, straight from the Ontario curriculum.`}
        </p>
      )}
    </div>
  );
}

function gradeName(g: GradeId): string {
  return g === "K" ? "Kindergarten" : `Grade ${g}`;
}

/** Why the list is empty, said plainly and in the room a picker has. */
function emptyReason(subject: SubjectId, grade: GradeId): string {
  switch (emptyKind(subject, grade)) {
    case "kindergarten":
      return "Ontario publishes Kindergarten as its own program, not as expectations inside each subject.";
    case "fsl-starts-later":
      return "This French program starts at Grade 4 — only Immersion runs earlier.";
    default:
      return "Not transcribed for this subject yet.";
  }
}

function truncate(s: string, max = 90): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}
