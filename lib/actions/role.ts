"use server";

import { redirect } from "next/navigation";
import { isRole } from "@/types/child";
import { setRoleCookie, clearRoleCookie } from "@/lib/role";
import { safeNext } from "@/lib/safeRedirect";

/**
 * Set which kind of work the app plans for, then return where asked.
 *
 * `next` arrives in a form field, so it is constrained to a path inside this
 * app before being redirected to — the same open-redirect shape safeNext()
 * was written for on the auth routes. A form field is no safer than a query
 * parameter.
 */
export async function selectRole(formData: FormData): Promise<void> {
  const role = formData.get("role");
  const raw = formData.get("next");
  const next = safeNext(typeof raw === "string" ? raw : null, "/children/new");
  if (!isRole(role)) {
    clearRoleCookie();
    redirect("/");
  }
  setRoleCookie(role);
  redirect(next);
}
