import { getRole } from "@/lib/role";
import { roleCopy } from "@/lib/roleCopy";
import NewChildClient from "./NewChildClient";

export default function NewChildPage() {
  const role = getRole();
  const copy = roleCopy(role);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-pop-magenta">
          {role ? copy.headline : "New profile"}
        </p>
        <h1 className="mt-1 font-display text-3xl text-pop-night">
          {copy.pageTitle}
        </h1>
        <p className="mt-2 text-pop-night/80">
          {role
            ? copy.subhead
            : "We use a nickname only — never a full name. Strengths and challenges help us tune the plan; you can change anything later."}
        </p>
        {role && (
          <p className="mt-2 text-xs text-pop-night/60">
            We use a nickname only — never a full name.
          </p>
        )}
      </header>
      <NewChildClient role={role} allowClass={role === "teacher"} />
    </div>
  );
}
