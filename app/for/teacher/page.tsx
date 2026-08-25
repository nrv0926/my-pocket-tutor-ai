import Link from "next/link";
import { selectRole } from "@/lib/actions/role";

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
          <span className="inline-block rounded-full bg-pop-cyan px-3 py-1 text-xs font-semibold uppercase tracking-widest text-pop-magenta">
            For teachers
          </span>
          <h1 className="mt-4 font-display text-4xl leading-tight text-pop-night sm:text-5xl">
            One student keeps getting stuck. <em className="text-pop-magenta">Here&apos;s tomorrow&apos;s plan.</em>
          </h1>
          <p className="mt-4 text-pop-night/80">
            Drop in a student&apos;s work or a small-group misconception. Get a
            named skill, a 10-minute mini-lesson you can run before the rotation
            bell, and a differentiated worksheet. Built for the realities of a
            classroom — not a perfect lab.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={selectRole}>
              <input type="hidden" name="role" value="teacher" />
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-pop-pink px-5 py-3 text-sm font-semibold text-pop-night shadow hover:bg-pop-yellow"
              >
                Start a student profile
              </button>
            </form>
            <Link
              href="/try/teacher"
              className="inline-flex items-center rounded-full border-[3px] border-pop-night bg-white px-5 py-3 text-sm font-medium text-pop-night hover:bg-pop-cream"
            >
              Try a sample · no signup
            </Link>
          </div>
          <p className="mt-3 text-xs text-pop-night/60">
            Designed around one student at a time. Whole-class dashboards are on the roadmap, not in the MVP.
          </p>
        </div>
      </section>

      <section className="mt-16 border-y-[3px] border-pop-night bg-pop-cream py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-2xl text-pop-night">This is for you if…</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "You have one or two students who keep missing the same thing.",
              "You want a fast read on a misconception without a full assessment.",
              "You want a short, classroom-realistic mini-lesson — not a 40-minute plan.",
              "You want a one-pager families can take home that matches what you taught.",
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
              How it works <em className="text-pop-magenta">for teachers</em>
            </h2>
            <p className="mt-2 text-pop-night/80">
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

      <section className="border-y-[3px] border-pop-night bg-pop-cream py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-2xl text-pop-night">A real example</h2>
          <div className="mt-5 rounded-2xl border-[3px] border-pop-night bg-white p-6 shadow-pop-sm">
            <p className="text-sm text-pop-night/60">You shared:</p>
            <p className="mt-1 font-display text-lg text-pop-night">
              &ldquo;Grade 4. Three students keep writing 23 + 18 = 311. They&apos;re
              stacking the digits but not regrouping.&rdquo;
            </p>
            <p className="mt-4 text-sm text-pop-night/60">Pocket Tutor says:</p>
            <ul className="mt-1 list-inside list-disc text-sm text-pop-night/80">
              <li>Skill: <strong>regrouping in the ones place</strong> (place-value gap).</li>
              <li>10-min mini-lesson with base-10 blocks → quick whiteboard check.</li>
              <li>Differentiated worksheet: 3 Easy, 3 Medium, 2 Hard.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-2xl text-pop-night">Privacy you can defend to a parent</h2>
          <ul className="mt-3 grid gap-2 text-sm text-pop-night/80">
            <li>· No full names, school names, or student numbers stored.</li>
            <li>· Uploaded files deleted after analysis unless you opt in to keep them.</li>
            <li>· Student data is never used to train AI models.</li>
            <li>· Your account, your data — row-level security by default.</li>
          </ul>
        </div>
      </section>

      <section className="bg-pop-pink py-14 text-center text-pop-night">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="font-display text-3xl">Tomorrow&apos;s small-group plan, in three minutes.</h2>
          <form action={selectRole} className="mt-6 inline-block">
            <input type="hidden" name="role" value="teacher" />
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-pop-magenta hover:bg-pop-cream"
            >
              Start student profile
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
