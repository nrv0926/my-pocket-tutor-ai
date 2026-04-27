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
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">
          Secure upload
        </p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Share a worksheet or document.</h1>
        <p className="mt-2 text-ink-soft">
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
          className="rounded-full bg-forest-500 px-5 py-3 text-sm font-semibold text-white hover:bg-forest-600 disabled:opacity-50"
        >
          {busy ? "Analyzing..." : "Analyze this"}
        </button>
        {busy && <LoadingState label="Sending to AI..." />}
      </div>
    </div>
  );
}
