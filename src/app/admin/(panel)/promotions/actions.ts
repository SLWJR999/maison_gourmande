"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { promotions, type PromotionScope, type PromotionType } from "@/db/schema";
import { logAudit, requirePermission } from "@/lib/auth";
import { normalizePromoCode } from "@/lib/pricing";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function integer(
  formData: FormData,
  key: string,
  fallback = 0,
  minValue = 0,
): number {
  const parsed = Number.parseInt(text(formData, key), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minValue, parsed);
}

function nullableInteger(formData: FormData, key: string): number | null {
  const raw = text(formData, key);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function validTime(value: string): string | null {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : null;
}

function validDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function savePromotion(formData: FormData) {
  const user = await requirePermission("promotions:write");
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!name) redirect("/admin/promotions?error=Nom%20requis");

  const typeRaw = text(formData, "type");
  const type: PromotionType =
    typeRaw === "FIXED" || typeRaw === "FREE_DELIVERY"
      ? typeRaw
      : "PERCENT";
  const code = normalizePromoCode(text(formData, "code"));
  const scopeRaw = text(formData, "scopeType");
  const scopeType: PromotionScope =
    scopeRaw === "CATEGORIES" || scopeRaw === "PRODUCTS"
      ? scopeRaw
      : "ALL";
  const days = formData
    .getAll("days")
    .map((day) => Number.parseInt(String(day), 10))
    .filter((day) => Number.isFinite(day) && day >= 0 && day <= 6);

  let value = integer(formData, "value");
  if (type === "PERCENT") value = Math.min(100, value);
  if (type === "FREE_DELIVERY") value = 0;

  const values = {
    name,
    description: text(formData, "description"),
    code,
    type,
    value,
    minSubtotal: integer(formData, "minSubtotal"),
    minItems: integer(formData, "minItems"),
    daysOfWeek: days,
    startTime: validTime(text(formData, "startTime")),
    endTime: validTime(text(formData, "endTime")),
    startsAt: validDate(text(formData, "startsAt")),
    endsAt: validDate(text(formData, "endsAt")),
    maxRedemptions: nullableInteger(formData, "maxRedemptions"),
    maxPerCustomer: nullableInteger(formData, "maxPerCustomer"),
    scopeType,
    scopeCategoryIds:
      scopeType === "CATEGORIES" ? formData.getAll("scopeCategoryIds").map(String) : [],
    scopeProductIds:
      scopeType === "PRODUCTS" ? formData.getAll("scopeProductIds").map(String) : [],
    loyaltyMinOrders: integer(formData, "loyaltyMinOrders"),
    isAutomatic: formData.get("isAutomatic") === "on",
    isActive: formData.get("isActive") === "on",
    showBanner: formData.get("showBanner") === "on",
    updatedAt: new Date(),
  };

  if (values.startsAt && values.endsAt && values.startsAt > values.endsAt) {
    redirect("/admin/promotions?error=La%20date%20de%20fin%20doit%20suivre%20la%20date%20de%20début");
  }

  try {
    const db = getDb();
    if (id) {
      await db.update(promotions).set(values).where(eq(promotions.id, id));
      await logAudit({
        actor: user,
        action: "Promotion modifiée",
        entity: "promotion",
        entityId: id,
        details: { name, code, type, value },
      });
    } else {
      const [created] = await db.insert(promotions).values(values).returning();
      await logAudit({
        actor: user,
        action: "Promotion créée",
        entity: "promotion",
        entityId: created.id,
        details: { name, code, type, value },
      });
    }
  } catch (error) {
    console.error(error);
    redirect("/admin/promotions?error=Enregistrement%20impossible.%20Le%20code%20est%20peut-être%20déjà%20utilisé.");
  }

  revalidatePath("/admin/promotions");
  revalidatePath("/promotions");
  revalidatePath("/panier");
  revalidatePath("/menu");
  redirect("/admin/promotions?ok=Promotion%20enregistrée");
}

export async function setPromotionState(formData: FormData) {
  const user = await requirePermission("promotions:write");
  const id = text(formData, "id");
  if (!id) redirect("/admin/promotions");
  const isActive = formData.get("value") === "true";
  await getDb()
    .update(promotions)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(promotions.id, id));
  await logAudit({
    actor: user,
    action: isActive ? "Promotion activée" : "Promotion désactivée",
    entity: "promotion",
    entityId: id,
  });
  revalidatePath("/admin/promotions");
  revalidatePath("/promotions");
  redirect("/admin/promotions?ok=Statut%20mis%20à%20jour");
}
