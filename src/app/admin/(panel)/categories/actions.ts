"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { logAudit, requirePermission } from "@/lib/auth";
import { slugify } from "@/lib/admin";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function fail(message: string): never {
  redirect(`/admin/categories?error=${encodeURIComponent(message)}`);
}

export async function saveCategory(formData: FormData) {
  const user = await requirePermission("products:write");
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (name.length < 2) fail("Le nom de la catégorie est requis.");
  const slug = slugify(text(formData, "slug") || name);
  if (!slug) fail("Le slug est invalide.");
  const values = {
    name,
    slug,
    description: text(formData, "description"),
    imageUrl: text(formData, "imageUrl"),
    icon: text(formData, "icon") || "Sparkles",
    sortOrder: Number.parseInt(text(formData, "sortOrder"), 10) || 0,
    isActive: formData.get("isActive") === "on",
    updatedAt: new Date(),
  };

  try {
    const db = getDb();
    if (id) {
      const [existing] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);
      if (!existing) fail("Catégorie introuvable.");
      await db.update(categories).set(values).where(eq(categories.id, id));
      await logAudit({
        actor: user,
        action: "Catégorie modifiée",
        entity: "category",
        entityId: id,
        details: { name, slug },
      });
    } else {
      const [created] = await db
        .insert(categories)
        .values({ ...values, isArchived: false })
        .returning();
      await logAudit({
        actor: user,
        action: "Catégorie créée",
        entity: "category",
        entityId: created.id,
        details: { name, slug },
      });
    }
  } catch (error) {
    console.error(error);
    fail("Enregistrement impossible. Vérifiez que le slug est unique.");
  }

  revalidatePath("/admin/categories");
  revalidatePath("/menu");
  revalidatePath("/");
  redirect("/admin/categories?ok=Catégorie%20enregistrée");
}

export async function setCategoryState(formData: FormData) {
  const user = await requirePermission("products:write");
  const id = text(formData, "id");
  const action = text(formData, "action");
  if (!id) fail("Catégorie introuvable.");
  const db = getDb();
  const update =
    action === "archive"
      ? { isArchived: true, isActive: false }
      : action === "restore"
        ? { isArchived: false }
        : { isActive: formData.get("value") === "true" };
  await db
    .update(categories)
    .set({ ...update, updatedAt: new Date() })
    .where(eq(categories.id, id));
  await logAudit({
    actor: user,
    action:
      action === "archive"
        ? "Catégorie archivée"
        : action === "restore"
          ? "Catégorie restaurée"
          : "Statut catégorie modifié",
    entity: "category",
    entityId: id,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/menu");
  redirect("/admin/categories?ok=Statut%20mis%20à%20jour");
}
