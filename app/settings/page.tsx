import Link from "next/link";
import RoleSwitcher from "@/components/RoleSwitcher";
import { getRole } from "@/lib/role";

export default function SettingsPage() {
  const role = getRole();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-pop-magenta">
          Settings
        </p>
        <h1 className="mt-1 font-display text-3xl text-pop-night">Your account.</h1>
      </header>

      <section className="mb-6 rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm">
        <h2 className="font-display text-lg text-pop-night">What are you planning for?</h2>
        <p className="mt-2 text-sm text-pop-night/80">
          This changes the questions we ask and how every plan is written. Switch
          whenever — plans you already have are not touched.
        </p>
        <div className="mt-4">
          <RoleSwitcher current={role} next="/settings" />
        </div>
      </section>

      <section className="mb-6 rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm">
        <h2 className="font-display text-lg text-pop-night">Privacy</h2>
        <p className="mt-2 text-sm text-pop-night/80">
          We never use your data to train AI models. Uploaded files are deleted
          after analysis unless you opt in below.
        </p>
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5" />
          <span>Keep my uploads in private storage so I can re-open them later.</span>
        </label>
        <p className="mt-3 text-xs">
          <Link href="/privacy" className="text-pop-magenta underline">Read the privacy promise</Link>
          {" · "}
          <Link href="/security" className="text-pop-magenta underline">Security details</Link>
        </p>
      </section>

      <section className="mb-6 rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm">
        <h2 className="font-display text-lg text-pop-night">Children</h2>
        <p className="mt-2 text-sm text-pop-night/80">Manage child profiles.</p>
        <Link
          href="/children/new"
          className="mt-3 inline-flex items-center rounded-full border border-pop-night px-4 py-2 text-sm font-medium text-pop-magenta hover:bg-pop-cyan"
        >
          Add a child
        </Link>
      </section>

      <section className="mb-6 rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm">
        <h2 className="font-display text-lg text-pop-night">Subscription</h2>
        <p className="mt-2 text-sm text-pop-night/80">
          You&apos;re on the <strong>Free</strong> plan. Stripe billing wires up in
          Phase 1.5.
        </p>
        <Link
          href="/pricing"
          className="mt-3 inline-flex items-center rounded-full bg-pop-pink px-4 py-2 text-sm font-semibold text-pop-night hover:bg-pop-yellow"
        >
          See plans
        </Link>
      </section>

      <section className="mb-6 rounded-2xl border-[3px] border-pop-night bg-white p-5 shadow-pop-sm">
        <h2 className="font-display text-lg text-pop-night">Sign out</h2>
        <form action="/auth/signout" method="post" className="mt-3">
          <button
            type="submit"
            className="rounded-full border-[3px] border-pop-night px-4 py-2 text-sm font-medium text-pop-night hover:bg-pop-cream"
          >
            Sign out of this device
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-pop-night bg-pop-tangerine p-5">
        <h2 className="font-display text-lg text-pop-night">Delete account</h2>
        <p className="mt-2 text-sm text-pop-night/80">
          Removes your children, sessions, files, and progress records. This cannot be undone.
        </p>
        <button
          type="button"
          className="mt-3 rounded-full border border-pop-night bg-white px-4 py-2 text-sm font-medium text-pop-night hover:bg-pop-yellow"
        >
          Delete my account
        </button>
      </section>
    </div>
  );
}
