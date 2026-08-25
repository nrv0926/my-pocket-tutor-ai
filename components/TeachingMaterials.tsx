import type { TeachingMaterial } from "@/types/session";

/**
 * The printable half of "How to teach it".
 *
 * A step that says "write six vowel-team cards" is a prep list, not a
 * lesson. These render the cards themselves, sized to be used straight off
 * the screen or off the printer — CLAUDE.md §8 keeps MVP to a print
 * stylesheet, so every block below is styled to survive printing.
 */
export default function TeachingMaterials({ materials }: { materials: TeachingMaterial[] }) {
  if (materials.length === 0) return null;

  return (
    <div className="mt-6 space-y-5">
      <h3 className="font-display text-xs uppercase tracking-widest text-pop-night/60">
        Ready to use — no prep
      </h3>
      {materials.map((m, i) => (
        <section
          key={`${m.label}-${i}`}
          className="rounded-xl border-[3px] border-pop-night bg-pop-cream p-4 print:break-inside-avoid"
        >
          <header className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h4 className="font-display text-sm uppercase tracking-wide text-pop-night">
              {m.label}
            </h4>
            {typeof m.step === "number" && (
              <span className="rounded bg-pop-night/15 px-1.5 py-0.5 font-display text-[10px] uppercase tracking-widest text-pop-night/60">
                Step {m.step}
              </span>
            )}
          </header>
          {m.note && <p className="mb-3 text-sm font-medium text-pop-night/70">{m.note}</p>}
          <MaterialBody material={m} />
        </section>
      ))}
    </div>
  );
}

function MaterialBody({ material }: { material: TeachingMaterial }) {
  const { kind, items } = material;

  if (kind === "cards") {
    return (
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((it, i) => (
          <li
            key={i}
            className="grid min-h-[3.5rem] place-items-center rounded-lg border-[3px] border-dashed border-pop-night bg-white px-2 py-3 text-center font-display text-lg uppercase text-pop-night print:break-inside-avoid"
          >
            {it}
          </li>
        ))}
      </ul>
    );
  }

  if (kind === "sentences") {
    return (
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li
            key={i}
            className="rounded-lg border-[3px] border-pop-night bg-white px-4 py-3 text-lg text-pop-night print:break-inside-avoid"
          >
            {it}
          </li>
        ))}
      </ul>
    );
  }

  if (kind === "script") {
    return (
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="border-l-4 border-pop-magenta pl-3 text-pop-night/85">
            &ldquo;{it}&rdquo;
          </li>
        ))}
      </ul>
    );
  }

  // wordList
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((it, i) => (
        <li
          key={i}
          className="rounded-lg border-[3px] border-pop-night bg-white px-3 py-1.5 font-medium text-pop-night"
        >
          {it}
        </li>
      ))}
    </ul>
  );
}
