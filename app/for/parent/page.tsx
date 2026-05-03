import Link from "next/link";
import { selectRole } from "@/lib/actions/role";

export const metadata = {
  title: "For parents · AI Pocket Tutor",
  description:
    "Turn report card comments and tricky homework into a clear plan you can use tonight at the kitchen table.",
};

export default function ForParentPage() {
  return (
    <>
      <section className="px-4 pt-12 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-forest-600">
            For parents
          </span>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            Your child goes to school. <em className="text-forest-500">You want to help at home.</em>
          </h1>
          <p className="mt-4 text-ink-soft">
            You are not their teacher — and you don&apos;t need to be. Pocket
            Tutor reads what school sends home and tells you, in plain English,
            what to focus on tonight and how to do it without a fight.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={selectRole}>
              <input type="hidden" name="role" value="parent" />
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-forest-500 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-forest-600"
              >
                Start a child profile
              </button>
            </form>
            <Link
              href="/try"
              className="inline-flex items-center rounded-full border border-cream-300 bg-white px-5 py-3 text-sm font-medium text-ink hover:bg-cream-50"
            >
              Try a sample · no signup
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-16 border-y border-cream-300 bg-cream-50 py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-serif text-2xl text-ink">This is for you if…</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "The report card said something vague and you don't know what to do with it.",
              "Homework turns into a 9pm meltdown — yours or theirs.",
              "You feel a step behind what's being taught at school.",
              "You want to help, but you don't want to overteach or step on the teacher's plan.",
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
              How it works <em className="text-forest-500">for parents</em>
            </h2>
            <p className="mt-2 text-ink-soft">
              Five short steps. Built around a kid who already has a school day.
            </p>
          </header>

          <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Step n="01" title="Input — what school sent home">
              Paste a report card line, the worksheet that came home, or just
              describe what&apos;s tricky. No need for a teacher&apos;s vocabulary.
            </Step>
            <Step n="02" title="Analyze — what's actually being asked">
              We translate edu-jargon into the real skill underneath, and find
              where your child is stuck in the progression.
            </Step>
            <Step n="03" title="Teach — a 10-minute kitchen-table script">
              Exact words to say, an example to model, and a question to ask.
              No prep, no printing, no lesson plan.
            </Step>
            <Step n="04" title="Worksheet — short and low-stakes">
              5–8 questions labelled Easy / Medium / Hard, plus an answer key.
              Designed for after-school energy, not homeschool stamina.
            </Step>
            <Step n="05" title="Track — trends, not grades">
              Quietly notes what&apos;s clicking and what isn&apos;t, so the next
              session picks up where the last one left off.
            </Step>
          </ol>
        </div>
      </section>

      <section className="border-y border-cream-300 bg-cream-50 py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-serif text-2xl text-ink">A real example</h2>
          <div className="mt-5 rounded-2xl border border-cream-300 bg-white p-6 shadow-card">
            <p className="text-sm text-ink-muted">Report card said:</p>
            <p className="mt-1 font-serif text-lg text-ink">
              &ldquo;Aaliyah is developing her ability to decode unfamiliar
              words and would benefit from continued practice.&rdquo;
            </p>
            <p className="mt-4 text-sm text-ink-muted">Pocket Tutor says:</p>
            <ul className="mt-1 list-inside list-disc text-sm text-ink-soft">
              <li>She likely needs work on <strong>vowel teams</strong> (ai, ee, oa).</li>
              <li>Spend 10 minutes tonight on a sound drill, then 6 short words.</li>
              <li>Don&apos;t move to comprehension yet — decoding first.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-serif text-2xl text-ink">It adapts to your child</h2>
          <p className="mt-2 text-ink-soft">
            If you tell us your child has ADHD, dyslexia, or anxiety, we adjust:
            shorter tasks, more repetition, or easier wins first. We never
            diagnose — we just make the plan kinder.
          </p>
        </div>
      </section>

      <section className="bg-forest-500 py-14 text-center text-cream-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="font-serif text-3xl">Ten minutes tonight beats an hour of arguing.</h2>
          <form action={selectRole} className="mt-6 inline-block">
            <input type="hidden" name="role" value="parent" />
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-forest-600 hover:bg-cream-100"
            >
              Start child profile
            </button>
          </form>
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
