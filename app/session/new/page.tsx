import Link from "next/link";
import { redirect } from "next/navigation";
import NewSessionForm from "./NewSessionForm";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { Mode } from "@/types/session";

export const dynamic = "force-dynamic";

const VALID_MODES: readonly Mode[] = ["parent", "homeschool", "teacher"];

function parseMode(raw: string | string[] | undefined): Mode | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return VALID_MODES.includes(value as Mode) ? (value as Mode) : undefined;
}

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams?: { mode?: string | string[] };
}) {
  const initialMode = parseMode(searchParams?.mode);

  const supabase = getServerSupabase();
  const { data: children, error } = await supabase
    .from("children")
    .select("id, nickname, grade")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm text-amber-700">Could not load children: {error.message}</p>
      </div>
    );
  }

  if (!children || children.length === 0) {
    redirect("/children/new");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.07em] text-teal-400">
          New learning session
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-forest-600">
          What would you like help with?
        </h1>
        <p className="mt-2 text-ink-soft">
          Pick the mode that fits your situation, choose what you have, and
          we&rsquo;ll do the rest.
        </p>
      </header>

      <NewSessionForm
        children={children.map((c) => ({ id: c.id, nickname: c.nickname, grade: c.grade }))}
        initialMode={initialMode}
      />

      <p className="mt-6 text-sm text-ink-muted">
        Want to upload a worksheet instead?{" "}
        <Link className="underline" href="/upload">Open the upload page</Link>
        {" "}&mdash; file uploads land in Phase 1.5.
      </p>
    </div>
  );
}
