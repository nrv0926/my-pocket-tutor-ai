import type { Role } from "@/types/child";

/**
 * Every user-facing string that changes with the reader's role.
 *
 * Deliberately free of server imports. `lib/role.ts` reads the role cookie
 * and so pulls in `next/headers`; anything importing that from a client
 * component breaks the build. Copy lives here instead, so the intake form
 * and the session form can use it directly.
 *
 * The three readers are not the same person (CLAUDE.md §1): a parent is
 * helping after school, a homeschooler IS the teacher of record, and a
 * classroom teacher is planning a rotation. Asking all three "what's your
 * goal for this child?" gets a worse answer from two of them.
 */
export interface RoleCopy {
  /** Word for the young person, used in running copy. */
  learner: string;
  headline: string;
  subhead: string;
  pageTitle: string;
  nicknameLabel: string;
  nicknamePlaceholder: string;
  concernLabel: string;
  concernPlaceholder: string;
  strengthsLabel: string;
  strengthsPlaceholder: string;
  weaknessesLabel: string;
  weaknessesPlaceholder: string;
  goalLabel: string;
  goalPlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
  /** New-session page. */
  sessionTitle: string;
  sessionSubhead: string;
}

export const ROLE_COPY: Record<Role, RoleCopy> = {
  parent: {
    learner: "child",
    headline: "Setting up for a parent",
    subhead: "We'll size every plan for a 10–15 minute kitchen-table session.",
    pageTitle: "Tell us about your child.",
    nicknameLabel: "Child nickname (not their full name)",
    nicknamePlaceholder: "e.g. Bean, R., Lulu",
    concernLabel: "Main concern (one sentence)",
    concernPlaceholder: "e.g. Reading aloud is slow and frustrating.",
    strengthsLabel: "Strengths",
    strengthsPlaceholder: "e.g. Loves stories, great memory.",
    weaknessesLabel: "Weaknesses",
    weaknessesPlaceholder: "e.g. Struggles to sound out new words.",
    goalLabel: "What's your goal for this child right now?",
    goalPlaceholder: "e.g. Feel confident reading a chapter book by summer.",
    submitLabel: "Create child profile",
    submittingLabel: "Creating profile...",
    sessionTitle: "What would you like help with?",
    sessionSubhead:
      "Pick your child, tell us what came home, and we'll turn it into tonight's session.",
  },
  teacher: {
    learner: "student",
    headline: "Setting up for a teacher",
    subhead: "We'll size every plan for a 10-minute classroom rotation.",
    pageTitle: "Tell us about your student.",
    nicknameLabel: "Student initials or nickname (never a full name)",
    nicknamePlaceholder: "e.g. J.M., Student 4, Group B",
    concernLabel: "What are you seeing? (one sentence)",
    concernPlaceholder:
      "e.g. Guesses from the first letter instead of decoding through the word.",
    strengthsLabel: "What's already secure",
    strengthsPlaceholder: "e.g. CVC and most digraphs, blends in isolation.",
    weaknessesLabel: "Where it breaks down",
    weaknessesPlaceholder: "e.g. Anything two syllables or longer, especially in running text.",
    goalLabel: "What do you need them to be able to do?",
    goalPlaceholder: "e.g. Decode two-syllable words independently before report cards.",
    submitLabel: "Create student profile",
    submittingLabel: "Creating profile...",
    sessionTitle: "What do you need a plan for?",
    sessionSubhead:
      "Pick a student, tell us what you're seeing, and we'll send back a mini-lesson and an exit ticket.",
  },
  homeschooler: {
    learner: "learner",
    headline: "Setting up for a homeschooler",
    subhead: "We'll write full mini-lessons and longer practice sets.",
    pageTitle: "Tell us about your learner.",
    nicknameLabel: "Learner nickname (not their full name)",
    nicknamePlaceholder: "e.g. Bean, R., Lulu",
    concernLabel: "Where has the sequence stalled?",
    concernPlaceholder: "e.g. Two weeks on silent e and it still isn't sticking.",
    strengthsLabel: "What's secure so far",
    strengthsPlaceholder: "e.g. CVC, digraphs, and blends are automatic.",
    weaknessesLabel: "What isn't landing",
    weaknessesPlaceholder: "e.g. Reads 'cape' as 'cap' about half the time.",
    goalLabel: "What's the goal for this stretch?",
    goalPlaceholder: "e.g. Finish the phonics sequence before Grade 3.",
    submitLabel: "Create learner profile",
    submittingLabel: "Creating profile...",
    sessionTitle: "What are we planning today?",
    sessionSubhead:
      "Pick your learner, tell us where you are in the sequence, and we'll write the full mini-lesson.",
  },
};

/** Copy for an unknown role — neutral, never assumes a parent. */
export const DEFAULT_ROLE_COPY: RoleCopy = ROLE_COPY.parent;

export function roleCopy(role: Role | null): RoleCopy {
  return role ? ROLE_COPY[role] : DEFAULT_ROLE_COPY;
}
