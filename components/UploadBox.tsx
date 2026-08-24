"use client";

import { useState } from "react";
import PrivacyWarning from "./PrivacyWarning";

/**
 * Minimal upload UI. Real wiring (signed URL → PUT → record row) happens in a
 * server action; this component just collects the file and surfaces state.
 */
export default function UploadBox({
  onFileReady,
}: {
  onFileReady?: (file: File) => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="space-y-4">
      <PrivacyWarning onConfirm={setConfirmed} />

      <div
        className={[
          "rounded-2xl border-2 border-dashed p-6 text-center transition",
          confirmed ? "border-pop-night bg-pop-cyan" : "border-pop-night bg-pop-cream opacity-60",
        ].join(" ")}
      >
        <p className="font-display text-lg text-pop-night">
          {file ? `Selected: ${file.name}` : "Drop a worksheet, photo, or PDF"}
        </p>
        <p className="mt-1 text-sm text-pop-night/60">
          PNG, JPG, WEBP, PDF, or TXT · up to 10&nbsp;MB
        </p>
        <label
          className={[
            "mt-4 inline-flex cursor-pointer items-center rounded-full px-5 py-2 text-sm font-semibold",
            confirmed
              ? "bg-pop-pink text-white hover:bg-pop-magenta"
              : "cursor-not-allowed bg-pop-night/25 text-pop-night/60",
          ].join(" ")}
        >
          Choose file
          <input
            type="file"
            className="hidden"
            disabled={!confirmed}
            accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f) onFileReady?.(f);
            }}
          />
        </label>
      </div>

      <p className="text-xs text-pop-night/60">
        Your file goes to a private storage bucket. We delete it after analysis
        unless you ask us to keep it. See our <a className="underline" href="/privacy">privacy promise</a>.
      </p>
    </div>
  );
}
