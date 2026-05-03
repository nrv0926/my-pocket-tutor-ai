import { getRole, ROLE_HEADLINE, ROLE_SUBHEAD } from "@/lib/role";
import NewChildClient from "./NewChildClient";

export default function NewChildPage() {
  const role = getRole();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">
          {role ? ROLE_HEADLINE[role] : "New child profile"}
        </p>
        <h1 className="mt-1 font-serif text-3xl text-ink">
          {role === "teacher" ? "Tell us about your student." : "Tell us about your child."}
        </h1>
        <p className="mt-2 text-ink-soft">
          {role
            ? ROLE_SUBHEAD[role]
            : "We use a nickname only — never a full name. Strengths and challenges help us tune the plan; you can change anything later."}
        </p>
        {role && (
          <p className="mt-2 text-xs text-ink-muted">
            We use a nickname only — never a full name.
          </p>
        )}
      </header>
      <NewChildClient />
    </div>
  );
}
