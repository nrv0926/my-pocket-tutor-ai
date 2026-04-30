import Link from "next/link";
import PricingCards from "@/components/PricingCards";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="px-4 pt-12 sm:px-6 sm:pt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-forest-600">
              For parents and teachers · K–6
            </span>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-ink sm:text-5xl">
              Know exactly how to <em className="text-forest-500">help your child learn.</em>
            </h1>
            <p className="mt-4 max-w-prose text-ink-soft">
              AI Pocket Tutor turns a report card comment, a tricky worksheet,
              or a worry into a clear plan: what to teach next, how to teach
              it, and a short worksheet to practice with — in plain English a
              tired parent at 9 pm can read.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/children/new"
                className="inline-flex items-center rounded-full bg-forest-500 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-forest-600"
              >
                Start a child profile
              </Link>
              <Link
                href="/try"
                className="inline-flex items-center rounded-full border border-cream-300 bg-white px-5 py-3 text-sm font-medium text-ink hover:bg-cream-50"
              >
                Try a sample · no signup
              </Link>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              No credit card required · Built with teachers · Ontario curriculum first
            </p>
          </div>

          <aside className="rounded-2xl border border-cream-300 bg-white p-6 shadow-lift">
            <h2 className="font-serif text-xl text-ink">A 5-minute snapshot</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Tell us about your child. We'll show you what to focus on first.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              <li>1. Create a private child profile</li>
              <li>2. Paste a report card sentence or upload a worksheet</li>
              <li>3. Get a 9-section plan you can act on tonight</li>
            </ul>
            <Link
              href="/children/new"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-forest-500 px-4 py-3 text-sm font-semibold text-white hover:bg-forest-600"
            >
              Start free
            </Link>
          </aside>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mt-20 border-y border-cream-300 bg-cream-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="mx-auto mb-10 max-w-2xl text-center">
            <span className="inline-block rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-forest-600">
              How it works
            </span>
            <h2 className="mt-3 font-serif text-3xl text-ink">
              From <em className="text-forest-500">chaos</em> to confident in three steps
            </h2>
          </header>

          <ol className="grid gap-5 md:grid-cols-3">
            <Step n="01" title="Tell us about your child">
              Nickname, grade, what's going well, what isn't. We never ask for
              full names, school names, or student numbers.
            </Step>
            <Step n="02" title="Share what's happening">
              Paste a report card sentence, describe the homework battle, or
              upload a worksheet. We show a privacy reminder before any upload.
            </Step>
            <Step n="03" title="Get a clear plan">
              Top 3 priorities, simple instructions, a short worksheet, an
              answer key, and what to do next session.
            </Step>
          </ol>
        </div>
      </section>

      {/* WHAT YOU CAN UPLOAD */}
      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-forest-600">
              What parents can share
            </span>
            <h2 className="mt-3 font-serif text-3xl text-ink">Bring whatever you have.</h2>
            <p className="mt-3 max-w-prose text-ink-soft">
              You don't need to be a teacher to use this. Any of the things you
              already have at home is enough to get started.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              "Report card comments",
              "Homework worksheets",
              "A photo of an assignment",
              "Writing samples",
              "Teacher notes",
              "Just a description of what's tricky",
            ].map((t) => (
              <li
                key={t}
                className="rounded-xl border border-cream-300 bg-white p-4 text-sm text-ink shadow-card"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PRIVACY */}
      <section id="privacy" className="border-y border-cream-300 bg-cream-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="inline-block rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-forest-600">
            Our promise
          </span>
          <h2 className="mt-3 font-serif text-3xl text-ink">
            Your child's information stays your child's.
          </h2>
          <ul className="mx-auto mt-6 grid max-w-xl gap-3 text-left text-sm text-ink-soft">
            <li>· No full names, no school names, no student numbers stored.</li>
            <li>· Uploaded files are deleted after analysis unless you opt in to keep them.</li>
            <li>· We never use your data to train AI models.</li>
            <li>· Row-level security: only you can see your children's data.</li>
          </ul>
          <p className="mt-6 text-sm">
            <Link href="/PRIVACY.md" className="text-forest-500 underline">Read the privacy promise</Link>
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="mx-auto mb-10 max-w-2xl text-center">
            <span className="inline-block rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-forest-600">
              Pricing
            </span>
            <h2 className="mt-3 font-serif text-3xl text-ink">
              Simple pricing, <em className="text-forest-500">no surprises.</em>
            </h2>
            <p className="mt-2 text-ink-soft">Start free. Cancel any time.</p>
          </header>
          <PricingCards />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest-500 py-16 text-center text-cream-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="font-serif text-3xl">
            Five minutes a day. <em>A whole different week.</em>
          </h2>
          <Link
            href="/children/new"
            className="mt-6 inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-forest-600 hover:bg-cream-100"
          >
            Start child profile
          </Link>
        </div>
      </section>
    </>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-2xl border border-cream-300 bg-white p-6 shadow-card">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 font-serif text-forest-600">
        {n}
      </span>
      <h3 className="mt-3 font-serif text-lg text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{children}</p>
    </li>
  );
}
