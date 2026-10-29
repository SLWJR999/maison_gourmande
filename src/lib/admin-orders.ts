import { getDb } from "@/db";
import {
  customers,
  orderItems,
  orders,
  type PaymentStatus,
} from "@/db/schema";
import {
  canonicalPhone,
  generateOrderReference,
  priceCheckout,
  type CheckoutItemInput,
} from "@/lib/checkout";
import { getSettings } from "@/lib/settings";
import { formatFCFA } from "@/lib/utils";

export type ManualOrderInput = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryMode: "DELIVERY" | "PICKUP";
  address?: string;
  notes?: string;
  requestedFor?: string;
  promoCode?: string;
  status?: "PENDING" | "CONFIRMED";
  paymentStatus?: PaymentStatus;
  amountReceived?: number;
  paymentMethod?: string;
  items: CheckoutItemInput[];
  createdBy: string;
};

export type ManualOrderResult = {
  id: string;
  reference: string;
  total: number;
  whatsappUrl: string;
};

export async function createManualOrder(
  input: ManualOrderInput,
): Promise<ManualOrderResult> {
  const phone = canonicalPhone(input.customerPhone);
  if (!phone) throw new Error("Numéro de téléphone invalide.");
  const pricingResult = await priceCheckout({
    items: input.items,
    promoCode: input.promoCode,
    deliveryMode: input.deliveryMode,
    phone,
  });
  const { lines, pricing } = pricingResult;
  if (!lines.length) throw new Error("Ajoutez au moins un produit.");
  const db = getDb();
  const now = new Date();
  const reference = generateOrderReference();
  const amountReceived =
    input.paymentStatus === "PAID"
      ? pricing.total
      : input.paymentStatus === "PARTIAL"
        ? Math.max(0, Math.min(pricing.total, input.amountReceived ?? 0))
        : 0;
  const paymentStatus: PaymentStatus =
    amountReceived >= pricing.total && pricing.total > 0
      ? "PAID"
      : amountReceived > 0
        ? "PARTIAL"
        : "UNPAID";

  const result = await db.transaction(async (tx) => {
    const [customer] = await tx
      .insert(customers)
      .values({
        name: input.customerName,
        phone,
        email: input.customerEmail ?? "",
        address: input.address ?? "",
        isDemo: false,
      })
      .onConflictDoUpdate({
        target: customers.phone,
        set: {
          name: input.customerName,
          email: input.customerEmail ?? "",
          address: input.address ?? "",
          updatedAt: now,
        },
      })
      .returning();

    const [order] = await tx
      .insert(orders)
      .values({
        reference,
        customerId: customer?.id ?? null,
        customerName: input.customerName,
        customerPhone: phone,
        customerEmail: input.customerEmail ?? "",
        channel: "ADMIN",
        deliveryMode: input.deliveryMode,
        address: input.address ?? "",
        notes: input.notes ?? "",
        requestedFor: input.requestedFor ?? "",
        subtotal: pricing.subtotal,
        quantityDiscount: pricing.quantityDiscount,
        promotionDiscount: pricing.promotionDiscount,
        deliveryFee: pricing.deliveryFee,
        discountTotal: pricing.discountTotal,
        total: pricing.total,
        promoCode: pricing.appliedPromotion?.code ?? null,
        promotionId: pricing.appliedPromotion?.id ?? null,
        promotionLabel: pricing.appliedPromotion?.name ?? null,
        status: input.status ?? "PENDING",
        paymentStatus,
        amountReceived,
        paymentMethod: input.paymentMethod ?? "",
        isDemo: false,
        createdBy: input.createdBy,
        confirmedAt: input.status === "CONFIRMED" ? now : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const inserted = await tx
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

    return { order, inserted };
  });

  const settings = await getSettings();
  const greeting = settings.whatsappGreeting;
  const itemsText = result.inserted
    .map(
      (item) =>
        `• ${item.quantity} × ${item.productName} (${item.variantName}) — ${formatFCFA(item.lineTotal)}`,
    )
    .join("\n");
  const message = [
    greeting,
    "",
    `Votre commande *${reference}* a bien été enregistrée par la maison.`,
    "",
    itemsText,
    "",
    `Total : ${formatFCFA(pricing.total)}`,
    input.deliveryMode === "DELIVERY"
      ? `Livraison : ${input.address || "adresse à confirmer"}`
      : "Retrait sur place",
    input.requestedFor ? `Créneau : ${input.requestedFor}` : "",
    "",
    "La maison vous confirme les détails et le règlement. Aucun paiement en ligne n'a été effectué.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    id: result.order.id,
    reference,
    total: pricing.total,
    whatsappUrl: `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
  };
}
