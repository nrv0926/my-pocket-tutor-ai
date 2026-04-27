"use client";

import { useState } from "react";

/**
 * MUST appear before any file upload. Cannot be bypassed via a setting.
 * The parent ticks "this is safe to analyze" — the upload UI stays disabled
 * until they do.
 */
export default function PrivacyWarning({
  onConfirm,
}: {
  onConfirm: (confirmed: boolean) => void;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <section
      className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-ink"
      aria-label="Privacy reminder"
    >
      <h3 className="font-serif text-lg">Before you upload</h3>
      <p className="mt-2 text-sm text-ink-soft">
        Please remove or cover any personal information such as your child's
        full name, school name, address, student number, phone number, or
        anything else that could identify them. <strong>Is this safe to
        analyze?</strong>
      </p>
      <label className="mt-4 inline-flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-cream-300 text-forest-500 focus:ring-forest-500"
          checked={checked}
          onChange={(e) => {
            setChecked(e.target.checked);
            onConfirm(e.target.checked);
          }}
        />
        <span>
          I've checked the file. It does not contain identifying information,
          and I'm okay with sharing it for analysis.
        </span>
      </label>
    </section>
  );
}
