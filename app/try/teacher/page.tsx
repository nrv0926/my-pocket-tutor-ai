import SamplePlan from "@/components/SamplePlan";

export const metadata = {
  title: "See a sample plan for teachers · AI Pocket Tutor",
  description:
    "What an AI Pocket Tutor plan looks like for a Grade 3 guided-reading group stuck on multisyllabic decoding — sized for a 10-minute rotation, with an exit ticket.",
};

export default function TryTeacherPage() {
  return <SamplePlan role="teacher" />;
}
