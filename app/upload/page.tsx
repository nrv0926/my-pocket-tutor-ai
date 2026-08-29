import { redirect } from "next/navigation";
import UploadClient from "./UploadClient";
import { getRole } from "@/lib/role";
import { getServerSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  if (!getRole()) redirect("/welcome?next=%2Fupload");

  const supabase = getServerSupabase();
  const { data: children } = await supabase
    .from("children")
    .select("id, nickname, grade")
    .order("created_at", { ascending: true });

  if (!children || children.length === 0) redirect("/children/new");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-pop-magenta">
          Secure upload
        </p>
        <h1 className="mt-1 font-display text-3xl text-pop-night">
          Share a report card or worksheet.
        </h1>
        <p className="mt-2 text-pop-night/80">
          A photo of the page is fine — we read it as it is, columns and all.
          The file goes to a private bucket and is deleted the moment the plan
          is written.
        </p>
      </header>

      <UploadClient
        learners={children.map((c) => ({
          id: c.id,
          nickname: c.nickname,
          grade: c.grade,
        }))}
      />
    </div>
  );
}
