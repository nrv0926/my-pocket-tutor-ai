"use client";

import AnalysisResultCard from "@/components/AnalysisResultCard";
import WorksheetCard from "@/components/WorksheetCard";
import ProgressTracker from "@/components/ProgressTracker";
import ChildProfileForm from "@/components/ChildProfileForm";
import LoadingState from "@/components/LoadingState";
import UploadBox from "@/components/UploadBox";
import { SAMPLE_ANALYSIS } from "@/app/try/samples/parent";

export default function PreviewGallery() {
  return (
    <div className="mx-auto max-w-4xl space-y-16 px-4 py-12 sm:px-6">
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
