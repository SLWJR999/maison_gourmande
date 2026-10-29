import { NextResponse } from "next/server";
import { and, desc, eq, gte, inArray, like, lte, or } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, orders, type OrderChannel } from "@/db/schema";
import { can, getCurrentUser } from "@/lib/auth";
import { toCsv } from "@/lib/admin";
import { ORDER_CHANNEL_LABELS, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-status";

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "orders:read")) {
    return new NextResponse("Non autorisé", { status: 401 });
  }
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const conditions = [];
  const status = url.searchParams.get("statut");
  if (status && (STATUSES as readonly string[]).includes(status)) {
    conditions.push(eq(orders.status, status as (typeof STATUSES)[number]));
  }
  const channel = url.searchParams.get("canal");
  if (channel === "WHATSAPP" || channel === "ADMIN") {
    conditions.push(eq(orders.channel, channel as OrderChannel));
  }
  if (q) {
    const search = `%${q}%`;
    conditions.push(
      or(
        like(orders.reference, search),
        like(orders.customerName, search),
        like(orders.customerPhone, search),
      )!,
    );
  }
  const from = url.searchParams.get("from");
  if (from) {
    const date = new Date(`${from}T00:00:00`);
    if (!Number.isNaN(date.getTime())) conditions.push(gte(orders.createdAt, date));
  }
  const to = url.searchParams.get("to");
  if (to) {
    const date = new Date(`${to}T23:59:59`);
    if (!Number.isNaN(date.getTime())) conditions.push(lte(orders.createdAt, date));
  }
  const demo = url.searchParams.get("demo");
  if (demo === "0") conditions.push(eq(orders.isDemo, false));
  if (demo === "1") conditions.push(eq(orders.isDemo, true));

  const where = conditions.length ? and(...conditions) : undefined;
  const db = getDb();
  const rows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(5000);
  const ids = rows.map((row) => row.id);
  const itemRows = ids.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
    : [];
  const itemsByOrder = new Map<string, typeof itemRows>();
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  const headers = [
    "Référence",
    "Date",
    "Canal",
    "Statut",
    "Paiement",
    "Client",
    "Téléphone",
    "E-mail",
    "Mode",
    "Adresse",
    "Créneau",
    "Sous-total",
    "Remise quantité",
    "Offre",
    "Livraison",
    "Total",
    "Encaissé déclaré",
    "Moyen de paiement",
    "Démo",
    "Articles",
  ];
  const csvRows = rows.map((order) => [
    order.reference,
    order.createdAt.toISOString(),
    ORDER_CHANNEL_LABELS[order.channel],
    ORDER_STATUS_LABELS[order.status],
    PAYMENT_STATUS_LABELS[order.paymentStatus],
    order.customerName,
    order.customerPhone,
    order.customerEmail,
    order.deliveryMode === "DELIVERY" ? "Livraison" : "Retrait",
    order.address,
    order.requestedFor,
    order.subtotal,
    order.quantityDiscount,
    order.promotionDiscount,
    order.deliveryFee,
    order.total,
    order.amountReceived,
    order.paymentMethod,
    order.isDemo ? "Oui" : "Non",
    (itemsByOrder.get(order.id) ?? [])
      .map(
        (item) =>
          `${item.quantity} × ${item.productName} (${item.variantName})`,
      )
      .join(" | "),
  ]);

  // BOM UTF-8 : Excel ouvre correctement les accents sur Windows.
  const csv = `\uFEFF${toCsv(headers, csvRows)}`;
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="maison-gourmande-commandes-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
