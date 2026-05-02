import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-[88vh] overflow-hidden bg-gradient-to-br from-cream-50 from-50% to-forest-50">
      <div className="pointer-events-none absolute -right-20 -top-20 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(82,183,136,0.10),transparent_70%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-forest-100 bg-forest-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-forest-500">
            ✦ Ontario curriculum aligned · K&ndash;Grade 3
          </span>
          <h1 className="font-serif text-4xl font-semibold leading-[1.15] text-forest-600 sm:text-5xl md:text-[52px]">
            The clearest path from struggle to{" "}
            <em className="font-serif italic text-teal-400">progress.</em>
          </h1>
          <p className="max-w-md text-lg font-light leading-relaxed text-ink-soft">
            Clear plans. Focused practice. Real results &mdash; starting tonight.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            Built for
            <ModePill icon="👨‍👩‍👧">Parents</ModePill>
            <ModePill icon="🏠">Homeschoolers</ModePill>
            <ModePill icon="🍎">Teachers</ModePill>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="#who"
              className="inline-flex items-center rounded-xl bg-forest-500 px-6 py-3 text-sm font-medium text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-forest-600"
            >
              Find your plan ↗
            </Link>
            <Link
              href="#how"
              className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-forest-500 px-5 py-3 text-sm font-medium text-forest-500 transition hover:bg-forest-50"
            >
              See how it works →
            </Link>
          </div>
          <div className="flex flex-wrap gap-5 pt-2 text-[13px] text-ink-muted">
            <Trust>Ontario aligned</Trust>
            <Trust>10–15 min daily plans</Trust>
            <Trust>Data never stored</Trust>
            <Trust>Science of Reading</Trust>
          </div>
        </div>

        <div className="relative hidden items-center justify-center md:flex">
          <PhoneMock />
        </div>
      </div>
    </section>
  );
}

function ModePill({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-cream-300 bg-white px-2.5 py-1 text-xs font-medium text-ink-soft">
      <span aria-hidden>{icon}</span> {children}
    </span>
  );
}

function Trust({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="grid h-4 w-4 place-items-center rounded-full border border-forest-100 bg-forest-50 text-[8px] text-forest-500">
        ✓
      </span>
      {children}
    </span>
  );
}

function PhoneMock() {
  return (
    <div className="relative">
      <FloatCard className="-left-16 top-[28%] animate-floaty [animation-delay:.4s]">
        <div className="text-[10px] text-ink-muted">Skill gap found</div>
        <div className="font-medium text-forest-600">CVC Blending 📚</div>
      </FloatCard>

      <div className="relative z-10 w-64 rounded-[30px] bg-navy px-4 py-5 shadow-[0_28px_72px_rgba(27,61,75,.38),0_0_0_1px_rgba(255,255,255,.07)]">
        <div className="mx-auto mb-3.5 h-[5px] w-[72px] rounded-[3px] bg-white/10" />
        <span className="mb-2 inline-block rounded-[10px] bg-forest-400/20 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-forest-400">
          Parent mode
        </span>
        <div className="text-[13px] font-medium text-white/90">Good morning, Sarah 🌟</div>
        <div className="mb-3 text-[11px] text-white/40">Let&rsquo;s help Alex learn today.</div>
        <div className="mb-3 rounded-[11px] bg-forest-500 p-3">
          <div className="text-[9px] text-white/65">Today&rsquo;s focus · 10–15 min</div>
          <div className="mb-2 text-sm font-medium text-white">Phonics – Blending</div>
          <span className="inline-block rounded-md bg-forest-400 px-3 py-1 text-[10px] font-medium text-white">
            Start session →
          </span>
        </div>
        <div className="mb-2 text-[10px] text-white/40">Progress overview</div>
        <div className="grid grid-cols-3 gap-1.5">
          <PStat n="3" label="Skills practiced" />
          <PStat n="2" label="Skills mastered" />
          <PStat n="1" label="Needs more" warn />
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-7 left-1/2 z-0 h-44 w-44 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(82,183,136,.25),transparent_70%)]" />

      <FloatCard className="-right-14 top-[56%] animate-floaty">
        <div className="text-[10px] text-ink-muted">Plan ready</div>
        <div className="font-medium text-forest-600">Step-by-step guide ✅</div>
      </FloatCard>
    </div>
  );
}

function FloatCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={[
        "absolute z-20 whitespace-nowrap rounded-[11px] border border-cream-300 bg-white px-3 py-2 text-xs text-ink shadow-[0_6px_24px_rgba(27,77,62,.15)]",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function PStat({ n, label, warn }: { n: string; label: string; warn?: boolean }) {
  return (
    <div className="rounded-md bg-white/5 p-1.5 text-center">
      <span
        className={[
          "block text-[17px] font-medium",
          warn ? "text-[#F4A261]" : "text-forest-400",
        ].join(" ")}
      >
        {n}
      </span>
      <span className="text-[8px] leading-tight text-white/40">{label}</span>
    </div>
  );
}
