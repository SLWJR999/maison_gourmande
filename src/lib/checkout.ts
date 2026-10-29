import crypto from "node:crypto";
import { and, count, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import {
  categories,
  customers,
  options,
  orderItems,
  orders,
  productOptions,
  productVariants,
  products,
  promotions,
  type Order,
  type OrderItem,
} from "@/db/schema";
import { makeCartKey } from "@/lib/cart";
import { calculatePricing, type PriceLine, type PricingResult } from "@/lib/pricing";
import { getSettings, settingInt, getWhatsAppNumber } from "@/lib/settings";
import { formatFCFA, normalizeWhatsApp } from "@/lib/utils";
import { logAudit } from "@/lib/auth";

export class CheckoutError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "CheckoutError";
    this.status = status;
  }
}

export const checkoutItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  optionIds: z.array(z.string().uuid()).max(8).default([]),
});

export const checkoutPayloadSchema = z
  .object({
    customerName: z.string().trim().min(2, "Indiquez votre nom.").max(80),
    customerPhone: z
      .string()
      .trim()
      .min(8, "Indiquez un numéro de téléphone valide.")
      .max(30),
    customerEmail: z
      .union([z.literal(""), z.string().trim().email("E-mail invalide.")])
      .optional()
      .default(""),
    deliveryMode: z.enum(["DELIVERY", "PICKUP"]),
    address: z.string().trim().max(300).optional().default(""),
    notes: z.string().trim().max(1000).optional().default(""),
    promoCode: z.string().trim().max(50).optional().default(""),
    requestedFor: z.string().trim().max(120).optional().default(""),
    consent: z
      .boolean()
      .refine((value) => value, "Merci d'accepter la politique de confidentialité."),
    items: z.array(checkoutItemSchema).min(1, "Votre panier est vide.").max(30),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMode === "DELIVERY" && data.address.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Indiquez une adresse de livraison.",
      });
    }
    const digits = data.customerPhone.replace(/\D/g, "");
    if (digits.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerPhone"],
        message: "Numéro de téléphone trop court.",
      });
    }
  });

export type CheckoutPayload = z.infer<typeof checkoutPayloadSchema>;
export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;

export type ResolvedCheckout = {
  lines: Array<PriceLine & { options: { id: string; name: string; price: number }[]; costPrice: number }>;
  pricing: PricingResult;
  settings: Awaited<ReturnType<typeof getSettings>>;
};

