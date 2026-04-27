"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ChildProfileForm from "@/components/ChildProfileForm";
import { createChild } from "@/lib/actions/children";

export default function NewChildPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">
          New child profile
        </p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Tell us about your child.</h1>
        <p className="mt-2 text-ink-soft">
          We use a nickname only — never a full name. Strengths and challenges
          help us tune the plan; you can change anything later.
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      <ChildProfileForm
        onSubmit={async (data) => {
          setError(null);
          try {
            const { id } = await createChild(data);
            router.push(`/progress/${id}`);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save profile.");
          }
        }}
      />
    </div>
  );
}
