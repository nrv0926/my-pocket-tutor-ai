const FAQS = [
  {
    q: "Is this for my child to use?",
    a: "No. AI Pocket Tutor is for you — the grown-up. There's no child login and the AI never chats with a kid. You get the plan; you decide how to use it.",
  },
  {
    q: "Do you need my child's real name?",
    a: "Never. We ask for a nickname. There is no field anywhere for a full name, school name, or student number — the columns don't exist in our database.",
  },
  {
    q: "Will you tell me what's wrong with my child?",
    a: "No. We don't diagnose and we never name conditions. If you tell us your child has ADHD or dyslexia, we adapt the plan — shorter tasks, more repetition — without labelling anyone.",
  },
  {
    q: "What curriculum do you follow?",
    a: "Ontario by default, K through 6. If your child is behind, we step down a grade level rather than pushing ahead.",
  },
  {
    q: "What does it cost?",
    a: "Free to start, no credit card. Paid plans are $9.99/month for one child or $19.99/month for up to four.",
  },
];

export function HomeFaq() {
  return (
    <div className="space-y-4">
      {FAQS.map((f) => (
        <details
          key={f.q}
          className="group rounded-2xl border-[3px] border-pop-night bg-white shadow-pop-sm open:shadow-pop"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-display text-base uppercase leading-tight text-pop-night">
            {f.q}
            <span
              aria-hidden
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[3px] border-pop-night bg-pop-yellow text-lg leading-none transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="px-5 pb-5 text-sm font-medium leading-relaxed text-pop-night/80">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
