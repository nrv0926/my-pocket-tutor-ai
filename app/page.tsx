import Link from "next/link";
import { Blob, Marquee, PopButton, PopCard, Squiggle, Sticker } from "@/components/pop/PopBits";
import { HomeFaq } from "@/components/pop/HomeFaq";

const STEPS = [
  {
    n: "01",
    tone: "yellow" as const,
    rotate: "-2deg",
    title: "Tell us about your child",
    body: "Nickname, grade, and what's been hard. Never their real name — we don't have a box for it.",
  },
  {
    n: "02",
    tone: "cyan" as const,
    rotate: "1.5deg",
    title: "Share what you've got",
    body: "A report card sentence. A worksheet that went badly. Or just what you're worried about.",
  },
  {
    n: "03",
    tone: "pink" as const,
    rotate: "-1deg",
    title: "Get the plan",
    body: "Nine plain-English sections: what's going on, what to teach next, and exactly how to teach it.",
  },
  {
    n: "04",
    tone: "lime" as const,
    rotate: "2deg",
    title: "Practise tonight",
    body: "A short worksheet with an answer key. Print it. Ten minutes at the kitchen table.",
  },
  {
    n: "05",
    tone: "sky" as const,
    rotate: "-1.5deg",
    title: "Say how it went",
    body: "Too easy, just right, or too hard. The next plan adjusts. That's the whole loop.",
  },
];

const SUBJECTS = ["Reading", "Phonics", "Writing", "Math", "Spelling", "Comprehension", "Fluency"];

