import { cookies } from "next/headers";
import { isRole, type Role } from "@/types/child";

const COOKIE_NAME = "tutor_role";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function getRole(): Role | null {
  const v = cookies().get(COOKIE_NAME)?.value;
  return isRole(v) ? v : null;
}

export function setRoleCookie(role: Role): void {
  cookies().set({
    name: COOKIE_NAME,
    value: role,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
}

export function clearRoleCookie(): void {
  cookies().delete(COOKIE_NAME);
}

export const ROLE_LABEL: Record<Role, string> = {
  parent: "parent of a school-going child",
  homeschooler: "homeschooling parent",
  teacher: "classroom teacher",
};

export const ROLE_HEADLINE: Record<Role, string> = {
  parent: "Setting up for a parent",
  homeschooler: "Setting up for a homeschooler",
  teacher: "Setting up for a teacher",
};

export const ROLE_SUBHEAD: Record<Role, string> = {
  parent: "We'll size every plan for a 10–15 minute kitchen-table session.",
  homeschooler: "We'll write full mini-lessons and longer practice sets.",
  teacher: "We'll size every plan for a 10-minute classroom rotation.",
};
