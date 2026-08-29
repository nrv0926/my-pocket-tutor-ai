import { emptyKind } from "@/lib/emptyReason";
import type { GradeId, SubjectId } from "@/types/curriculum";

/**
 * Why there is nothing here — the honest reason, not a shrug.
 *
 * Two of the three empty cases are the source rather than a gap in our work,
 * and saying "not transcribed yet" for those would be wrong.
 */
const REASONS = {
  kindergarten:
    "Ontario publishes Kindergarten as its own program document, not as expectations inside each subject. It is a separate transcription we have not done yet.",
  "fsl-starts-later":
    "Core and Extended French begin at Grade 4. Only French Immersion runs earlier — switch program above.",
  "not-transcribed":
    "Not transcribed yet. The structure is in place; the expectations have to be copied from the Ministry document, never generated.",
} as const;

export default function EmptyReason({
  subject,
  grade,
}: {
  subject: SubjectId;
  grade: GradeId;
}) {
  const reason = REASONS[emptyKind(subject, grade)];

  return (
    <div className="mt-8 rounded-2xl border-[3px] border-dashed border-pop-night/40 bg-pop-cream p-6">
      <p className="font-medium text-pop-night/80">{reason}</p>
    </div>
  );
}
