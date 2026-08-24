import Link from "next/link";
import { selectRole } from "@/lib/actions/role";

export const metadata = {
  title: "For homeschoolers · AI Pocket Tutor",
  description:
    "A scope-and-sequence-aware planning partner: where your child is in the progression, what to teach next, and a full mini-lesson to teach it.",
};

export default function ForHomeschoolerPage() {
  return (
    <>
      <section className="px-4 pt-12 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-pop-cyan px-3 py-1 text-xs font-semibold uppercase tracking-widest text-pop-magenta">
            For homeschoolers
          </span>
          <h1 className="mt-4 font-display text-4xl leading-tight text-pop-night sm:text-5xl">
            You are the teacher. <em className="text-pop-magenta">Pocket Tutor is your planner.</em>
          </h1>
          <p className="mt-4 text-pop-night/80">
            Tell us where your child is in the progression and what they did
            this week. We&apos;ll tell you exactly where to go next — and give
            you the mini-lesson, practice set, and answer key to teach it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={selectRole}>
              <input type="hidden" name="role" value="homeschooler" />
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
              "You're juggling more than one kid and more than one subject.",
              "You're confident teaching, but tired of writing daily lesson plans.",
              "You want a clear scope-and-sequence — not a black-box curriculum.",
              "You want to keep your own pace, not follow a rigid weekly schedule.",
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
              How it works <em className="text-pop-magenta">for homeschoolers</em>
            </h2>
            <p className="mt-2 text-pop-night/80">
              Built for the person planning the lesson, not just supplementing it.
            </p>
          </header>

          <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Step n="01" title="Input — your unit + a recent sample">
              Tell us the unit you&apos;re on (or paste your scope-and-sequence)
              and share a sample of this week&apos;s work. The more we know,
              the sharper the next step.
            </Step>
            <Step n="02" title="Analyze — exact spot in the progression">
              Phonics: CVC → digraphs → blends → silent e → vowel teams →
              r-controlled → multisyllabic. Math: place value, then operations,
              then word problems. We pin the spot, never skip.
            </Step>
            <Step n="03" title="Teach — full mini-lesson, not just a tip">
              Model → guided practice → independent practice. Includes the
              exact words to say, examples, and the misconception to watch for.
            </Step>
            <Step n="04" title="Worksheet — usable as the day's work">
              Differentiated Easy / Medium / Hard, with an answer key. Print
              it, or read it aloud. Aimed at homeschool stamina, not just a
              quick after-school check.
            </Step>
            <Step n="05" title="Track — a skill map, not a gradebook">
              See which skills are solid, which are emerging, and what the
              very next session should cover. No grades, no comparisons.
            </Step>
          </ol>
        </div>
      </section>

      <section className="border-y-[3px] border-pop-night bg-pop-cream py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-2xl text-pop-night">A real example</h2>
          <div className="mt-5 rounded-2xl border-[3px] border-pop-night bg-white p-6 shadow-pop-sm">
            <p className="text-sm text-pop-night/60">You said:</p>
            <p className="mt-1 font-display text-lg text-pop-night">
              &ldquo;Grade 2. Finished CVC and digraphs. He keeps adding
              an &lsquo;e&rsquo; to short words like <em>cat</em>.&rdquo;
            </p>
            <p className="mt-4 text-sm text-pop-night/60">Pocket Tutor says:</p>
            <ul className="mt-1 list-inside list-disc text-sm text-pop-night/80">
              <li>He&apos;s overgeneralizing silent <em>e</em>. Don&apos;t move forward yet.</li>
              <li>Spend 2–3 days contrasting <em>cap/cape</em>, <em>tap/tape</em>.</li>
              <li>When 8/10 are right two days in a row, move to vowel teams.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-2xl text-pop-night">Curriculum, not just content</h2>
          <p className="mt-2 text-pop-night/80">
            Defaults to Ontario K–6 unless your profile says otherwise. Reading
            follows the science of reading order: phonemic awareness → phonics
            → fluency → vocabulary → comprehension. K–3 lessons follow a
            UFLI-style structure (sound drill → blend → word → sentence →
            dictation).
          </p>
        </div>
      </section>

      <section className="bg-pop-pink py-14 text-center text-pop-night">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="font-display text-3xl">Plan less. Teach more.</h2>
          <form action={selectRole} className="mt-6 inline-block">
            <input type="hidden" name="role" value="homeschooler" />
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
