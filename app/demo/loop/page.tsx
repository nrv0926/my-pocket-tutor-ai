import Link from "next/link";
import LoopClient from "./LoopClient";

export const metadata = {
  title: "Assessment loop · AI Pocket Tutor",
  description:
    "Record how each question went and watch what the engine decides. No sign-in, no database.",
};

/**
 * A place to exercise the assess-teach-practise-recheck loop without
 * standing anything up. Public and self-contained on purpose: the loop
 * had no testable surface before this, because every real path needs
 * Supabase, a signed-in adult and a saved child profile first.
 */
export default function DemoLoopPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-pop-magenta">
          Working demo · nothing is saved
        </p>
        <h1 className="mt-1 font-display text-3xl text-pop-night">
          Watch the loop turn.
        </h1>
        <p className="mt-2 max-w-prose text-pop-night/80">
          Record how each question went, and the suggestion underneath updates
          from what you recorded. This runs the real capture screen, the real
          decision engine and the real skill graph — the only thing missing is
          a database, so a reload clears it.
        </p>
        <p className="mt-2 max-w-prose text-sm text-pop-night/60">
          The three cases are illustrative — this page is public, so no real
          learner appears on it. For the rendering of every component on its
          own, see{" "}
          <Link href="/qa-preview" className="text-pop-magenta underline">
            /qa-preview
          </Link>
          .
        </p>
      </header>
      <LoopClient />
    </div>
  );
}
