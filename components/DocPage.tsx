import { Sticker } from "@/components/pop/PopBits";

export function DocPage({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b-[3px] border-pop-night bg-pop-yellow">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <Sticker tone="pink" rotate="-3deg">{eyebrow}</Sticker>
          <h1 className="mt-6 font-display text-4xl uppercase leading-[0.95] text-pop-night sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-lg font-medium leading-relaxed text-pop-night/80">{lead}</p>
        </div>
      </header>
      <div className="mx-auto max-w-3xl space-y-7 px-4 py-14 sm:px-6">{children}</div>
    </>
  );
}

const SECTION_TONES = [
  "bg-pop-cream",
  "bg-pop-cyan",
  "bg-white",
  "bg-pop-lime",
  "bg-white",
  "bg-pop-sky",
  "bg-white",
  "bg-pop-yellow",
] as const;

// Derived from the title rather than a running counter, so a section keeps
// the same colour on every render and across server/client.
function toneFor(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return SECTION_TONES[h % SECTION_TONES.length];
}

export function DocSection({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: string;
  children: React.ReactNode;
}) {
  const bg = tone ?? toneFor(title);
  return (
    <section
      className={`rounded-2xl border-[3px] border-pop-night p-6 shadow-pop ${bg}`}
    >
      <h2 className="font-display text-xl uppercase leading-tight text-pop-night">{title}</h2>
      <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-pop-night/85">
        {children}
      </div>
    </section>
  );
}

export function DocList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span
            aria-hidden
            className="mt-[6px] h-2.5 w-2.5 shrink-0 rotate-45 border-[2px] border-pop-night bg-pop-pink"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
