"use client";

import { useState } from "react";
import { SectionTag, SectionTitle } from "./SectionTag";

const QA = [
  {
    q: "What's the difference between the three modes?",
    a: "Parent mode gives you a simple, 10–15 minute daily plan for home. Homeschool mode gives you a full weekly plan with daily lesson breakdowns by subject. Teacher mode gives you an intervention plan, differentiated practice at three levels, and classroom-ready resources. Each mode uses the same core analysis but generates different outputs for your situation.",
  },
  {
    q: "Is this aligned to the Ontario curriculum?",
    a: "Yes. All skill recommendations, progression steps, and worksheets are aligned to the Ontario Language and Math curriculum for Kindergarten to Grade 3. Reading plans specifically follow the Science of Reading — phonemic awareness, phonics, fluency, vocabulary, and comprehension, always in the right order.",
  },
  {
    q: "What's the difference between printable and interactive worksheets?",
    a: "Printable worksheets are clean, simple PDFs you can print at home and work through together at the table. Interactive worksheets are on-screen sessions where your child answers questions, gets instant feedback, and earns a score — which is automatically saved to their progress. Printable is included in all plans. Interactive is available with Premium and Family.",
  },
  {
    q: "Is my child's information safe?",
    a: "Yes. We never ask for your child's full name, school name, or student number. Any files you upload are analysed and deleted within 24 hours — we never store copies. All data is encrypted in transit and at rest. We never share information with third parties.",
  },
  {
    q: "What grades does Pocket Tutor cover?",
    a: "Our MVP focuses on Kindergarten to Grade 3 for Reading, Writing, and Math — the foundational years where early support makes the biggest difference. We'll be expanding to Grade 4–6 later this year.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, absolutely. You can cancel your subscription at any time from your account settings — no phone calls, no forms, no questions. Your access continues until the end of your billing period.",
  },
];

export default function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="bg-gradient-to-br from-forest-50 to-cream-50 px-4 py-20 sm:px-6"
    >
      <div className="mx-auto max-w-3xl">
        <SectionTag>Questions</SectionTag>
        <SectionTitle>Frequently asked.</SectionTitle>

        <div className="mt-10 flex flex-col gap-2.5">
          {QA.map((item, i) => {
            const open = openIdx === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-xl border border-cream-300 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 p-5 text-left text-[15px] font-medium text-forest-600"
                >
                  {item.q}
                  <span
                    className={[
                      "flex-shrink-0 text-lg text-teal-400 transition-transform",
                      open ? "rotate-45" : "",
                    ].join(" ")}
                    aria-hidden
                  >
                    +
                  </span>
                </button>
                <div
                  className={[
                    "grid transition-[grid-template-rows] duration-300 ease-in-out",
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  ].join(" ")}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm font-light leading-relaxed text-ink-soft">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
