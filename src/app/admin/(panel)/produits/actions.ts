"use server";

import { and, eq, inArray, min, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import {
  options,
  productOptions,
  productVariants,
  products,
} from "@/db/schema";
import { logAudit, requirePermission } from "@/lib/auth";
import { slugify } from "@/lib/admin";

const AVAILABILITIES = ["AVAILABLE", "SOLD_OUT", "COMING_SOON"] as const;
type Availability = (typeof AVAILABILITIES)[number];

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

function parseImages(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function availability(value: string): Availability {
  return (AVAILABILITIES as readonly string[]).includes(value)
    ? (value as Availability)
    : "AVAILABLE";
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function refreshProductBasePrice(productId: string) {
  const db = getDb();
  const [row] = await db
    .select({ value: min(productVariants.price) })
    .from(productVariants)
    .where(
      and(
        eq(productVariants.productId, productId),
        eq(productVariants.isActive, true),
      ),
    );
  if (row?.value !== null && row?.value !== undefined) {
    await db
      .update(products)
      .set({ basePrice: Number(row.value), updatedAt: new Date() })
      .where(eq(products.id, productId));
  }
}

export async function saveProduct(formData: FormData) {
  const user = await requirePermission("products:write");
  const id = text(formData, "id");
  const back = id ? `/admin/produits/${id}` : "/admin/produits/nouveau";
  const name = text(formData, "name");
  const categoryId = text(formData, "categoryId");
  const basePrice = integer(formData, "basePrice");
  if (name.length < 2) fail(back, "Le nom du produit est requis.");
  if (!categoryId) fail(back, "Choisissez une catégorie.");
  if (basePrice < 0) fail(back, "Le prix doit être positif.");

  const slug = slugify(text(formData, "slug") || name);
  if (!slug) fail(back, "Le slug est invalide.");
  const images = parseImages(text(formData, "images"));
  const imageUrl = text(formData, "imageUrl") || images[0] || "";
  const prepared = nullableInteger(formData, "preparationMinutes");

  const values = {
    categoryId,
    name,
    slug,
    shortDescription: text(formData, "shortDescription"),
    description: text(formData, "description"),
    basePrice,
    compareAtPrice: nullableInteger(formData, "compareAtPrice"),
    costPrice: integer(formData, "costPrice"),
    imageUrl,
    images,
    badge: text(formData, "badge") || null,
    videoUrl: text(formData, "videoUrl"),
    ingredients: text(formData, "ingredients"),
    allergens: text(formData, "allergens"),
    preparationMinutes: prepared && prepared > 0 ? prepared : null,
    availability: availability(text(formData, "availability")),
    isFeatured: formData.get("isFeatured") === "on",
    isActive: formData.get("isActive") === "on",
    sortOrder: integer(formData, "sortOrder", 0, -999),
    updatedAt: new Date(),
  };

  try {
    const db = getDb();
    if (id) {
      const [existing] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, id))
        .limit(1);
      if (!existing) fail(back, "Produit introuvable.");
      await db.update(products).set(values).where(eq(products.id, id));
      await logAudit({
        actor: user,
        action: "Produit modifié",
        entity: "product",
        entityId: id,
        details: { name, slug, basePrice },
      });
    } else {
      const [created] = await db
        .insert(products)
        .values({ ...values, isArchived: false })
        .returning();
      if (basePrice > 0) {
        await db.insert(productVariants).values({
          productId: created.id,
          name: "Unité",
          quantity: 1,
          price: basePrice,
          compareAtPrice: values.compareAtPrice,
          imageUrl,
          isActive: true,
          sortOrder: 0,
        });
      }
      await logAudit({
        actor: user,
        action: "Produit créé",
        entity: "product",
        entityId: created.id,
        details: { name, slug, basePrice },
      });
      revalidatePath("/admin/produits");
      revalidatePath("/menu");
      redirect(`/admin/produits/${created.id}?ok=Produit%20créé.%20Ajoutez%20ses%20formats.`);
    }
  } catch (error) {
    console.error(error);
    fail(back, "Enregistrement impossible. Vérifiez que le slug est unique.");
  }

  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${id}`);
  revalidatePath("/menu");
  revalidatePath(`/menu/${slug}`);
  revalidatePath("/");
  redirect(`${back}?ok=Produit%20enregistré`);
}

export async function setProductState(formData: FormData) {
  const user = await requirePermission("products:write");
  const id = text(formData, "id");
  const action = text(formData, "action");
  if (!id) redirect("/admin/produits?error=Produit%20introuvable");
  const value = action === "toggle" ? formData.get("value") === "true" : undefined;
  const db = getDb();
  const update =
    action === "archive"
      ? { isArchived: true, isActive: false }
      : action === "restore"
        ? { isArchived: false }
        : { isActive: Boolean(value) };
  await db
    .update(products)
    .set({ ...update, updatedAt: new Date() })
    .where(eq(products.id, id));
  await logAudit({
    actor: user,
    action:
      action === "archive"
        ? "Produit archivé"
        : action === "restore"
          ? "Produit restauré"
          : "Visibilité produit modifiée",
    entity: "product",
    entityId: id,
  });
  revalidatePath("/admin/produits");
  revalidatePath("/menu");
  revalidatePath("/");
  redirect("/admin/produits?ok=Statut%20mis%20à%20jour");
}

export async function saveVariant(formData: FormData) {
  const user = await requirePermission("products:write");
  const productId = text(formData, "productId");
  const id = text(formData, "id");
  const back = `/admin/produits/${productId}`;
  if (!productId) fail("/admin/produits", "Produit introuvable.");
  const name = text(formData, "name");
  const price = integer(formData, "price");
  const quantity = integer(formData, "quantity", 1, 1);
  if (name.length < 1) fail(back, "Le nom du format est requis.");

  const values = {
    productId,
    name,
    quantity,
    price,
    compareAtPrice: nullableInteger(formData, "compareAtPrice"),
    composition: text(formData, "composition"),
    imageUrl: text(formData, "imageUrl"),
    stock: nullableInteger(formData, "stock"),
    isActive: formData.get("isActive") === "on",
    sortOrder: integer(formData, "sortOrder", 0, -999),
    updatedAt: new Date(),
  };

  try {
    const db = getDb();
    if (id) {
      await db
        .update(productVariants)
        .set(values)
        .where(
          and(
            eq(productVariants.id, id),
            eq(productVariants.productId, productId),
          ),
        );
    } else {
      await db.insert(productVariants).values(values);
    }
    await refreshProductBasePrice(productId);
    await logAudit({
      actor: user,
      action: id ? "Format produit modifié" : "Format produit ajouté",
      entity: "product_variant",
      entityId: id || productId,
      details: { productId, name, price, quantity },
    });
  } catch (error) {
    console.error(error);
    fail(back, "Format non enregistré. Vérifiez les valeurs.");
  }

  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/menu");
  revalidatePath("/");
  redirect(`${back}?ok=Format%20enregistré`);
}

export async function deleteVariant(formData: FormData) {
  const user = await requirePermission("products:write");
  const productId = text(formData, "productId");
  const id = text(formData, "id");
  if (!productId || !id) redirect("/admin/produits");
  const db = getDb();
  await db
    .delete(productVariants)
    .where(
      and(
        eq(productVariants.id, id),
        eq(productVariants.productId, productId),
      ),
    );
  await refreshProductBasePrice(productId);
  await logAudit({
    actor: user,
    action: "Format produit supprimé",
    entity: "product_variant",
    entityId: id,
    details: { productId },
  });
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/menu");
  redirect(`/admin/produits/${productId}?ok=Format%20supprimé`);
}

export async function saveProductOptions(formData: FormData) {
  const user = await requirePermission("products:write");
  const productId = text(formData, "productId");
  if (!productId) redirect("/admin/produits");
  const selected = formData
    .getAll("optionIds")
    .map(String)
    .filter(Boolean);
  const db = getDb();
  await db.delete(productOptions).where(eq(productOptions.productId, productId));
  if (selected.length) {
    const valid = await db
      .select({ id: options.id })
      .from(options)
      .where(inArray(options.id, selected));
    if (valid.length) {
      await db
        .insert(productOptions)
        .values(valid.map((option) => ({ productId, optionId: option.id })))
        .onConflictDoNothing();
    }
  }
  await logAudit({
    actor: user,
    action: "Options produit mises à jour",
    entity: "product",
    entityId: productId,
    details: { optionIds: selected },
  });
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/menu");
  redirect(`/admin/produits/${productId}?ok=Options%20mises%20à%20jour`);
}

export async function duplicateProduct(formData: FormData) {
  const user = await requirePermission("products:write");
  const id = text(formData, "id");
  if (!id) redirect("/admin/produits");
  const db = getDb();
  const [source] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!source) redirect("/admin/produits?error=Produit%20introuvable");
  const suffix = `-copie-${Date.now().toString(36).slice(-4)}`;
  const [created] = await db
    .insert(products)
    .values({
      ...source,
      id: undefined,
      name: `${source.name} (copie)`,
      slug: `${source.slug}${suffix}`,
      isActive: false,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id));
  if (variants.length) {
    await db.insert(productVariants).values(
      variants.map((variant) => ({
        productId: created.id,
        name: variant.name,
        quantity: variant.quantity,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        composition: variant.composition,
        imageUrl: variant.imageUrl,
        stock: variant.stock,
        isActive: variant.isActive,
        sortOrder: variant.sortOrder,
      })),
    );
  }
  const assigned = await db
    .select()
    .from(productOptions)
    .where(eq(productOptions.productId, id));
  if (assigned.length) {
    await db
      .insert(productOptions)
      .values(assigned.map((row) => ({ productId: created.id, optionId: row.optionId })))
      .onConflictDoNothing();
  }
  await logAudit({
    actor: user,
    action: "Produit dupliqué",
    entity: "product",
    entityId: created.id,
    details: { sourceId: id, name: created.name },
  });
  revalidatePath("/admin/produits");
  redirect(`/admin/produits/${created.id}?ok=Produit%20dupliqué`);
}
