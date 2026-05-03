import HomeschoolResultCard from "./HomeschoolResultCard";
import ParentResultCard from "./ParentResultCard";
import TeacherResultCard from "./TeacherResultCard";
import type {
  HomeschoolResult,
  Mode,
  ParentResult,
  TeacherResult,
} from "@/types/session";

/**
 * Mode-aware dispatcher. Existing call sites (the /try page) pass only a
 * parent-shaped result with no mode; we default to parent for back-compat.
 */
export default function AnalysisResultCard(
  props:
    | { mode?: "parent"; result: ParentResult }
    | { mode: "homeschool"; result: HomeschoolResult }
    | { mode: "teacher"; result: TeacherResult },
) {
  const mode: Mode = props.mode ?? "parent";
  if (mode === "homeschool") return <HomeschoolResultCard result={props.result as HomeschoolResult} />;
  if (mode === "teacher") return <TeacherResultCard result={props.result as TeacherResult} />;
  return <ParentResultCard result={props.result as ParentResult} />;
}
