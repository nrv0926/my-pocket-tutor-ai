import Link from "next/link";

export default function Cta() {
  return (
    <section className="relative overflow-hidden bg-forest-50 px-4 py-24 text-center sm:px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(82,183,136,.2),transparent_70%)]" />
      <div className="relative mx-auto max-w-2xl">
        <h2 className="font-serif text-3xl font-semibold text-forest-600 sm:text-4xl">
          Your child&rsquo;s next step
          <br />
          starts tonight.
        </h2>
        <p className="mt-3 text-lg font-light text-ink-soft">
          Share a report card, a homework photo, or simply tell us what
          they&rsquo;re finding hard &mdash; and get a clear plan in minutes.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="#who"
            className="inline-flex items-center rounded-xl bg-forest-500 px-6 py-3 text-sm font-medium text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-forest-600"
          >
            Find your plan ↗
          </Link>
          <Link
            href="#how"
            className="inline-flex items-center rounded-xl border-[1.5px] border-forest-500 px-5 py-3 text-sm font-medium text-forest-500 transition hover:bg-white"
          >
            See how it works →
          </Link>
        </div>
      </div>
    </section>
  );
}
