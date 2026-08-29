"use client";

import { useEffect, useState } from "react";
import LoadingState from "@/components/LoadingState";
import ExpectationPicker from "@/components/ExpectationPicker";
import AchievementLevelPicker from "@/components/AchievementLevelPicker";
import LevelSpreadPicker, { type LevelSpread } from "@/components/LevelSpreadPicker";
import { createLearningSession } from "@/lib/actions/sessions";
import { SUBJECTS } from "@/types/child";
import type { AchievementLevel, Grade, Subject } from "@/types/child";
import type { GradeId, Program, SubjectId } from "@/types/curriculum";
import type { SessionInputType } from "@/types/session";

/** Server actions throw this internal signal when they call redirect(). */
function isRedirectSignal(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

type ChildOption = { id: string; nickname: string; grade: string; kind?: "student" | "class" };

const MODES: { id: SessionInputType; title: string; desc: string; placeholder: string }[] = [
  {
    id: "paste",
    title: "Paste report card comments",
    desc: "A sentence or two from the term report works.",
    placeholder: "e.g. Reads grade-level texts but is hesitant with multisyllabic words...",
  },
  {
    id: "description",
    title: "Describe a homework struggle",
    desc: "Tell us what's going on in plain English.",
    placeholder: "e.g. He freezes when subtraction has borrowing.",
  },
];

export default function NewSessionForm({
  childProfiles,
  showLevel = false,
  initialSubject,
  initialExpectation,
  initialProgram,
}: {
  childProfiles: ChildOption[];
  /** Teachers and homeschoolers place a learner on the chart; parents do not. */
  showLevel?: boolean;
  /** Preselection carried over from /curriculum, so "Plan this" arrives ready. */
  initialSubject?: string;
  initialExpectation?: string;
  initialProgram?: string;
}) {
  const [childId, setChildId] = useState(childProfiles[0]?.id ?? "");
  const [mode, setMode] = useState<SessionInputType>("paste");
  const [subject, setSubject] = useState<Subject>(
    SUBJECTS.includes(initialSubject as Subject) ? (initialSubject as Subject) : "language"
  );
  const [expectation, setExpectation] = useState(initialExpectation ?? "");
  const [expectationProgram, setExpectationProgram] = useState<Program["id"] | null>(
    (initialProgram as Program["id"]) ?? null
  );
  const [planGrade, setPlanGrade] = useState<GradeId | null>(null);
  const [level, setLevel] = useState<AchievementLevel | null>(null);
  const [spread, setSpread] = useState<LevelSpread>({});
  const [perLevel, setPerLevel] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = childProfiles.find((c) => c.id === childId);
  const isClass = selected?.kind === "class";
  const selectedGrade = selected?.grade as GradeId | undefined;

  // Planning follows the profile until she says otherwise, and follows it
  // again the moment she picks a different profile — a Grade 1 target left
  // over from the last student would be silently wrong for the next one.
  useEffect(() => {
    setPlanGrade(null);
  }, [childId]);

  const grade = planGrade ?? selectedGrade;

  // Levels the room actually contains, in Ontario's order. Two or more of
  // them is what makes a separate worksheet each worth generating.
  const levelsInRoom = (["1", "2", "3", "4"] as AchievementLevel[]).filter(
    (l) => (spread[l] ?? 0) > 0
  );
  const canSplit = isClass && levelsInRoom.length > 1;

  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!childId) return setError("Choose a child first.");
        if (text.trim().length < 5) return setError("Tell us a little more so we can help.");
        setSubmitting(true);
        setError(null);
        try {
          await createLearningSession({
            childId,
            inputType: mode,
            subject,
            expectationCode: expectation || null,
            expectationProgram: expectation ? expectationProgram : null,
            planGrade: grade && grade !== selectedGrade ? grade : null,
            achievementLevel: isClass ? null : level,
            achievementSpread: isClass && Object.keys(spread).length ? spread : null,
            worksheetLevels: canSplit && perLevel ? levelsInRoom : [],
            text: text.trim(),
          });
          // createLearningSession redirects to /results/[id] internally.
        } catch (err) {
          if (isRedirectSignal(err)) throw err;
          setError(err instanceof Error ? err.message : "Could not create session.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-pop-night/80">Which child?</span>
          <select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            className="w-full rounded-xl border-[3px] border-pop-night bg-pop-cream px-3 py-2.5 outline-none focus:border-pop-night focus:bg-white focus:ring-4 focus:ring-forest-500/15"
          >
            {childProfiles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nickname} (Grade {c.grade})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-pop-night/80">Subject</span>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as Subject)}
            className="w-full rounded-xl border-[3px] border-pop-night bg-pop-cream px-3 py-2.5 outline-none focus:border-pop-night focus:bg-white focus:ring-4 focus:ring-forest-500/15"
          >
            <option value="language">Language</option>
            <option value="mathematics">Mathematics</option>
            <option value="science-technology">Science and Technology</option>
            <option value="french">French</option>
          </select>
        </label>
      </div>

      {showLevel &&
        (isClass ? (
          <>
            <LevelSpreadPicker value={spread} onChange={setSpread} />
            {canSplit && (
              <label className="flex items-start gap-3 rounded-2xl border-[3px] border-pop-night bg-pop-cyan/25 p-4">
                <input
                  type="checkbox"
                  checked={perLevel}
                  onChange={(e) => setPerLevel(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-pop-magenta"
                />
                <span className="text-sm text-pop-night">
                  <b>A worksheet for each level in the room.</b> One lesson,{" "}
                  {levelsInRoom.length} worksheets — same skill, sized to each
                  group. Takes a little longer to write.
                </span>
              </label>
            )}
          </>
        ) : (
          <AchievementLevelPicker value={level} onChange={setLevel} />
        ))}

      {grade && (
        <ExpectationPicker
          subject={subject as SubjectId}
          grade={grade}
          onGradeChange={setPlanGrade}
          childGrade={selectedGrade}
          value={expectation}
          onChange={(code, program) => {
            setExpectation(code);
            setExpectationProgram(program ?? null);
          }}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={[
              "rounded-2xl border p-5 text-left shadow-pop-sm transition",
              mode === m.id
                ? "border-pop-night bg-pop-cyan"
                : "border-pop-night bg-white hover:border-pop-night",
            ].join(" ")}
          >
            <p className="font-display text-lg text-pop-night">{m.title}</p>
            <p className="mt-1 text-sm text-pop-night/80">{m.desc}</p>
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-pop-night/80">
          {MODES.find((m) => m.id === mode)?.title}
        </span>
        <textarea
          rows={6}
          required
          minLength={5}
          maxLength={8000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={MODES.find((m) => m.id === mode)?.placeholder}
          className="w-full rounded-xl border-[3px] border-pop-night bg-pop-cream px-3 py-2.5 outline-none focus:border-pop-night focus:bg-white focus:ring-4 focus:ring-forest-500/15"
        />
        <p className="mt-1 text-xs text-pop-night/60">
          Don&apos;t include your child&apos;s full name, school name, or any other identifying info.
        </p>
      </label>

      {error && (
        <div className="rounded-xl border border-pop-night bg-pop-tangerine p-3 text-sm text-pop-night">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-pop-pink px-5 py-3 text-sm font-semibold text-pop-night shadow hover:bg-pop-yellow disabled:opacity-60"
        >
          {submitting ? "Analyzing..." : "Analyze"}
        </button>
        {submitting && <LoadingState label="Asking Claude for the plan..." />}
      </div>
    </form>
  );
}
