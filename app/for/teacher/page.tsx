import Link from "next/link";

export const metadata = {
  title: "For teachers · AI Pocket Tutor",
  description:
    "A quiet co-pilot for one student or a small group: pinpoint the misconception, get a 10-minute mini-lesson, and a differentiated practice page.",
};

export default function ForTeacherPage() {
  return (
    <>
      <section className="px-4 pt-12 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-forest-600">
            For teachers
          </span>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            One student keeps getting stuck. <em className="text-forest-500">Here&apos;s tomorrow&apos;s plan.</em>
          </h1>
          <p className="mt-4 text-ink-soft">
            Drop in a student&apos;s work or a small-group misconception. Get a
            named skill, a 10-minute mini-lesson you can run before the rotation
            bell, and a differentiated worksheet. Built for the realities of a
            classroom — not a perfect lab.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/children/new"
              className="inline-flex items-center rounded-full bg-forest-500 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-forest-600"
            >
              Start a student profile
            </Link>
            <Link
              href="/try"
              className="inline-flex items-center rounded-full border border-cream-300 bg-white px-5 py-3 text-sm font-medium text-ink hover:bg-cream-50"
            >
              Try a sample · no signup
            </Link>
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Designed around one student at a time. Whole-class dashboards are on the roadmap, not in the MVP.
          </p>
        </div>
      </section>

      <section className="mt-16 border-y border-cream-300 bg-cream-50 py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-serif text-2xl text-ink">This is for you if…</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "You have one or two students who keep missing the same thing.",
              "You want a fast read on a misconception without a full assessment.",
              "You want a short, classroom-realistic mini-lesson — not a 40-minute plan.",
              "You want a one-pager families can take home that matches what you taught.",
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

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <header className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="font-serif text-3xl text-ink">
              How it works <em className="text-forest-500">for teachers</em>
            </h2>
            <p className="mt-2 text-ink-soft">
              The same five verbs — sized for a classroom rotation, not a kitchen table.
            </p>
          </header>

          <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Step n="01" title="Input — one piece of student work">
              Snap a worksheet, paste a sentence from a writing sample, or
              describe the pattern you keep seeing in small group.
            </Step>
            <Step n="02" title="Analyze — the misconception, named">
              We name the specific skill in the curriculum (Ontario default,
              tunable per profile) and pin where the student is in the
              progression.
            </Step>
            <Step n="03" title="Teach — a 10-minute mini-lesson">
              Tight enough to run during a rotation. Includes the model, the
              guided question, and the most common error to watch for.
            </Step>
            <Step n="04" title="Worksheet — differentiated, classroom-ready">
              5–8 questions labelled Easy / Medium / Hard, with an answer key.
              Print it for the student or use it as a quick exit ticket.
            </Step>
            <Step n="05" title="Track — private notes per student">
              Each student profile is private to your account. Row-level
              security means no admin, no district, no one else can see them
              without your sign-off.
            </Step>
          </ol>
        </div>
      </section>

      <section className="border-y border-cream-300 bg-cream-50 py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-serif text-2xl text-ink">A real example</h2>
          <div className="mt-5 rounded-2xl border border-cream-300 bg-white p-6 shadow-card">
            <p className="text-sm text-ink-muted">You shared:</p>
            <p className="mt-1 font-serif text-lg text-ink">
              &ldquo;Grade 4. Three students keep writing 23 + 18 = 311. They&apos;re
              stacking the digits but not regrouping.&rdquo;
            </p>
            <p className="mt-4 text-sm text-ink-muted">Pocket Tutor says:</p>
            <ul className="mt-1 list-inside list-disc text-sm text-ink-soft">
              <li>Skill: <strong>regrouping in the ones place</strong> (place-value gap).</li>
              <li>10-min mini-lesson with base-10 blocks → quick whiteboard check.</li>
              <li>Differentiated worksheet: 3 Easy, 3 Medium, 2 Hard.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-serif text-2xl text-ink">Privacy you can defend to a parent</h2>
          <ul className="mt-3 grid gap-2 text-sm text-ink-soft">
            <li>· No full names, school names, or student numbers stored.</li>
            <li>· Uploaded files deleted after analysis unless you opt in to keep them.</li>
            <li>· Student data is never used to train AI models.</li>
            <li>· Your account, your data — row-level security by default.</li>
          </ul>
        </div>
      </section>

      <section className="bg-forest-500 py-14 text-center text-cream-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="font-serif text-3xl">Tomorrow&apos;s small-group plan, in three minutes.</h2>
          <Link
            href="/children/new"
            className="mt-6 inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-forest-600 hover:bg-cream-100"
          >
            Start student profile
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
