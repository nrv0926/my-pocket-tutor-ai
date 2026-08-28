import Link from "next/link";
import { redirect } from "next/navigation";
import NewSessionForm from "./NewSessionForm";
import RoleSwitcher from "@/components/RoleSwitcher";
import { getServerSupabase } from "@/lib/supabaseServer";
import { getRole } from "@/lib/role";
import { roleCopy } from "@/lib/roleCopy";

export const dynamic = "force-dynamic";

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: { subject?: string; expectation?: string; program?: string };
}) {
  const role = getRole();
  const copy = roleCopy(role);
  const supabase = getServerSupabase();
  const { data: children, error } = await supabase
    .from("children")
    .select("id, nickname, grade, kind")
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
        <h1 className="mt-1 font-display text-3xl text-pop-night">{copy.sessionTitle}</h1>
        <p className="mt-2 text-pop-night/80">{copy.sessionSubhead}</p>
        <div className="mt-4">
          <p className="mb-1.5 font-display text-[11px] uppercase tracking-widest text-pop-night/50">
            Planning as
          </p>
          <RoleSwitcher current={role} next="/session/new" compact />
        </div>
      </header>

      <NewSessionForm
        initialSubject={searchParams.subject}
        initialExpectation={searchParams.expectation}
        initialProgram={searchParams.program}
        showLevel={role === "teacher" || role === "homeschooler"}
        childProfiles={children.map((c) => ({
          id: c.id,
          nickname: c.nickname,
          grade: c.grade,
          kind: (c.kind ?? "student") as "student" | "class",
        }))}
      />

      <p className="mt-6 text-sm text-pop-night/60">
        Want to upload a worksheet instead? <Link className="underline" href="/upload">Open the upload page</Link>
        {" "}— file uploads land in Phase 1.5.
      </p>
    </div>
  );
}
