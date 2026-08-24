import Link from "next/link";

export function PopButton({
  href,
  children,
  tone = "pink",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "pink" | "yellow" | "cyan" | "night" | "cream";
  className?: string;
}) {
  const tones = {
    pink: "bg-pop-pink text-pop-night",
    yellow: "bg-pop-yellow text-pop-night",
    cyan: "bg-pop-cyan text-pop-night",
    night: "bg-pop-night text-pop-cream",
    cream: "bg-pop-cream text-pop-night",
  };
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full border-[3px] border-pop-night px-6 py-3 font-display text-sm uppercase tracking-wide shadow-pop transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pop-sm ${tones[tone]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Sticker({
  children,
  tone = "yellow",
  rotate = "-2deg",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "pink" | "yellow" | "cyan" | "lime" | "sky" | "grape" | "tangerine";
  rotate?: string;
  className?: string;
}) {
  const tones = {
    pink: "bg-pop-pink text-pop-night",
    yellow: "bg-pop-yellow text-pop-night",
    cyan: "bg-pop-cyan text-pop-night",
    lime: "bg-pop-lime text-pop-night",
    sky: "bg-pop-sky text-pop-night",
    grape: "bg-pop-grape text-white",
    tangerine: "bg-pop-tangerine text-pop-night",
  };
  return (
    <span
      style={{ transform: `rotate(${rotate})` }}
      className={`inline-block rounded-full border-[3px] border-pop-night px-4 py-2 font-display text-xs uppercase tracking-wide shadow-pop-sm ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function PopCard({
  children,
  tone = "cream",
  rotate = "0deg",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "pink" | "yellow" | "cyan" | "lime" | "sky" | "grape" | "cream";
  rotate?: string;
  className?: string;
}) {
  const tones = {
    pink: "bg-pop-pink text-pop-night",
    yellow: "bg-pop-yellow text-pop-night",
    cyan: "bg-pop-cyan text-pop-night",
    lime: "bg-pop-lime text-pop-night",
    sky: "bg-pop-sky text-pop-night",
    grape: "bg-pop-grape text-white",
    cream: "bg-pop-cream text-pop-night",
  };
  return (
    <div
      style={{ transform: `rotate(${rotate})` }}
      className={`rounded-2xl border-[3px] border-pop-night p-6 shadow-pop ${tones[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

export function Marquee({ items, tone = "pink" }: { items: string[]; tone?: "pink" | "cyan" | "yellow" }) {
  const tones = {
    pink: "bg-pop-pink text-pop-night",
    cyan: "bg-pop-cyan text-pop-night",
    yellow: "bg-pop-yellow text-pop-night",
  };
  const run = [...items, ...items, ...items];
  return (
    <div
      className={`overflow-hidden border-y-[3px] border-pop-night py-3 print:hidden ${tones[tone]}`}
      aria-hidden
    >
      <div className="marquee flex w-max gap-10 whitespace-nowrap font-display text-sm uppercase tracking-widest">
        {run.map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            {t}
            <Star />
          </span>
        ))}
      </div>
    </div>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
      <path d="M12 0l2.6 8.2H23l-6.8 5 2.6 8.2-6.8-5-6.8 5 2.6-8.2-6.8-5h8.4z" />
    </svg>
  );
}

export function Squiggle({ className = "", color = "#14100f" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 120 24" className={`${className} print:hidden`} fill="none" aria-hidden>
      <path
        d="M2 12c8-10 16 10 24 0s16 10 24 0 16 10 24 0 16 10 24 0"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Blob({ className = "", color }: { className?: string; color: string }) {
  return (
    <svg viewBox="0 0 200 200" className={`${className} print:hidden`} aria-hidden>
      <path
        fill={color}
        d="M45.7 -58.5C58.9 -47.9 68.5 -33.1 72.6 -16.8C76.7 -0.5 75.3 17.4 67.2 31.6C59.1 45.8 44.3 56.4 28.4 62.6C12.5 68.8 -4.5 70.7 -20.8 66.6C-37.1 62.5 -52.7 52.4 -62.2 38.1C-71.7 23.8 -75.1 5.3 -71.6 -11.4C-68.1 -28.1 -57.7 -43 -44.2 -53.7C-30.7 -64.4 -14.1 -70.9 1.9 -73.2C17.9 -75.5 32.5 -69.1 45.7 -58.5Z"
        transform="translate(100 100)"
      />
    </svg>
  );
}