const PROMISES = [
  { text: "No child's real name", tone: "pink" as const, rotate: "-3deg" },
  { text: "Ontario curriculum", tone: "cyan" as const, rotate: "2deg" },
  { text: "Built with teachers", tone: "yellow" as const, rotate: "-1deg" },
  { text: "Never sold, never trained on", tone: "lime" as const, rotate: "3deg" },
  { text: "No credit card to start", tone: "tangerine" as const, rotate: "-2deg" },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-pop-yellow">
        <Blob className="absolute -left-24 -top-20 h-80 w-80 opacity-40" color="#ff3d8b" />
        <Blob className="absolute -bottom-32 -right-16 h-96 w-96 opacity-30" color="#3fe0d0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Sticker tone="pink" rotate="-3deg">For parents &amp; teachers · K–8</Sticker>
            <h1 className="mt-6 font-display text-5xl uppercase leading-[0.95] text-pop-night sm:text-6xl">
              Know exactly how to help your kid
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-pop-night/80">
              Paste one line from a report card. Get back a plan you can
              actually do tonight — what to teach, how to teach it, and a
              worksheet to practise with.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <PopButton href="/children/new" tone="night">Start a child profile</PopButton>
              <PopButton href="/try" tone="cream">See a sample plan →</PopButton>
            </div>
            <p className="mt-5 font-display text-xs uppercase tracking-widest text-pop-night/70">
              No credit card · Free to try
            </p>
          </div>
          <HeroPreview />
        </div>
      </section>

      <Marquee
        tone="pink"
        items={["9-section plan", "Ready in 60 seconds", "Ontario curriculum", "Science of reading"]}
      />

      <section id="how" className="bg-pop-cream py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center text-center">
            <Sticker tone="cyan" rotate="2deg">How it works</Sticker>
            <h2 className="mt-5 font-display text-4xl uppercase leading-none tracking-tight text-pop-night sm:text-5xl">
              Five steps. Ten minutes.
            </h2>
            <Squiggle className="mt-5 h-6 w-40" color="#ff3d8b" />
          </div>
          <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => (
              <PopCard key={s.n} tone={s.tone} rotate={s.rotate}>
                <span className="font-display text-4xl">{s.n}</span>
                <h3 className="mt-3 font-display text-xl uppercase leading-tight">{s.title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed">{s.body}</p>
              </PopCard>
            ))}
            <PopCard tone="cream" rotate="1deg" className="flex flex-col justify-center text-center">
              <p className="font-display text-xl uppercase leading-tight">Want to see one first?</p>
              <p className="mt-2 text-sm font-medium">A real sample plan. No signup.</p>
              <PopButton href="/try" tone="pink" className="mt-5">Try a sample</PopButton>
            </PopCard>
          </div>
        </div>
      </section>

      <section className="bg-pop-magenta py-20 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-white/80">
            Bring us anything
          </p>
          <div className="mt-8 space-y-1">
            {SUBJECTS.map((s) => (
              <p
                key={s}
                className="font-display text-[clamp(1.75rem,8vw,3.75rem)] uppercase leading-tight tracking-tight text-white"
              >
                {s}
              </p>
            ))}
            <p className="pt-2 font-display text-[clamp(1.75rem,8vw,3.75rem)] uppercase leading-tight tracking-tight text-pop-yellow">
              and more!
            </p>
          </div>
        </div>
      </section>

      <section id="who" className="bg-pop-grape py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center font-display text-4xl uppercase leading-none tracking-tight text-white sm:text-5xl">
            Pick your corner
          </h2>
          <div className="mt-12 grid gap-7 md:grid-cols-3">
            <RoleCard
              href="/for/parent"
              tone="yellow"
              rotate="-2deg"
              label="Parents"
              body="Translate the report card, defuse homework, and get a 10-minute plan for tonight."
            />
            <RoleCard
              href="/for/homeschooler"
              tone="cyan"
              rotate="1.5deg"
              label="Homeschoolers"
              body="Full mini-lessons and longer practice sets, sequenced so nothing gets skipped."
            />
            <RoleCard
              href="/for/teacher"
              tone="lime"
              rotate="-1deg"
              label="Teachers"
              body="Sized for a 10-minute rotation. One student, one skill, one page."
            />
          </div>
        </div>
      </section>

      <section id="privacy" className="relative overflow-hidden bg-pop-cyan py-20">
        <Blob className="absolute -right-24 top-0 h-72 w-72 opacity-30" color="#ffd93d" />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <Sticker tone="grape" rotate="-2deg">Why trust us</Sticker>
          <h2 className="mt-5 font-display text-4xl uppercase leading-none tracking-tight text-pop-night sm:text-5xl">
            Your kid&apos;s stuff stays your kid&apos;s
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {PROMISES.map((p) => (
              <Sticker key={p.text} tone={p.tone} rotate={p.rotate}>
                {p.text}
              </Sticker>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/privacy" className="font-display text-sm uppercase tracking-widest text-pop-night underline decoration-[3px] underline-offset-4">
              Read the privacy promise
            </Link>
          </div>
        </div>
      </section>

      <Marquee tone="yellow" items={["Free to start", "Cancel any time", "No ads, ever", "No trackers"]} />

      <section className="bg-pop-cream py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center font-display text-4xl uppercase leading-none tracking-tight text-pop-night sm:text-5xl">
            Common questions
          </h2>
          <div className="mt-12">
            <HomeFaq />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-pop-night py-24 text-center">
        <Blob className="absolute -left-20 bottom-0 h-72 w-72 opacity-25" color="#ff3d8b" />
        <Blob className="absolute -right-20 top-0 h-72 w-72 opacity-25" color="#3fe0d0" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-4xl uppercase leading-none tracking-tight text-pop-cream sm:text-6xl">
            Five minutes a day.
            <span className="block text-pop-yellow">A whole different week.</span>
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <PopButton href="/children/new" tone="yellow">Start a child profile</PopButton>
            <PopButton href="/pricing" tone="cream">See pricing</PopButton>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
      <div className="absolute -right-3 -top-4 z-10">
        <Sticker tone="cyan" rotate="8deg">60 seconds</Sticker>
      </div>
      <PopCard tone="cream" rotate="2.5deg" className="shadow-pop-lg">
        <p className="font-display text-[10px] uppercase tracking-[0.2em] text-pop-magenta">
          You paste this
        </p>
        <p className="mt-2 rounded-xl border-[3px] border-pop-night bg-pop-yellow p-3 text-sm font-medium">
          &ldquo;Sam is reading below grade level and often guesses at longer
          words.&rdquo;
        </p>
        <p className="mt-5 font-display text-[10px] uppercase tracking-[0.2em] text-pop-magenta">
          You get this
        </p>
        <ul className="mt-2 space-y-2">
          {[
            "What I notice",
            "Key skill gaps",
            "What to teach next",
            "How to teach it",
            "Practice worksheet",
          ].map((s, i) => (
            <li key={s} className="flex items-center gap-3 text-sm font-semibold">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-[3px] border-pop-night bg-pop-cyan font-display text-[10px]">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
          <li className="pl-9 font-display text-[10px] uppercase tracking-widest text-pop-night/60">
            + 4 more sections
          </li>
        </ul>
      </PopCard>
    </div>
  );
}

function RoleCard({
  href,
  tone,
  rotate,
  label,
  body,
}: {
  href: string;
  tone: "yellow" | "cyan" | "lime";
  rotate: string;
  label: string;
  body: string;
}) {
  return (
    <PopCard tone={tone} rotate={rotate} className="flex flex-col">
      <h3 className="font-display text-2xl uppercase leading-none">{label}</h3>
      <p className="mt-3 flex-1 text-sm font-medium leading-relaxed">{body}</p>
      <Link
        href={href}
        className="mt-5 font-display text-xs uppercase tracking-widest underline decoration-[3px] underline-offset-4"
      >
        See how it works →
      </Link>
    </PopCard>
  );
}
