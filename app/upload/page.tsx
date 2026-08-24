"use client";

import { useState } from "react";
import UploadBox from "@/components/UploadBox";
import LoadingState from "@/components/LoadingState";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-pop-magenta">
          Secure upload
        </p>
        <h1 className="mt-1 font-display text-3xl text-pop-night">Share a worksheet or document.</h1>
        <p className="mt-2 text-pop-night/80">
          Files go to a private storage bucket. We delete them after analysis
          unless you choose to keep them.
        </p>
      </header>

      <UploadBox onFileReady={setFile} />

      <div className="mt-6 flex items-center gap-3">
        <button
          disabled={!file || busy}
          onClick={async () => {
            setBusy(true);
            // TODO: server action: createSignedUploadUrl, PUT file, insert
            // uploads row, kick off analysis, redirect to /results/[id].
            await new Promise((r) => setTimeout(r, 800));
            setBusy(false);
            alert("Upload pipeline wires up in Phase 1.5.");
          }}
          className="rounded-full bg-pop-pink px-5 py-3 text-sm font-semibold text-pop-night hover:bg-pop-yellow disabled:opacity-50"
        >
          {busy ? "Analyzing..." : "Analyze this"}
        </button>
        {busy && <LoadingState label="Sending to AI..." />}
      </div>
    </div>
  );
}
