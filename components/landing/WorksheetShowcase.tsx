import { SectionSub, SectionTag, SectionTitle } from "./SectionTag";

export default function WorksheetShowcase() {
  return (
    <section className="bg-teal-700 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionTag tone="dark">Practice that gets done</SectionTag>
        <SectionTitle tone="dark">
          Two ways to practise.
          <br />
          One clear result.
        </SectionTitle>
        <SectionSub tone="dark">
          Every plan comes with a printable worksheet. Premium members also get
          an interactive version their child works through on screen &mdash;
          with instant feedback after every question.
        </SectionSub>

        <div className="mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
          <PrintableCard />
          <InteractiveCard />
        </div>
      </div>
    </section>
  );
}

function PrintableCard() {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-7">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-white/75">📄 Printable worksheet</span>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/55">
          Free &amp; Premium
        </span>
      </div>

      <div className="rounded-xl bg-white p-5">
        <p className="text-xs font-semibold text-forest-600">Blend the sounds</p>
        <p className="mb-3 text-[11px] text-ink-muted">Say each sound. Then read the word.</p>
        {["c · a · t →", "b · a · t →", "m · a · p →"].map((q, i) => (
          <div key={q} className="mb-2 flex items-center gap-2.5 text-[13px] text-ink">
            <span className="font-medium text-forest-500">{i + 1}.</span>
            <span>{q}</span>
            <span className="flex-1 border-b border-cream-300" />
          </div>
        ))}
        <p className="mt-2.5 text-[11px] text-[#9DB5A0]">
          + 5 more questions · Answer key included
        </p>
      </div>

      <p className="text-[13px] font-light leading-relaxed text-white/55">
        Print at home and sit down together. A clean, simple sheet that follows
        the Science of Reading structure &mdash; sound drill, blend, word,
        sentence.
      </p>
    </article>
  );
}

function InteractiveCard() {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border-[1.5px] border-forest-400/30 bg-forest-400/10 p-7">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-white/75">🎮 Interactive practice</span>
        <span className="rounded-full bg-gradient-to-br from-forest-500 to-teal-400 px-2.5 py-1 text-[11px] font-medium text-white">
          Premium
        </span>
      </div>

      <div className="rounded-xl border border-white/10 bg-navy p-5">
        <p className="text-[10px] text-white/35">Question 2 of 8</p>
        <p className="mt-1 text-[13px] font-medium text-white">
          What word do these sounds make?
        </p>
        <div className="mt-3.5 flex justify-center gap-2">
          {["b", "a", "t"].map((l) => (
            <div
              key={l}
              className="rounded-md bg-white/10 px-4 py-2.5 text-2xl font-medium text-white"
            >
              {l}
            </div>
          ))}
        </div>
        <div className="mt-3.5 grid grid-cols-2 gap-1.5">
          <Opt correct>bat ✓</Opt>
          <Opt>bit</Opt>
          <Opt>but</Opt>
          <Opt>bet</Opt>
        </div>
        <p className="mt-2.5 text-center text-xs text-forest-400">🎉 Correct! Great job.</p>
      </div>

      <p className="text-[13px] font-light leading-relaxed text-white/55">
        Your child works through questions on screen and gets instant feedback.
        Their score is saved automatically &mdash; so you can both track
        what&rsquo;s improving.
      </p>
    </article>
  );
}

function Opt({ correct, children }: { correct?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={[
        "rounded-md p-2 text-center text-[13px]",
        correct ? "bg-[#1D9E75] font-medium text-white" : "bg-white/5 text-white/40",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
