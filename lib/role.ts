import { cookies } from "next/headers";
import { isRole, type Role } from "@/types/child";
import { ROLE_COPY } from "@/lib/roleCopy";

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
  parent: ROLE_COPY.parent.headline,
  homeschooler: ROLE_COPY.homeschooler.headline,
  teacher: ROLE_COPY.teacher.headline,
};

export const ROLE_SUBHEAD: Record<Role, string> = {
  parent: ROLE_COPY.parent.subhead,
  homeschooler: ROLE_COPY.homeschooler.subhead,
  teacher: ROLE_COPY.teacher.subhead,
};
