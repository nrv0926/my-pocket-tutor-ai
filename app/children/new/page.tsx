"use client";

import { useRouter } from "next/navigation";
import ChildProfileForm from "@/components/ChildProfileForm";

export default function NewChildPage() {
  const router = useRouter();

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

      <ChildProfileForm
        onSubmit={async (data) => {
          // TODO: server action to insert into `children` (RLS-scoped client).
          console.log("[children/new] would insert:", data);
          router.push("/dashboard");
        }}
      />
    </div>
  );
}
