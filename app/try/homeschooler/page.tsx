import SamplePlan from "@/components/SamplePlan";

export const metadata = {
  title: "See a sample plan for homeschoolers · AI Pocket Tutor",
  description:
    "What an AI Pocket Tutor plan looks like when a Grade 2 phonics sequence stalls at silent e — a full mini-lesson, and a straight answer on whether to move on.",
};

export default function TryHomeschoolerPage() {
  return <SamplePlan role="homeschooler" />;
}
