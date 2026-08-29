"use client";

import AnalysisResultCard from "@/components/AnalysisResultCard";
import WorksheetCard from "@/components/WorksheetCard";
import ProgressTracker from "@/components/ProgressTracker";
import ChildProfileForm from "@/components/ChildProfileForm";
import LoadingState from "@/components/LoadingState";
import UploadBox from "@/components/UploadBox";
import { useState } from "react";
import ExpectationPicker from "@/components/ExpectationPicker";
import AchievementLevelPicker from "@/components/AchievementLevelPicker";
import LevelSpreadPicker, { type LevelSpread } from "@/components/LevelSpreadPicker";
import SessionModePicker, { sessionMode } from "@/components/SessionModePicker";
import ContinueCard from "@/components/ContinueCard";
import WeeklyPlanCard from "@/components/WeeklyPlanCard";
import type { WeeklyPlan } from "@/types/plan";
import type { Continuity } from "@/lib/continuity";
import type { SessionInputType } from "@/types/session";
import type { GradeId, SubjectId } from "@/types/curriculum";
import type { AchievementLevel } from "@/types/child";
import { SAMPLE_ANALYSIS } from "@/app/try/samples/parent";
import type { AnalysisResult } from "@/types/session";

/**
 * One lesson, several worksheets — the shape a class of mixed readers gets.
 * Stacked rather than tabbed, because she prints this and walks to class.
 */
const SPLIT_ANALYSIS: AnalysisResult = {
  ...SAMPLE_ANALYSIS,
  worksheetVariants: [
    {
      level: "1",
      worksheet: {
        title: "Level 1 — two syllables, closed only",
        difficulty: "easy",
        questions: [
          { id: "L1q1", prompt: "Split and read: nap-kin", answer: "napkin", difficulty: "easy" },
          { id: "L1q2", prompt: "Split and read: mag-net", answer: "magnet", difficulty: "easy" },
          { id: "L1q3", prompt: "Split and read: sun-set", answer: "sunset", difficulty: "easy" },
          { id: "L1q4", prompt: "Split and read: rab-bit", answer: "rabbit", difficulty: "easy" },
          { id: "L1q5", prompt: "Split and read: pic-nic", answer: "picnic", difficulty: "medium" },
        ],
      },
      answerKey: [
        { questionId: "L1q1", answer: "napkin" },
        { questionId: "L1q2", answer: "magnet" },
        { questionId: "L1q3", answer: "sunset" },
        { questionId: "L1q4", answer: "rabbit" },
        { questionId: "L1q5", answer: "picnic" },
      ],
    },
    {
      level: "3",
      worksheet: {
        title: "Level 3 — three syllables, mixed types",
        difficulty: "medium",
        questions: [
          { id: "L3q1", prompt: "Split and read: fan-tas-tic", answer: "fantastic", difficulty: "medium" },
          { id: "L3q2", prompt: "Split and read: im-por-tant", answer: "important", difficulty: "medium" },
          { id: "L3q3", prompt: "Split and read: to-ma-to", answer: "tomato", difficulty: "medium" },
          { id: "L3q4", prompt: "Split and read: cel-e-brate", answer: "celebrate", difficulty: "hard" },
          { id: "L3q5", prompt: "Split and read: ex-pen-sive", answer: "expensive", difficulty: "hard" },
        ],
      },
      answerKey: [
        { questionId: "L3q1", answer: "fantastic" },
        { questionId: "L3q2", answer: "important" },
        { questionId: "L3q3", answer: "tomato" },
        { questionId: "L3q4", answer: "celebrate" },
        { questionId: "L3q5", answer: "expensive" },
      ],
    },
  ],
};