async function resolveItems(
  items: CheckoutItemInput[],
): Promise<Array<PriceLine & { costPrice: number }>> {
  if (!items.length) throw new CheckoutError("Votre panier est vide.");

  const variantIds = [...new Set(items.map((item) => item.variantId))];
  const db = getDb();
  const rows = await db
    .select({
      variant: productVariants,
      product: products,
      category: categories,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(inArray(productVariants.id, variantIds));

  if (rows.length !== variantIds.length) {
    throw new CheckoutError(
      "Un produit du panier n'est plus disponible. Actualisez votre panier.",
      409,
    );
  }

  const rowByVariant = new Map(rows.map((row) => [row.variant.id, row]));
  const productIds = [...new Set(rows.map((row) => row.product.id))];
  const optionRows = await db
    .select({
      productId: productOptions.productId,
      option: options,
    })
    .from(productOptions)
    .innerJoin(options, eq(productOptions.optionId, options.id))
    .where(inArray(productOptions.productId, productIds));

  const allowedOptions = new Map<string, Map<string, typeof options.$inferSelect>>();
  for (const row of optionRows) {
    if (!row.option.isActive) continue;
    if (!allowedOptions.has(row.productId)) allowedOptions.set(row.productId, new Map());
    allowedOptions.get(row.productId)!.set(row.option.id, row.option);
  }

  const merged = new Map<
    string,
    { variantId: string; quantity: number; optionIds: string[] }
  >();
  for (const item of items) {
    const optionIds = [...new Set(item.optionIds)].sort();
    const key = makeCartKey(item.variantId, optionIds);
    const existing = merged.get(key);
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + item.quantity);
    } else {
      merged.set(key, {
        variantId: item.variantId,
        quantity: item.quantity,
        optionIds,
      });
    }
  }

  const lines: Array<PriceLine & { costPrice: number }> = [];
  for (const [lineKey, requested] of merged) {
    const row = rowByVariant.get(requested.variantId);
    if (!row) throw new CheckoutError("Produit introuvable.", 404);
    if (
      !row.variant.isActive ||
      !row.product.isActive ||
      row.product.isArchived ||
      row.product.availability !== "AVAILABLE" ||
      !row.category.isActive ||
      row.category.isArchived ||
      (row.variant.stock !== null && row.variant.stock <= 0)
    ) {
      throw new CheckoutError(
        `« ${row.product.name} » n'est plus disponible. Retirez-le du panier pour continuer.`,
        409,
      );
    }
    if (
      row.variant.stock !== null &&
      requested.quantity > row.variant.stock
    ) {
      throw new CheckoutError(
        `Il ne reste que ${row.variant.stock} unité(s) de « ${row.product.name} — ${row.variant.name} ».`,
        409,
      );
    }

    const requestedOptions: Array<{ id: string; name: string; price: number }> = [];
    for (const optionId of requested.optionIds) {
      const option = allowedOptions.get(row.product.id)?.get(optionId);
      if (!option) {
        throw new CheckoutError(
          "Une option choisie n'est plus disponible pour ce produit.",
          409,
        );
      }
      requestedOptions.push({
        id: option.id,
        name: option.name,
        price: option.price,
      });
    }

    lines.push({
      lineKey,
      productId: row.product.id,
      categoryId: row.category.id,
      variantId: row.variant.id,
      productName: row.product.name,
      variantName: row.variant.name,
      imageUrl: row.variant.imageUrl || row.product.imageUrl,
      unitPrice: row.variant.price,
      costPrice: row.product.costPrice * row.variant.quantity,
      pieceCount: Math.max(1, row.variant.quantity),
      quantity: requested.quantity,
      options: requestedOptions,
    });
  }

  return lines;
}

async function getPromotionRules() {
  const db = getDb();
  const rules = await db
    .select()
    .from(promotions)
    .where(eq(promotions.isActive, true));

  if (!rules.length) return [];

  // Règle explicite : une offre limitée compte les commandes enregistrées
  // non annulées. Un simple clic WhatsApp ne crée aucune commande.
  const usageRows = await db
    .select({
      promotionId: orders.promotionId,
      total: count(),
    })
    .from(orders)
    .where(ne(orders.status, "CANCELLED"))
    .groupBy(orders.promotionId);
  const usage = new Map(
    usageRows
      .filter((row) => row.promotionId)
      .map((row) => [row.promotionId as string, Number(row.total)]),
  );

  return rules.map((promotion) => ({
    ...promotion,
    redemptionCount: usage.get(promotion.id) ?? 0,
  }));
}

async function getCustomerPromotionCounts(
  phone: string,
): Promise<Record<string, number>> {
  const canonical = canonicalPhone(phone);
  if (!canonical) return {};
  const db = getDb();
  const rows = await db
    .select({ promotionId: orders.promotionId, total: count() })
    .from(orders)
    .where(
      and(
        eq(orders.customerPhone, canonical),
        ne(orders.status, "CANCELLED"),
      ),
    )
    .groupBy(orders.promotionId);
  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (row.promotionId) counts[row.promotionId] = Number(row.total);
  }
  return counts;
}

async function getValidatedOrdersForPhone(phone: string): Promise<number> {
  if (!phone) return 0;
  const canonical = canonicalPhone(phone);
  if (!canonical) return 0;
  const db = getDb();
  const [row] = await db
    .select({ total: count() })
    .from(orders)
    .where(
      and(
        eq(orders.customerPhone, canonical),
        eq(orders.status, "COMPLETED"),
      ),
    );
  return Number(row?.total ?? 0);
}

export function canonicalPhone(phone: string): string {
  const digits = normalizeWhatsApp(phone);
  if (!digits) return "";
  return `+${digits}`;
}

