"use server";

import { redirect } from "next/navigation";
import { isRole } from "@/types/child";
import { setRoleCookie, clearRoleCookie } from "@/lib/role";

export async function selectRole(formData: FormData): Promise<void> {
  const role = formData.get("role");
  const next = String(formData.get("next") ?? "/children/new") || "/children/new";
  if (!isRole(role)) {
    clearRoleCookie();
    redirect("/");
  }
  setRoleCookie(role);
  redirect(next);
}
