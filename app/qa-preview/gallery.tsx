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
