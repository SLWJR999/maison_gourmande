"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { orders, type OrderStatus, type PaymentStatus } from "@/db/schema";
import { logAudit, requirePermission } from "@/lib/auth";
import { createManualOrder } from "@/lib/admin-orders";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createOffsiteOrder(formData: FormData) {
  const user = await requirePermission("orders:write");
  const back = "/admin/commandes/nouvelle";
  const customerName = text(formData, "customerName");
  const customerPhone = text(formData, "customerPhone");
  const deliveryMode =
    text(formData, "deliveryMode") === "PICKUP" ? "PICKUP" : "DELIVERY";
  const address = text(formData, "address");
  if (customerName.length < 2) {
    redirect(`${back}?error=${encodeURIComponent("Indiquez le nom du client.")}`);
  }
  if (customerPhone.replace(/\D/g, "").length < 8) {
    redirect(`${back}?error=${encodeURIComponent("Numéro de téléphone invalide.")}`);
  }
  if (deliveryMode === "DELIVERY" && address.length < 5) {
    redirect(`${back}?error=${encodeURIComponent("Indiquez l'adresse de livraison.")}`);
  }

  const variantIds = formData.getAll("variantId").map(String);
  const quantities = formData.getAll("quantity").map(String);
  const items = [] as Array<{ variantId: string; quantity: number; optionIds: string[] }>;
  const seen = new Map<string, number>();
  for (let index = 0; index < variantIds.length; index += 1) {
    const variantId = variantIds[index];
    const quantity = Number.parseInt(quantities[index] ?? "", 10);
    if (!variantId || !Number.isFinite(quantity) || quantity <= 0) continue;
    seen.set(variantId, (seen.get(variantId) ?? 0) + quantity);
  }
  for (const [variantId, quantity] of seen) {
    items.push({ variantId, quantity: Math.min(99, quantity), optionIds: [] });
  }
  if (!items.length) {
    redirect(`${back}?error=${encodeURIComponent("Ajoutez au moins un produit.")}`);
  }

  const paymentRaw = text(formData, "paymentStatus");
  const paymentStatus: PaymentStatus =
    paymentRaw === "PAID" || paymentRaw === "PARTIAL" ? paymentRaw : "UNPAID";
  const amountReceived = Math.max(
    0,
    Number.parseInt(text(formData, "amountReceived"), 10) || 0,
  );

  try {
    const result = await createManualOrder({
      customerName,
      customerPhone,
      customerEmail: text(formData, "customerEmail"),
      deliveryMode,
      address,
      notes: text(formData, "notes"),
      requestedFor: text(formData, "requestedFor"),
      promoCode: text(formData, "promoCode"),
      status: text(formData, "initialStatus") === "CONFIRMED" ? "CONFIRMED" : "PENDING",
      paymentStatus,
      amountReceived,
      paymentMethod: text(formData, "paymentMethod"),
      items,
      createdBy: user.id,
    });
    await logAudit({
      actor: user,
      action: "Commande hors site créée",
      entity: "order",
      entityId: result.id,
      details: { reference: result.reference, total: result.total },
    });
    revalidatePath("/admin/commandes");
    revalidatePath("/admin");
    redirect(`/admin/commandes/${result.id}?ok=Commande%20hors%20site%20enregistrée`);
  } catch (error) {
    console.error(error);
    redirect(
      `${back}?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Création impossible.",
      )}`,
    );
  }
}

export async function updateOrder(formData: FormData) {
  const user = await requirePermission("orders:write");
  const id = text(formData, "id");
  if (!id) redirect("/admin/commandes");
  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) redirect("/admin/commandes?error=Commande%20introuvable");

  const statusRaw = text(formData, "status");
  const allowedStatuses: OrderStatus[] = [
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "COMPLETED",
    "CANCELLED",
  ];
  const status = allowedStatuses.includes(statusRaw as OrderStatus)
    ? (statusRaw as OrderStatus)
    : order.status;
  const paymentRaw = text(formData, "paymentStatus");
  const paymentStatus: PaymentStatus =
    paymentRaw === "PAID" || paymentRaw === "PARTIAL" || paymentRaw === "UNPAID"
      ? paymentRaw
      : order.paymentStatus;
  let amountReceived = Math.max(
    0,
    Number.parseInt(text(formData, "amountReceived"), 10) || 0,
  );
  if (paymentStatus === "PAID") amountReceived = order.total;
  if (paymentStatus === "UNPAID") amountReceived = 0;
  amountReceived = Math.min(order.total, amountReceived);
  const cancelReason = text(formData, "cancelReason");
  if (status === "CANCELLED" && cancelReason.length < 3) {
    redirect(
      `/admin/commandes/${id}?error=${encodeURIComponent(
        "Indiquez le motif d'annulation.",
      )}`,
    );
  }

  const now = new Date();
  const confirmedAt =
    order.confirmedAt ??
    (["CONFIRMED", "PREPARING", "READY", "COMPLETED"].includes(status)
      ? now
      : null);
  const completedAt =
    status === "COMPLETED" ? order.completedAt ?? now : order.completedAt;

  await db
    .update(orders)
    .set({
      status,
      paymentStatus,
      amountReceived,
      paymentMethod: text(formData, "paymentMethod"),
      cancelReason: status === "CANCELLED" ? cancelReason : order.cancelReason,
      confirmedAt,
      completedAt,
      updatedAt: now,
    })
    .where(eq(orders.id, id));

  await logAudit({
    actor: user,
    action:
      status === "CANCELLED"
        ? "Commande annulée"
        : status !== order.status
          ? "Statut de commande modifié"
          : "Paiement de commande mis à jour",
    entity: "order",
    entityId: id,
    details: {
      reference: order.reference,
      ancienStatut: order.status,
      nouveauStatut: status,
      ancienPaiement: order.paymentStatus,
      nouveauPaiement: paymentStatus,
      encaisse: amountReceived,
      motifAnnulation: status === "CANCELLED" ? cancelReason : undefined,
    },
  });

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${id}`);
  revalidatePath("/admin");
  revalidatePath(`/commande/${order.reference}`);
  redirect(`/admin/commandes/${id}?ok=Commande%20mise%20à%20jour`);
}
