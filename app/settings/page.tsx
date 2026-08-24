import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">
          Settings
        </p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Your account.</h1>
      </header>

      <section className="mb-6 rounded-2xl border border-cream-300 bg-white p-5 shadow-card">
        <h2 className="font-serif text-lg text-ink">Privacy</h2>
        <p className="mt-2 text-sm text-ink-soft">
          We never use your data to train AI models. Uploaded files are deleted
          after analysis unless you opt in below.
        </p>
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5" />
          <span>Keep my uploads in private storage so I can re-open them later.</span>
        </label>
        <p className="mt-3 text-xs">
          <Link href="/privacy" className="text-forest-500 underline">Read the privacy promise</Link>
          {" · "}
          <Link href="/security" className="text-forest-500 underline">Security details</Link>
        </p>
      </section>

      <section className="mb-6 rounded-2xl border border-cream-300 bg-white p-5 shadow-card">
        <h2 className="font-serif text-lg text-ink">Children</h2>
        <p className="mt-2 text-sm text-ink-soft">Manage child profiles.</p>
        <Link
          href="/children/new"
          className="mt-3 inline-flex items-center rounded-full border border-forest-500 px-4 py-2 text-sm font-medium text-forest-600 hover:bg-forest-50"
        >
          Add a child
        </Link>
      </section>

      <section className="mb-6 rounded-2xl border border-cream-300 bg-white p-5 shadow-card">
        <h2 className="font-serif text-lg text-ink">Subscription</h2>
        <p className="mt-2 text-sm text-ink-soft">
          You're on the <strong>Free</strong> plan. Stripe billing wires up in
          Phase 1.5.
        </p>
        <Link
          href="/pricing"
          className="mt-3 inline-flex items-center rounded-full bg-forest-500 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-600"
        >
          See plans
        </Link>
      </section>

      <section className="mb-6 rounded-2xl border border-cream-300 bg-white p-5 shadow-card">
        <h2 className="font-serif text-lg text-ink">Sign out</h2>
        <form action="/auth/signout" method="post" className="mt-3">
          <button
            type="submit"
            className="rounded-full border border-cream-300 px-4 py-2 text-sm font-medium text-ink hover:bg-cream-50"
          >
            Sign out of this device
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
        <h2 className="font-serif text-lg text-ink">Delete account</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Removes your children, sessions, files, and progress records. This cannot be undone.
        </p>
        <button
          type="button"
          className="mt-3 rounded-full border border-amber-400 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
        >
          Delete my account
        </button>
      </section>
    </div>
  );
}
