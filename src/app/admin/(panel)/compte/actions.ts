"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import {
  logAudit,
  requireUser,
  setSessionCookie,
} from "@/lib/auth";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function updateOwnProfile(formData: FormData) {
  const user = await requireUser();
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  if (name.length < 2) {
    redirect("/admin/compte?error=Nom%20invalide");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/admin/compte?error=E-mail%20invalide");
  }
  try {
    await getDb()
      .update(users)
      .set({ name, email, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  } catch (error) {
    console.error(error);
    redirect("/admin/compte?error=Cet%20e-mail%20est%20peut-être%20déjà%20utilisé");
  }
  await setSessionCookie({ ...user, name, email });
  await logAudit({
    actor: user,
    action: "Profil personnel modifié",
    entity: "user",
    entityId: user.id,
    details: { name, email },
  });
  revalidatePath("/admin/compte");
  redirect("/admin/compte?ok=Profil%20mis%20à%20jour");
}

export async function changeOwnPassword(formData: FormData) {
  const user = await requireUser();
  const current = text(formData, "currentPassword");
  const next = text(formData, "newPassword");
  const confirmation = text(formData, "confirmation");
  if (next.length < 12) {
    redirect("/admin/compte?error=Le%20nouveau%20mot%20de%20passe%20doit%20contenir%20au%20moins%2012%20caractères");
  }
  if (next !== confirmation) {
    redirect("/admin/compte?error=Les%20deux%20mots%20de%20passe%20ne%20correspondent%20pas");
  }
  if (next === current) {
    redirect("/admin/compte?error=Choisissez%20un%20mot%20de%20passe%20différent");
  }
  const db = getDb();
  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const valid = row ? await bcrypt.compare(current, row.passwordHash) : false;
  if (!valid) {
    redirect("/admin/compte?error=Mot%20de%20passe%20actuel%20incorrect");
  }
  const passwordHash = await bcrypt.hash(next, 12);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  await logAudit({
    actor: user,
    action: "Mot de passe personnel modifié",
    entity: "user",
    entityId: user.id,
  });
  redirect("/admin/compte?ok=Mot%20de%20passe%20modifié.%20Conservez-le%20en%20sécurité.");
}
