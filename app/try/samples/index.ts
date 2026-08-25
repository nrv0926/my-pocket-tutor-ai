import type { Role } from "@/types/child";
import type { AnalysisResult } from "@/types/session";
import { SAMPLE_ANALYSIS, SAMPLE_PARENT_INPUT } from "./parent";
import { TEACHER_ANALYSIS, TEACHER_INPUT } from "./teacher";
import { HOMESCHOOLER_ANALYSIS, HOMESCHOOLER_INPUT } from "./homeschooler";

export interface Sample {
  role: Role;
  /** Tab label. */
  label: string;
  /** Path this sample lives at, for the tab strip. */
  href: string;
  /** Heading above the quoted input — whose words these are. */
  inputHeading: string;
  /** Page headline. */
  title: string;
  /** One line under the headline. */
  blurb: string;
  input: string;
  analysis: AnalysisResult;
}

export const SAMPLES: Record<Role, Sample> = {
  parent: {
    role: "parent",
    label: "Parent",
    href: "/try",
    inputHeading: "The parent's worry",
    title: "Here's what a plan looks like.",
    blurb:
      "A parent shares what's happening after school. We turn it into a ten-minute session you can run tonight, at the kitchen table, with no prep.",
    input: SAMPLE_PARENT_INPUT,
    analysis: SAMPLE_ANALYSIS,
  },
  teacher: {
    role: "teacher",
    label: "Teacher",
    href: "/try/teacher",
    inputHeading: "What the teacher brought us",
    title: "Here's what a plan looks like.",
    blurb:
      "A Grade 3 guided-reading group has stalled on multisyllabic words. We name the misconception, size the lesson for a 10-minute rotation, and hand back an exit ticket.",
    input: TEACHER_INPUT,
    analysis: TEACHER_ANALYSIS,
  },
  homeschooler: {
    role: "homeschooler",
    label: "Homeschooler",
    href: "/try/homeschooler",
    inputHeading: "What the homeschooling parent asked",
    title: "Here's what a plan looks like.",
    blurb:
      "A Grade 2 phonics sequence has stalled at silent e. We say whether to push on or stay put, then write the full mini-lesson — model, guided, independent.",
    input: HOMESCHOOLER_INPUT,
    analysis: HOMESCHOOLER_ANALYSIS,
  },
};

export const SAMPLE_ORDER: Role[] = ["parent", "teacher", "homeschooler"];
