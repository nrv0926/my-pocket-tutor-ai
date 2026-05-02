import { SectionSub, SectionTag, SectionTitle } from "./SectionTag";

const ITEMS = [
  {
    icon: "🗑️",
    title: "Deleted after analysis",
    body: "Any files you upload are analysed and permanently deleted within 24 hours. We never keep copies.",
  },
  {
    icon: "🚫",
    title: "No personal details required",
    body: "We never ask for your child's full name, school name, student number, or address. A first name or nickname is all we need.",
  },
  {
    icon: "🔐",
    title: "Encrypted end to end",
    body: "All data is encrypted in transit and at rest. We never share your child's information with any third party.",
  },
];

export default function Trust() {
  return (
    <section className="bg-cream-50 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionTag>Privacy &amp; trust</SectionTag>
        <SectionTitle>
          Your child&rsquo;s information
          <br />
          is always safe.
        </SectionTitle>
        <SectionSub>
          Pocket Tutor was built with privacy at the centre &mdash; not as an
          afterthought.
        </SectionSub>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {ITEMS.map((i) => (
            <article
              key={i.title}
              className="rounded-2xl border border-cream-300 bg-white p-6 text-center"
            >
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-forest-100 bg-forest-50 text-xl">
                {i.icon}
              </span>
              <h4 className="mt-4 font-serif text-base font-semibold text-forest-600">
                {i.title}
              </h4>
              <p className="mt-2 text-[13px] font-light leading-relaxed text-ink-soft">
                {i.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-5 rounded-2xl bg-gradient-to-br from-teal-700 to-navy p-7 text-white">
          <span className="text-3xl">🛡️</span>
          <div>
            <h4 className="font-serif text-lg font-semibold text-white">
              Before you upload
            </h4>
            <p className="mt-1.5 text-sm font-light leading-relaxed text-white/60">
              We always remind you: please remove or cover personal information
              such as your child&rsquo;s full name, school name, address,
              student number, or phone number before uploading. Your
              child&rsquo;s privacy comes first &mdash; always.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
