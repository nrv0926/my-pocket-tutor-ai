import type { GradeId, SubjectId } from "@/types/curriculum";

/**
 * Why a grade and subject have nothing to show.
 *
 * Two of the three cases are the source document rather than a gap in our
 * work, and calling those "not transcribed yet" would be a lie about
 * Ontario. The kind is shared so the two places that explain it cannot drift
 * apart; the wording is not, because a picker and a browse page have
 * different room.
 *
 * Deliberately its own module rather than part of lib/curriculum.ts: that
 * file imports ~250 KB of transcribed JSON at module scope, so a client
 * component importing one helper from it ships the entire Ontario curriculum
 * to the browser. This has no data behind it and is safe to import anywhere.
 */
export type EmptyKind = "kindergarten" | "fsl-starts-later" | "not-transcribed";

export function emptyKind(id: SubjectId, grade: GradeId): EmptyKind {
  if (grade === "K") return "kindergarten";
  if (id === "french" && ["1", "2", "3"].includes(grade)) return "fsl-starts-later";
  return "not-transcribed";
}
