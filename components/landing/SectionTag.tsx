export function SectionTag({ tone = "light", children }: { tone?: "light" | "dark"; children: React.ReactNode }) {
  return (
    <p
      className={[
        "text-[11px] font-medium uppercase tracking-[0.07em]",
        tone === "dark" ? "text-forest-400" : "text-teal-400",
      ].join(" ")}
    >
      {children}
    </p>
  );
}

export function SectionTitle({
  tone = "light",
  className = "",
  children,
}: {
  tone?: "light" | "dark";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      className={[
        "mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl",
        tone === "dark" ? "text-white" : "text-forest-600",
        className,
      ].join(" ")}
    >
      {children}
    </h2>
  );
}

export function SectionSub({ tone = "light", children }: { tone?: "light" | "dark"; children: React.ReactNode }) {
  return (
    <p
      className={[
        "mt-3 max-w-xl text-base font-light leading-relaxed",
        tone === "dark" ? "text-white/60" : "text-ink-soft",
      ].join(" ")}
    >
      {children}
    </p>
  );
}
