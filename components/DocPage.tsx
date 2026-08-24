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
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-4xl leading-tight text-ink">{title}</h1>
        <p className="mt-3 text-ink-soft">{lead}</p>
      </header>
      <div className="space-y-8">{children}</div>
    </div>
  );
}

export function DocSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-cream-300 bg-white p-6 shadow-card">
      <h2 className="font-serif text-xl text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
        {children}
      </div>
    </section>
  );
}

export function DocList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-forest-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
