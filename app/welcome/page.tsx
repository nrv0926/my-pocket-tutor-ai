import { redirect } from "next/navigation";
import { selectRole } from "@/lib/actions/role";
import { getRole } from "@/lib/role";
import { safeNext } from "@/lib/safeRedirect";

export const dynamic = "force-dynamic";

/**
 * The first question the app asks: who are you planning for?
 *
 * The role was only ever settable from the marketing pages, so anyone who
 * arrived by magic link — which is everyone the second time, and most people
 * the first — landed with no role at all. That is not a cosmetic default:
 * roleCopy() falls back to parent wording, and the class and achievement-level
 * controls are shown only to teachers and homeschoolers. A teacher who signed
 * in without passing /for/teacher never saw the half of the product built for
 * her.
 *
 * A plain form posting to the same action the marketing pages use. No client
 * JavaScript, works with a keyboard, and one code path for setting a role.
 */
const CHOICES = [
  {
    role: "parent",
    title: "A parent",
    line: "My child is at school. I want to help with what they are finding hard.",
    becomes: "Your child's learning helper",
  },
  {
    role: "homeschooler",
    title: "A homeschooling parent",
    line: "I am teaching my own child, and I plan what they cover.",
    becomes: "Your curriculum planning assistant",
  },
  {
    role: "teacher",
    title: "A teacher",
    line: "I have a class, and they are not all in the same place.",
    becomes: "Your classroom planning assistant",
  },
] as const;

export default function WelcomePage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  // Nothing to ask if it is already answered — going back to /welcome by
  // hand should not make anyone re-pick.
  if (getRole()) redirect(safeNext(searchParams.next ?? null, "/dashboard"));

  const next = safeNext(searchParams.next ?? null, "/dashboard");

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-pop-magenta">
          One question
        </p>
        <h1 className="mt-1 font-display text-4xl leading-[1.05] text-pop-night">
          Who are you planning for?
        </h1>
        <p className="mt-3 text-pop-night/80">
          It changes the questions we ask and how every plan is written. You can
          switch whenever you like — nothing you have already made is touched.
        </p>
      </header>

      <ul className="space-y-3">
        {CHOICES.map((c) => (
          <li key={c.role}>
            <form action={selectRole}>
              <input type="hidden" name="role" value={c.role} />
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                className="w-full rounded-2xl border-[3px] border-pop-night bg-white p-5 text-left shadow-pop-sm transition-all hover:bg-pop-cyan focus:bg-pop-cyan focus:outline-none focus:ring-4 focus:ring-pop-pink/30"
              >
                <p className="font-display text-xl text-pop-night">{c.title}</p>
                <p className="mt-1 text-sm text-pop-night/80">{c.line}</p>
                <p className="mt-2 font-display text-[11px] uppercase tracking-widest text-pop-magenta">
                  Pocket Tutor becomes {c.becomes}
                </p>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
