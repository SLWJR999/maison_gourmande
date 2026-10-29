"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { banners, type BannerPlacement } from "@/db/schema";
import { logAudit, requirePermission } from "@/lib/auth";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function dateOrNull(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function saveBanner(formData: FormData) {
  const user = await requirePermission("content:write");
  const id = text(formData, "id");
  const title = text(formData, "title");
  if (!title) redirect("/admin/bannieres?error=Titre%20requis");
  const placementRaw = text(formData, "placement");
  const placement: BannerPlacement =
    placementRaw === "MENU" || placementRaw === "EVENTS"
      ? placementRaw
      : "HOME_STRIP";
  const values = {
    title,
    subtitle: text(formData, "subtitle"),
    imageUrl: text(formData, "imageUrl"),
    ctaLabel: text(formData, "ctaLabel") || "Voir le menu",
    ctaHref: text(formData, "ctaHref") || "/menu",
    placement,
    isActive: formData.get("isActive") === "on",
    startsAt: dateOrNull(text(formData, "startsAt")),
    endsAt: dateOrNull(text(formData, "endsAt")),
    sortOrder: Number.parseInt(text(formData, "sortOrder"), 10) || 0,
    updatedAt: new Date(),
  };
  const db = getDb();
  if (id) {
    await db.update(banners).set(values).where(eq(banners.id, id));
    await logAudit({
      actor: user,
      action: "Bannière modifiée",
      entity: "banner",
      entityId: id,
      details: { title, placement },
    });
  } else {
    const [created] = await db.insert(banners).values(values).returning();
    await logAudit({
      actor: user,
      action: "Bannière créée",
      entity: "banner",
      entityId: created.id,
      details: { title, placement },
    });
  }
  revalidatePath("/admin/bannieres");
  revalidatePath("/");
  revalidatePath("/evenements");
  revalidatePath("/promotions");
  redirect("/admin/bannieres?ok=Bannière%20enregistrée");
}

export async function deleteBanner(formData: FormData) {
  const user = await requirePermission("content:write");
  const id = text(formData, "id");
  if (!id) redirect("/admin/bannieres");
  await getDb().delete(banners).where(eq(banners.id, id));
  await logAudit({
    actor: user,
    action: "Bannière supprimée",
    entity: "banner",
    entityId: id,
  });
  revalidatePath("/admin/bannieres");
  revalidatePath("/");
  revalidatePath("/evenements");
  redirect("/admin/bannieres?ok=Bannière%20supprimée");
}
