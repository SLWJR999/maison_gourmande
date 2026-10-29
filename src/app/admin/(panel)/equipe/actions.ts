"use server";

import bcrypt from "bcryptjs";
import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users, type UserRole } from "@/db/schema";
import { logAudit, requirePermission } from "@/lib/auth";

const ROLES: UserRole[] = ["SUPER_ADMIN", "MANAGER", "STAFF"];

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function fail(message: string): never {
  redirect(`/admin/equipe?error=${encodeURIComponent(message)}`);
}

async function assertNotLastSuperAdmin(userId: string) {
  const [target] = await getDb()
    .select({ role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!target) fail("Utilisateur introuvable.");
  if (target.role !== "SUPER_ADMIN" || !target.isActive) return;
  const [row] = await getDb()
    .select({ total: count() })
    .from(users)
    .where(and(eq(users.role, "SUPER_ADMIN"), eq(users.isActive, true), ne(users.id, userId)));
  if (Number(row?.total ?? 0) < 1) {
    fail("Impossible de désactiver ou rétrograder le dernier super administrateur actif.");
  }
}

export async function createTeamMember(formData: FormData) {
  const actor = await requirePermission("team:manage");
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");
  const roleRaw = text(formData, "role");
  const role: UserRole = ROLES.includes(roleRaw as UserRole)
    ? (roleRaw as UserRole)
    : "STAFF";
  if (name.length < 2) fail("Nom requis.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("E-mail valide requis.");
  if (password.length < 12) fail("Le mot de passe doit contenir au moins 12 caractères.");
  const hash = await bcrypt.hash(password, 12);
  try {
    const [created] = await getDb()
      .insert(users)
      .values({ name, email, passwordHash: hash, role, isActive: true })
      .returning();
    await logAudit({
      actor,
      action: "Membre d'équipe créé",
      entity: "user",
      entityId: created.id,
      details: { email, role },
    });
  } catch (error) {
    console.error(error);
    fail("Création impossible : cet e-mail est peut-être déjà utilisé.");
  }
  revalidatePath("/admin/equipe");
  redirect("/admin/equipe?ok=Membre%20créé.%20Communiquez%20le%20mot%20de%20passe%20par%20un%20canal%20sécurisé.");
}

export async function updateTeamMember(formData: FormData) {
  const actor = await requirePermission("team:manage");
  const id = text(formData, "id");
  const action = text(formData, "action");
  if (!id) fail("Utilisateur introuvable.");
  const db = getDb();
  if (action === "toggle") {
    const isActive = formData.get("value") === "true";
    if (!isActive) await assertNotLastSuperAdmin(id);
    if (id === actor.id && !isActive) fail("Vous ne pouvez pas désactiver votre propre compte.");
    await db.update(users).set({ isActive, updatedAt: new Date() }).where(eq(users.id, id));
    await logAudit({
      actor,
      action: isActive ? "Compte réactivé" : "Compte désactivé",
      entity: "user",
      entityId: id,
    });
  } else if (action === "role") {
    const roleRaw = text(formData, "role");
    if (!ROLES.includes(roleRaw as UserRole)) fail("Rôle invalide.");
    if (id === actor.id && roleRaw !== "SUPER_ADMIN") {
      fail("Vous ne pouvez pas retirer votre propre rôle de super administrateur.");
    }
    await assertNotLastSuperAdmin(id);
    await db
      .update(users)
      .set({ role: roleRaw as UserRole, updatedAt: new Date() })
      .where(eq(users.id, id));
    await logAudit({
      actor,
      action: "Rôle modifié",
      entity: "user",
      entityId: id,
      details: { role: roleRaw },
    });
  } else if (action === "password") {
    const password = text(formData, "password");
    if (password.length < 12) fail("Le mot de passe doit contenir au moins 12 caractères.");
    const hash = await bcrypt.hash(password, 12);
    await db
      .update(users)
      .set({ passwordHash: hash, updatedAt: new Date() })
      .where(eq(users.id, id));
    await logAudit({
      actor,
      action: "Mot de passe réinitialisé",
      entity: "user",
      entityId: id,
    });
    revalidatePath("/admin/equipe");
    redirect("/admin/equipe?ok=Mot%20de%20passe%20réinitialisé.%20Communiquez-le%20de%20façon%20sécurisée.");
  } else {
    fail("Action inconnue.");
  }
  revalidatePath("/admin/equipe");
  redirect("/admin/equipe?ok=Membre%20mis%20à%20jour");
}
