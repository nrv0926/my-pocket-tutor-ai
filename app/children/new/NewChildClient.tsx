"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ChildProfileForm from "@/components/ChildProfileForm";
import { createChild } from "@/lib/actions/children";
import type { Role } from "@/types/child";

export default function NewChildClient({
  role,
  allowClass = false,
}: {
  role: Role | null;
  allowClass?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      {error && (
        <div className="mb-4 rounded-xl border border-pop-night bg-pop-tangerine p-3 text-sm text-pop-night">
          {error}
        </div>
      )}

      <ChildProfileForm
        role={role}
        allowClass={allowClass}
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
    </>
  );
}