const DEMO_PLAN: WeeklyPlan = {
  weeks: [
    { week: 1, focus: "Closed syllables, two at a time",
      sessions: [
        { day: "Mon", minutes: 10, skill: "Split at the consonant pair", activity: "Draw a line between the two middle consonants in eight words, then read each half.", parentTip: "If she reads the whole word first, cover the second half." },
        { day: "Tue", minutes: 10, skill: "Read each half alone", activity: "Read the halves off cards with no word in front of her.", parentTip: "Speed matters less than getting every vowel short." },
        { day: "Wed", minutes: 15, skill: "Blend the halves back", activity: "Put the two cards together and read the whole word without re-sounding it.", parentTip: "One pass only. Re-sounding is the habit we are replacing." },
        { day: "Thu", minutes: 10, skill: "Read in a sentence", activity: "Three sentences, each with two of this week's words.", parentTip: "Let her finish the sentence before you correct anything." },
        { day: "Fri", minutes: 10, skill: "Review and one win", activity: "Re-read Monday's eight words, then pick the one she found hardest and read it three times.", parentTip: "Say which one improved. Name it out loud." },
      ] },
    { week: 2, focus: "Three syllables, still closed",
      sessions: [
        { day: "Mon", minutes: 10, skill: "Find the syllables", activity: "Clap out six three-syllable words before reading any of them.", parentTip: "Clapping first stops the guess." },
        { day: "Tue", minutes: 15, skill: "Split and read", activity: "Same six words, split with a pencil, read part by part.", parentTip: "If a part stalls, go back to two syllables for that word." },
        { day: "Wed", minutes: 10, skill: "Blend all three", activity: "Read each word straight through, once.", parentTip: "No re-sounding. Cover and retry instead." },
        { day: "Thu", minutes: 10, skill: "Mixed practice", activity: "Two- and three-syllable words shuffled together.", parentTip: "The shuffle is the point — she has to decide, not follow a pattern." },
        { day: "Fri", minutes: 10, skill: "Review and one win", activity: "Re-read Monday's six, then choose a favourite to read to someone else.", parentTip: "Reading it to a person is the reward. Nothing else needed." },
      ] },
    { week: 3, focus: "Open syllables enter",
      sessions: [
        { day: "Mon", minutes: 10, skill: "Hear the long vowel", activity: "Sort eight syllables into short and long by sound only.", parentTip: "Ears before eyes this week." },
        { day: "Tue", minutes: 10, skill: "Read open syllables", activity: "Read ba, me, hi, go, tu off cards.", parentTip: "If she says the short sound, tap the card and wait." },
        { day: "Wed", minutes: 15, skill: "Open plus closed", activity: "Read words that mix the two: robot, tulip, music.", parentTip: "Say which half is open before she reads." },
        { day: "Thu", minutes: 10, skill: "Read in a sentence", activity: "Four sentences using this week's words.", parentTip: "Slow is fine. Guessing is not." },
        { day: "Fri", minutes: 10, skill: "Review and one win", activity: "Mix week two and week three words, read them all once.", parentTip: "Count how many she got first try, and tell her the number." },
      ] },
    { week: 4, focus: "Put it together",
      sessions: [
        { day: "Mon", minutes: 10, skill: "Mixed syllable types", activity: "Ten words drawing on all three weeks.", parentTip: "Let her split them herself now." },
        { day: "Tue", minutes: 15, skill: "Read a short passage", activity: "One paragraph built from words she has already met.", parentTip: "Do not stop her mid-sentence to correct." },
        { day: "Wed", minutes: 10, skill: "Reread for smoothness", activity: "Same paragraph, second time.", parentTip: "The second read is where fluency shows up." },
        { day: "Thu", minutes: 10, skill: "New passage, same words", activity: "A different paragraph, same word families.", parentTip: "Familiar words, unfamiliar order — that is the test." },
        { day: "Fri", minutes: 10, skill: "Review and one win", activity: "Read the first paragraph from week four once more, then stop.", parentTip: "Compare it to Monday of week one out loud. That is a month." },
      ] },
  ],
};

const THREAD: Continuity = {
  childId: "demo-1",
  sessionCount: 4,
  last: {
    id: "s-last",
    subject: "language",
    createdAt: "2026-08-26T18:30:00Z",
    taught: [
      "Split two-syllable words at the consonant pair",
      "Read closed syllables in isolation before in context",
      "Blend the halves back without re-sounding",
    ],
    nextStepPlan:
      "Next time, move from two-syllable words to three, keeping every syllable closed before introducing vowel teams.",
  },
  feedback: "too_hard",
  note: "She understands it visually but struggles when there are no pictures.",
};

const THREAD_NO_FEEDBACK: Continuity = {
  ...THREAD, childId: "demo-2", sessionCount: 1, feedback: null, note: null,
};

const THREAD_FRESH: Continuity = {
  childId: "demo-3", sessionCount: 0, last: null, feedback: null, note: null,
};

function ModeDemo() {
  const [mode, setMode] = useState<SessionInputType>("plan");
  return (
    <div className="space-y-3">
      <SessionModePicker value={mode} onChange={setMode} />
      <p className="text-xs text-pop-night/60">
        box label: <b>{sessionMode(mode).label}</b> · required:{" "}
        <b>{mode === "plan" ? "no" : "yes"}</b>
      </p>
    </div>
  );
}

