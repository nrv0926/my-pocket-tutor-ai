"use client";

import { useState } from "react";
import LoadingState from "@/components/LoadingState";
import UploadBox from "@/components/UploadBox";
import { analyzeUpload } from "@/lib/actions/uploads";
import { rejectReason } from "@/lib/uploadRules";

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

export default function UploadClient({
  learners,
}: {
  learners: { id: string; nickname: string; grade: string }[];
}) {
  const [childId, setChildId] = useState(learners[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Same rules the server applies, checked here so the person hears about a
  // 40 MB file before waiting for it to travel.
  const localReason = file
    ? rejectReason({ type: file.type, size: file.size, name: file.name })
    : null;

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-pop-night/80">Whose is it?</span>
        <select
          value={childId}
          onChange={(e) => setChildId(e.target.value)}
          className="w-full rounded-xl border-[3px] border-pop-night bg-pop-cream px-3 py-2.5 outline-none focus:border-pop-night focus:bg-white focus:ring-4 focus:ring-pop-pink/30"
        >
          {learners.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nickname} (Grade {c.grade})
            </option>
          ))}
        </select>
      </label>

      <UploadBox onFileReady={setFile} />

      {localReason && (
        <p className="rounded-xl border-[3px] border-pop-night bg-pop-tangerine px-3 py-2 text-sm text-pop-night">
          {localReason}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!file || !childId || busy || Boolean(localReason)}
          onClick={async () => {
            if (!file) return;
            setBusy(true);
            setError(null);
            try {
              const fd = new FormData();
              fd.set("childId", childId);
              fd.set("file", file);
              await analyzeUpload(fd);
            } catch (err) {
              if (isRedirectSignal(err)) throw err;
              setError(err instanceof Error ? err.message : "Could not analyze that file.");
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-full border-[3px] border-pop-night bg-pop-pink px-5 py-3 font-display text-xs uppercase tracking-wide text-pop-night shadow-pop-sm transition-all hover:bg-pop-yellow disabled:opacity-50"
        >
          {busy ? "Reading it…" : "Analyze this"}
        </button>
        {busy && <LoadingState label="Reading the document…" />}
      </div>

      {error && (
        <p className="rounded-xl border-[3px] border-pop-night bg-pop-tangerine px-3 py-2 text-sm text-pop-night">
          {error}
        </p>
      )}
    </div>
  );
}