export async function priceCheckout(input: {
  items: CheckoutItemInput[];
  promoCode?: string;
  deliveryMode: "DELIVERY" | "PICKUP";
  phone?: string;
  now?: Date;
}): Promise<ResolvedCheckout> {
  const lines = await resolveItems(input.items);
  const settings = await getSettings();
  const rules = await getPromotionRules();
  const validatedOrders = await getValidatedOrdersForPhone(input.phone ?? "");
  const customerPromotionCounts = await getCustomerPromotionCounts(
    input.phone ?? "",
  );

  const pricing = calculatePricing({
    lines,
    deliveryMode: input.deliveryMode,
    promoCode: input.promoCode,
    settings: {
      deliveryFee: settingInt(settings, "deliveryFee", 1000),
      quantityDiscountThreshold: settingInt(
        settings,
        "quantityDiscountThreshold",
        50,
      ),
      quantityDiscountPercent: settingInt(settings, "quantityDiscountPercent", 5),
    },
    promotions: rules,
    now: input.now ?? new Date(),
    validatedOrders,
    customerPromotionCounts,
  });

  return { lines, pricing, settings };
}

export function generateOrderReference(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += alphabet[crypto.randomInt(alphabet.length)];
  }
  return `MG-${suffix}`;
}

export function buildOrderWhatsAppMessage(
  order: Pick<
    Order,
    | "reference"
    | "customerName"
    | "customerPhone"
    | "deliveryMode"
    | "address"
    | "notes"
    | "requestedFor"
    | "subtotal"
    | "quantityDiscount"
    | "promotionDiscount"
    | "deliveryFee"
    | "total"
    | "promoCode"
    | "promotionLabel"
  >,
  items: Array<
    Pick<
      OrderItem,
      "productName" | "variantName" | "quantity" | "unitPrice" | "optionsSnapshot"
    >
  >,
  greeting = "Bonjour Maison Gourmande !",
): string {
  const lineItems = items
    .map((item) => {
      const options = item.optionsSnapshot
        .map((option) => option.name)
        .filter(Boolean);
      const details = [item.variantName, ...options].filter(Boolean).join(", ");
      return `• ${item.quantity} × ${item.productName}${details ? ` (${details})` : ""} — ${formatFCFA(item.unitPrice * item.quantity)}`;
    })
    .join("\n");

  const discountLines: string[] = [];
  if (order.quantityDiscount > 0) {
    discountLines.push(`Remise quantité : −${formatFCFA(order.quantityDiscount)}`);
  }
  if (order.promotionDiscount > 0) {
    discountLines.push(
      `Offre${order.promotionLabel ? ` « ${order.promotionLabel} »` : ""} : −${formatFCFA(order.promotionDiscount)}`,
    );
  }

  return [
    `${greeting} 👋`,
    "",
    `Je viens de passer la commande *${order.reference}* sur votre site.`,
    "",
    "*Ma commande*",
    lineItems,
    "",
    `Sous-total : ${formatFCFA(order.subtotal)}`,
    ...discountLines,
    ...(order.deliveryMode === "DELIVERY"
      ? [
          `Livraison : ${order.deliveryFee === 0 ? "Offerte" : formatFCFA(order.deliveryFee)}`,
        ]
      : []),
    `*Total : ${formatFCFA(order.total)}*`,
    "",
    `Nom : ${order.customerName}`,
    `Téléphone : ${order.customerPhone}`,
    `Mode : ${order.deliveryMode === "DELIVERY" ? "Livraison" : "Retrait sur place"}`,
    order.address ? `Adresse : ${order.address}` : "",
    order.requestedFor ? `Créneau souhaité : ${order.requestedFor}` : "",
    order.promoCode ? `Code promo : ${order.promoCode}` : "",
    order.notes ? `Notes : ${order.notes}` : "",
    "",
    "⚠️ Je comprends que cette commande ne sera confirmée qu'après votre réponse. Aucun paiement n'a été effectué en ligne.",
    "",
    "Merci !",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function buildWhatsAppLink(number: string, message: string): string {
  return `https://wa.me/${normalizeWhatsApp(number)}?text=${encodeURIComponent(message)}`;
}

export async function createOrder(payload: CheckoutPayload): Promise<{
  reference: string;
  whatsappUrl: string;
  total: number;
}> {
  const db = getDb();
  const phone = canonicalPhone(payload.customerPhone);
  if (!phone) throw new CheckoutError("Numéro de téléphone invalide.");

  const { lines, pricing, settings } = await priceCheckout({
    items: payload.items,
    promoCode: payload.promoCode,
    deliveryMode: payload.deliveryMode,
    phone,
  });

  const appliedPromotion = pricing.appliedPromotion;
  if (appliedPromotion) {
    const rule = await db
      .select()
      .from(promotions)
      .where(eq(promotions.id, appliedPromotion.id))
      .limit(1);
    const max = rule[0]?.maxRedemptions ?? null;
    if (max !== null) {
      const [usage] = await db
        .select({ total: count() })
        .from(orders)
        .where(
          and(
            eq(orders.promotionId, appliedPromotion.id),
            ne(orders.status, "CANCELLED"),
          ),
        );
      if (Number(usage?.total ?? 0) >= max) {
        throw new CheckoutError(
          "Cette offre vient d'être épuisée. Retirez le code promo ou réessayez avec une autre offre.",
          409,
        );
      }
    }
  }

  const reference = generateOrderReference();
  const now = new Date();

  const result = await db.transaction(async (tx) => {
    const [customer] = await tx
      .insert(customers)
      .values({
        name: payload.customerName,
        phone,
        email: payload.customerEmail ?? "",
        address: payload.address ?? "",
        isDemo: false,
      })
      .onConflictDoUpdate({
        target: customers.phone,
        set: {
          name: payload.customerName,
          email: payload.customerEmail ?? "",
          address: payload.address ?? "",
          updatedAt: now,
        },
      })
      .returning();

    const [order] = await tx
      .insert(orders)
      .values({
        reference,
        customerId: customer?.id ?? null,
        customerName: payload.customerName,
        customerPhone: phone,
        customerEmail: payload.customerEmail ?? "",
        channel: "WHATSAPP",
        deliveryMode: payload.deliveryMode,
        address: payload.address ?? "",
        notes: payload.notes ?? "",
        requestedFor: payload.requestedFor ?? "",
        subtotal: pricing.subtotal,
        quantityDiscount: pricing.quantityDiscount,
        promotionDiscount: pricing.promotionDiscount,
        deliveryFee: pricing.deliveryFee,
        discountTotal: pricing.discountTotal,
        total: pricing.total,
        promoCode: appliedPromotion?.code ?? null,
        promotionId: appliedPromotion?.id ?? null,
        promotionLabel: appliedPromotion?.name ?? null,
        status: "PENDING",
        paymentStatus: "UNPAID",
        amountReceived: 0,
        isDemo: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const insertedItems = await tx
      .insert(orderItems)
      .values(
        lines.map((line) => ({
          orderId: order.id,
          productId: line.productId,
          variantId: line.variantId,
          productName: line.productName,
          variantName: line.variantName,
          imageUrl: line.imageUrl,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          lineTotal:
            (line.unitPrice +
              line.options.reduce((sum, option) => sum + option.price, 0)) *
            line.quantity,
          costPrice: line.costPrice,
          optionsSnapshot: line.options,
        })),
      )
      .returning();

    return { order, insertedItems };
  });

  await logAudit({
    actor: null,
    action: "Nouvelle commande publique",
    entity: "order",
    entityId: result.order.id,
    details: {
      reference,
      total: pricing.total,
      canal: "WhatsApp",
      statut: "PENDING",
    },
  });

  const message = buildOrderWhatsAppMessage(
    result.order,
    result.insertedItems,
    settings.whatsappGreeting,
  );
  const whatsappUrl = buildWhatsAppLink(
    getWhatsAppNumber(settings),
    message,
  );

  return {
    reference,
    whatsappUrl,
    total: pricing.total,
  };
}

export async function getOrderWithItems(reference: string) {
  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.reference, reference.toUpperCase()))
    .limit(1);
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  return { order, items };
}

export async function buildWhatsAppUrlForExistingOrder(
  reference: string,
): Promise<string | null> {
  const settings = await getSettings();
  const result = await getOrderWithItems(reference);
  if (!result) return null;
  return buildWhatsAppLink(
    getWhatsAppNumber(settings),
    buildOrderWhatsAppMessage(
      result.order,
      result.items,
      settings.whatsappGreeting,
    ),
  );
}
