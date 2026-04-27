"use client";

import Link from "next/link";
import { useState } from "react";

type Mode = "paste" | "upload" | "describe" | "worksheet" | "plan";

export default function NewSessionPage() {
  const [mode, setMode] = useState<Mode>("paste");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">
          New learning session
        </p>
        <h1 className="mt-1 font-serif text-3xl text-ink">What would you like help with?</h1>
        <p className="mt-2 text-ink-soft">
          Pick the option that matches what you have right now. We'll do the rest.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Choice
          active={mode === "paste"}
          onClick={() => setMode("paste")}
          title="Paste report card comments"
          desc="A sentence or two from the term report works."
        />
        <Choice
          active={mode === "upload"}
          onClick={() => setMode("upload")}
          title="Upload a document"
          desc="Worksheet, photo of an assignment, or a PDF."
        />
        <Choice
          active={mode === "describe"}
          onClick={() => setMode("describe")}
          title="Describe a homework struggle"
          desc="Just tell us what's going on in plain English."
        />
        <Choice
          active={mode === "worksheet"}
          onClick={() => setMode("worksheet")}
          title="Generate a worksheet"
          desc="Pick a skill — we'll print 5–8 practice questions."
        />
        <Choice
          active={mode === "plan"}
          onClick={() => setMode("plan")}
          title="Create a 4-week plan"
          desc="Five short sessions per week, easy → harder."
        />
      </div>

      <div className="mt-8">
        {mode === "paste" && <PasteForm />}
        {mode === "describe" && <DescribeForm />}
        {mode === "upload" && (
          <p className="rounded-2xl border border-cream-300 bg-white p-6 text-sm text-ink-soft">
            Continue to the secure upload page →{" "}
            <Link href="/upload" className="text-forest-500 underline">
              Open upload
            </Link>
          </p>
        )}
        {(mode === "worksheet" || mode === "plan") && (
          <p className="rounded-2xl border border-cream-300 bg-white p-6 text-sm text-ink-soft">
            Coming up: pick the target skill from your child's most recent gaps. (Wired in Phase 1.5.)
          </p>
        )}
      </div>
    </div>
  );
}

function Choice({
  title,
  desc,
  active,
  onClick,
}: {
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-2xl border p-5 text-left shadow-card transition",
        active
          ? "border-forest-500 bg-forest-50"
          : "border-cream-300 bg-white hover:border-forest-500",
      ].join(" ")}
    >
      <p className="font-serif text-lg text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-soft">{desc}</p>
    </button>
  );
}

function PasteForm() {
  return (
    <form className="space-y-3 rounded-2xl border border-cream-300 bg-white p-6 shadow-card">
      <label className="block text-sm font-medium text-ink-soft">
        Paste the report card sentence
      </label>
      <textarea
        rows={6}
        placeholder="e.g. Reads grade-level texts but is hesitant with multisyllabic words..."
        className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2.5 outline-none focus:border-forest-500 focus:bg-white focus:ring-4 focus:ring-forest-500/15"
      />
      <button
        type="submit"
        className="rounded-full bg-forest-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-600"
      >
        Analyze
      </button>
    </form>
  );
}

function DescribeForm() {
  return (
    <form className="space-y-3 rounded-2xl border border-cream-300 bg-white p-6 shadow-card">
      <label className="block text-sm font-medium text-ink-soft">
        What's tricky right now?
      </label>
      <textarea
        rows={6}
        placeholder="Tell us in your own words. e.g. He freezes when subtraction has borrowing."
        className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2.5 outline-none focus:border-forest-500 focus:bg-white focus:ring-4 focus:ring-forest-500/15"
      />
      <button
        type="submit"
        className="rounded-full bg-forest-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-600"
      >
        Get a plan
      </button>
    </form>
  );
}