function SpreadDemo() {
  const [spread, setSpread] = useState<LevelSpread>({ "1": 6, "3": 12, "4": 4 });
  return <LevelSpreadPicker value={spread} onChange={setSpread} />;
}

function AchievementDemo() {
  const [lvl, setLvl] = useState<AchievementLevel | null>(null);
  return <AchievementLevelPicker value={lvl} onChange={setLvl} />;
}

function ExpectationPickerDemo() {
  const [subject, setSubject] = useState<SubjectId>("language");
  const [grade, setGrade] = useState<GradeId>("3");
  const [code, setCode] = useState("");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["language", "mathematics", "french", "science-technology"] as SubjectId[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSubject(s)}
            className={`rounded-full border-[3px] border-pop-night px-3 py-1 text-xs font-semibold ${
              subject === s ? "bg-pop-night text-pop-cream" : "bg-white text-pop-night"
            }`}
          >
            {s}
          </button>
        ))}
        {(["1", "3", "6"] as GradeId[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGrade(g)}
            className={`rounded-full border-[3px] border-pop-night px-3 py-1 text-xs font-semibold ${
              grade === g ? "bg-pop-yellow" : "bg-white"
            }`}
          >
            Gr {g}
          </button>
        ))}
      </div>
      <ExpectationPicker
        subject={subject}
        grade={grade}
        onGradeChange={setGrade}
        childGrade="3"
        value={code}
        onChange={setCode}
      />
      <p className="text-xs text-pop-night/60">selected: {code || "(none)"}</p>
    </div>
  );
}

export default function PreviewGallery() {
  return (
    <div className="mx-auto max-w-4xl space-y-16 px-4 py-12 sm:px-6">
      <Block label="WeeklyPlanCard — four weeks, five sessions each">
        <WeeklyPlanCard plan={DEMO_PLAN} />
      </Block>

      <Block label="ContinueCard — the thread, picked back up">
        <div className="grid gap-3 sm:grid-cols-2">
          <ContinueCard nickname="Iliana" grade="3" kind="student" continuity={THREAD} />
          <ContinueCard nickname="Penelope" grade="5" kind="student" continuity={THREAD_NO_FEEDBACK} />
          <ContinueCard nickname="Grade 4 Math" grade="4" kind="class" continuity={THREAD_FRESH} />
        </div>
      </Block>

      <Block label="SessionModePicker — the third mode needs no text">
        <ModeDemo />
      </Block>

      <Block label="LevelSpreadPicker — how a class splits">
        <SpreadDemo />
      </Block>

      <Block label="AchievementLevelPicker — Ontario 1-4">
        <AchievementDemo />
      </Block>

      <Block label="ExpectationPicker — Language, Grade 3 (real Ontario data)">
        <ExpectationPickerDemo />
      </Block>

      <Block label="LoadingState">
        <LoadingState />
      </Block>

      <Block label="UploadBox + PrivacyWarning">
        <UploadBox onFileReady={() => {}} />
      </Block>

      <Block label="ProgressTracker">
        <ProgressTracker
          summary={{
            practicedCount: 12,
            masteredCount: 5,
            strugglingCount: 2,
            recentSkills: [
              { skill: "reading.blends", status: "mastered", lastSeen: "2026-08-20T10:00:00Z" },
              { skill: "reading.vowel-teams", status: "practiced", lastSeen: "2026-08-22T10:00:00Z" },
              { skill: "math.borrowing", status: "struggling", lastSeen: "2026-08-23T10:00:00Z" },
            ],
          }}
        />
      </Block>

      <Block label="WorksheetCard">
        <WorksheetCard
          worksheet={SAMPLE_ANALYSIS.practiceWorksheet}
          answerKey={SAMPLE_ANALYSIS.answerKey}
        />
      </Block>

      <Block label="ChildProfileForm">
        <ChildProfileForm />
      </Block>

      <Block label="AnalysisResultCard — one lesson, a worksheet per level">
        <AnalysisResultCard result={SPLIT_ANALYSIS} />
      </Block>

      <Block label="AnalysisResultCard">
        <AnalysisResultCard result={SAMPLE_ANALYSIS} />
      </Block>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-4 font-display text-xs uppercase tracking-[0.3em] text-pop-magenta">
        {label}
      </p>
      {children}
    </section>
  );
}
