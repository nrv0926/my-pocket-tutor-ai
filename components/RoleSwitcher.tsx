import { selectRole } from "@/lib/actions/role";
import { ROLES, type Role } from "@/types/child";
import { ROLE_COPY } from "@/lib/roleCopy";

const BLURB: Record<Role, string> = {
  parent: "Ten-minute sessions at the kitchen table, after a school day.",
  homeschooler: "Fuller mini-lessons, and where you are in the sequence.",
  teacher: "Ten-minute rotations, exit tickets, and a track for each level.",
};

const LABEL: Record<Role, string> = {
  parent: "Parent",
  homeschooler: "Homeschooler",
  teacher: "Teacher",
};

/**
 * Switch which kind of work the app is planning for.
 *
 * The role was only ever settable from the marketing pages, which meant
 * someone who is both a parent and a teacher — most teachers — was stuck with
 * whichever door they came through. It changes the questions the intake asks,
 * the wording of every plan, and whether classes and achievement levels are
 * offered at all, so it belongs somewhere you can reach after signing in.
 *
 * A plain form: no client JavaScript, and it works with the keyboard.
 */
export default function RoleSwitcher({
  current,
  next = "/settings",
  compact = false,
}: {
  current: Role | null;
  /** Where to return after switching. */
  next?: string;
  compact?: boolean;
}) {
  return (
    <form action={selectRole}>
      <input type="hidden" name="next" value={next} />
      <div className={compact ? "flex flex-wrap gap-2" : "grid gap-2 sm:grid-cols-3"}>
        {ROLES.map((r) => {
          const active = r === current;
          return (
            <button
              key={r}
              type="submit"
              name="role"
              value={r}
              aria-current={active ? "true" : undefined}
              className={`rounded-xl border-[3px] border-pop-night px-4 py-2 text-left shadow-pop-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
                active ? "bg-pop-night text-pop-cream" : "bg-white text-pop-night hover:bg-pop-yellow"
              }`}
            >
              <span className="block font-display text-xs uppercase tracking-wide">
                {LABEL[r]}
                {active && <span className="ml-2 text-pop-cyan">current</span>}
              </span>
              {!compact && (
                <span
                  className={`mt-1 block text-[11px] ${active ? "text-pop-cream/75" : "text-pop-night/60"}`}
                >
                  {BLURB[r]}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!compact && (
        <p className="mt-2 text-xs text-pop-night/60">
          {current
            ? `Set up as a ${LABEL[current].toLowerCase()} — ${ROLE_COPY[current].subhead}`
            : "Pick one and every plan is written for that reader. You can change it whenever."}
        </p>
      )}
    </form>
  );
}
