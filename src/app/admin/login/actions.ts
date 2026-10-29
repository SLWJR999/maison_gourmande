"use server";

import { redirect } from "next/navigation";
import { loginWithCredentials } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const nextRaw = String(formData.get("next") || "/admin");
  const next =
    nextRaw.startsWith("/admin") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/admin";

  const result = await loginWithCredentials(email, password);
  if (!result.ok) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}
