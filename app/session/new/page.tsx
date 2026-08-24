import Link from "next/link";
import { redirect } from "next/navigation";
import NewSessionForm from "./NewSessionForm";
import { getServerSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const supabase = getServerSupabase();
  const { data: children, error } = await supabase
    .from("children")
    .select("id, nickname, grade")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm text-pop-night">Could not load children: {error.message}</p>
      </div>
    );
  }

  if (!children || children.length === 0) {
    redirect("/children/new");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-pop-magenta">
          New learning session
        </p>
        <h1 className="mt-1 font-display text-3xl text-pop-night">What would you like help with?</h1>
        <p className="mt-2 text-pop-night/80">
          Pick a child, choose what you have, and we'll do the rest.
        </p>
      </header>

      <NewSessionForm
        children={children.map((c) => ({ id: c.id, nickname: c.nickname, grade: c.grade }))}
      />

      <p className="mt-6 text-sm text-pop-night/60">
        Want to upload a worksheet instead? <Link className="underline" href="/upload">Open the upload page</Link>
        {" "}— file uploads land in Phase 1.5.
      </p>
    </div>
  );
}
