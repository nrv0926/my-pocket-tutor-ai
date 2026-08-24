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
          <span className="inline-block rounded-full bg-pop-cyan px-3 py-1 text-xs font-semibold uppercase tracking-widest text-pop-magenta">
            For parents
          </span>
          <h1 className="mt-4 font-display text-4xl leading-tight text-pop-night sm:text-5xl">
            Your child goes to school. <em className="text-pop-magenta">You want to help at home.</em>
          </h1>
          <p className="mt-4 text-pop-night/80">
            You are not their teacher — and you don&apos;t need to be. Pocket
            Tutor reads what school sends home and tells you, in plain English,
            what to focus on tonight and how to do it without a fight.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={selectRole}>
              <input type="hidden" name="role" value="parent" />
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-pop-pink px-5 py-3 text-sm font-semibold text-pop-night shadow hover:bg-pop-yellow"
              >
                Start a child profile
              </button>
            </form>
            <Link
              href="/try"
              className="inline-flex items-center rounded-full border-[3px] border-pop-night bg-white px-5 py-3 text-sm font-medium text-pop-night hover:bg-pop-cream"
            >
              Try a sample · no signup
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-16 border-y-[3px] border-pop-night bg-pop-cream py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-2xl text-pop-night">This is for you if…</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "The report card said something vague and you don't know what to do with it.",
              "Homework turns into a 9pm meltdown — yours or theirs.",
              "You feel a step behind what's being taught at school.",
              "You want to help, but you don't want to overteach or step on the teacher's plan.",
            ].map((t) => (
              <li
                key={t}
                className="rounded-xl border-[3px] border-pop-night bg-white p-4 text-sm text-pop-night shadow-pop-sm"
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
            <h2 className="font-display text-3xl text-pop-night">
              How it works <em className="text-pop-magenta">for parents</em>
            </h2>
            <p className="mt-2 text-pop-night/80">
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

      <section className="border-y-[3px] border-pop-night bg-pop-cream py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-2xl text-pop-night">A real example</h2>
          <div className="mt-5 rounded-2xl border-[3px] border-pop-night bg-white p-6 shadow-pop-sm">
            <p className="text-sm text-pop-night/60">Report card said:</p>
            <p className="mt-1 font-display text-lg text-pop-night">
              &ldquo;Aaliyah is developing her ability to decode unfamiliar
              words and would benefit from continued practice.&rdquo;
            </p>
            <p className="mt-4 text-sm text-pop-night/60">Pocket Tutor says:</p>
            <ul className="mt-1 list-inside list-disc text-sm text-pop-night/80">
              <li>She likely needs work on <strong>vowel teams</strong> (ai, ee, oa).</li>
              <li>Spend 10 minutes tonight on a sound drill, then 6 short words.</li>
              <li>Don&apos;t move to comprehension yet — decoding first.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-2xl text-pop-night">It adapts to your child</h2>
          <p className="mt-2 text-pop-night/80">
            If you tell us your child has ADHD, dyslexia, or anxiety, we adjust:
            shorter tasks, more repetition, or easier wins first. We never
            diagnose — we just make the plan kinder.
          </p>
        </div>
      </section>

      <section className="bg-pop-pink py-14 text-center text-pop-night">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="font-display text-3xl">Ten minutes tonight beats an hour of arguing.</h2>
          <form action={selectRole} className="mt-6 inline-block">
            <input type="hidden" name="role" value="parent" />
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-pop-magenta hover:bg-pop-cream"
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
    <li className="rounded-2xl border-[3px] border-pop-night bg-white p-6 shadow-pop-sm">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-pop-cyan font-display text-pop-magenta">
        {n}
      </span>
      <h3 className="mt-3 font-display text-lg text-pop-night">{title}</h3>
      <p className="mt-1 text-sm text-pop-night/80">{children}</p>
    </li>
  );
}
