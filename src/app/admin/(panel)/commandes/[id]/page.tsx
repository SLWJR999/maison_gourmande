import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Save,
  ShoppingBag,
  User,
} from "lucide-react";
import { getDb } from "@/db";
import { customers, orderItems, orders } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import {
  formatDateTime,
  formatFCFA,
  formatPhone,
} from "@/lib/utils";
import {
  ORDER_CHANNEL_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_METHODS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/order-status";
import {
  AdminBreadcrumb,
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { updateOrder } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Détail de commande" };

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requirePermission("orders:read");
  const { id } = await params;
  const notices = await searchParams;
  const db = getDb();
  const [row] = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, id))
    .limit(1);
  if (!row) notFound();
  const { order, customer } = row;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  const balance = Math.max(0, order.total - order.amountReceived);
  const digits = order.customerPhone.replace(/\D/g, "");
  const waMessage = encodeURIComponent(
    `Bonjour ${order.customerName}, ici Maison Gourmande. Votre commande ${order.reference} est actuellement « ${ORDER_STATUS_LABELS[order.status]} ». Total : ${formatFCFA(order.total)}. Nous restons disponibles pour toute précision.`,
  );
  const waHref = `https://wa.me/${digits}?text=${waMessage}`;
  const costTotal = items.reduce(
    (sum, item) => sum + item.costPrice * item.quantity,
    0,
  );
  const missingCost = items.some((item) => item.costPrice === 0);

  return (
    <div className="space-y-5">
      <AdminBreadcrumb
        items={[
          { href: "/admin/commandes", label: "Commandes" },
          { label: order.reference },
        ]}
      />
      <AdminPageHeader
        eyebrow={`${ORDER_CHANNEL_LABELS[order.channel]} · ${formatDateTime(order.createdAt)}${order.isDemo ? " · DÉMO" : ""}`}
        title={order.reference}
        description={`${order.customerName} · ${formatPhone(order.customerPhone)} · ${order.deliveryMode === "DELIVERY" ? "Livraison" : "Retrait sur place"}`}
        actions={
          <>
            <Link href={`/commande/${order.reference}`} target="_blank" className="btn-secondary btn-sm">
              <ExternalLink className="h-3.5 w-3.5" />
              Page de suivi
            </Link>
            <a href={waHref} target="_blank" rel="noreferrer noopener" className="btn-primary btn-sm">
              <MessageCircle className="h-3.5 w-3.5" />
              Contacter le client
            </a>
            <Link href="/admin/commandes" className="btn-ghost btn-sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour
            </Link>
          </>
        }
      />
      {notices.ok ? <AdminNotice>{notices.ok}</AdminNotice> : null}
      {notices.error ? <AdminNotice tone="error">{notices.error}</AdminNotice> : null}

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr] xl:items-start">
        <div className="space-y-4">
          <section className="admin-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brown/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-mauve" />
                <h2 className="font-display text-lg text-mauve-900">Articles</h2>
              </div>
              <span className={`status-pill ${ORDER_STATUS_STYLES[order.status]}`}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
            <ul className="divide-y divide-brown/10">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 p-3.5">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl || "/images/spread.jpg"}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-extrabold text-brown">{item.productName}</p>
                    <p className="text-[10px] text-brown-light">
                      {item.quantity} × {item.variantName} · {formatFCFA(item.unitPrice)} / unité
                    </p>
                    {item.optionsSnapshot.length ? (
                      <p className="mt-0.5 text-[10px] text-mauve-700">
                        {item.optionsSnapshot.map((option) => `${option.name}${option.price ? ` (+${formatFCFA(option.price)})` : ""}`).join(" · ")}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-[9px] text-brown-light">
                      Coût matière historique : {item.costPrice > 0 ? formatFCFA(item.costPrice * item.quantity) : "non renseigné"}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-[12px] font-extrabold text-mauve-900">
                    {formatFCFA(item.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="space-y-1.5 border-t border-brown/10 bg-cream/40 px-4 py-3 text-[11px]">
              <div className="flex justify-between text-brown-soft">
                <span>Sous-total</span>
                <span className="font-bold text-brown">{formatFCFA(order.subtotal)}</span>
              </div>
              {order.quantityDiscount > 0 ? (
                <div className="flex justify-between text-mauve-700">
                  <span>Remise quantité</span>
                  <span className="font-bold">−{formatFCFA(order.quantityDiscount)}</span>
                </div>
              ) : null}
              {order.promotionDiscount > 0 ? (
                <div className="flex justify-between text-mauve-700">
                  <span>{order.promotionLabel || "Offre"}{order.promoCode ? ` (${order.promoCode})` : ""}</span>
                  <span className="font-bold">−{formatFCFA(order.promotionDiscount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-brown-soft">
                <span>Livraison</span>
                <span className="font-bold text-brown">
                  {order.deliveryFee === 0 ? "Offerte" : formatFCFA(order.deliveryFee)}
                </span>
              </div>
              <div className="flex items-end justify-between border-t border-brown/10 pt-2">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-brown-light">
                  Total
                </span>
                <span className="font-display text-2xl text-mauve-900">{formatFCFA(order.total)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-emerald-700">
                <span>Encaissé déclaré</span>
                <span className="font-bold">{formatFCFA(order.amountReceived)}</span>
              </div>
              {balance > 0 ? (
                <div className="flex justify-between text-[10px] text-amber-700">
                  <span>Reste à encaisser</span>
                  <span className="font-bold">{formatFCFA(balance)}</span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="admin-card p-4">
            <h2 className="font-display text-lg text-mauve-900">Informations client</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2 text-[11px] text-brown-soft">
                <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mauve" />
                <div>
                  <p className="font-bold text-brown">{order.customerName}</p>
                  {customer ? (
                    <p className="text-[9px] text-brown-light">
                      Client depuis {formatDateTime(customer.createdAt)}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-brown-soft">
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mauve" />
                <div>
                  <p className="font-bold text-brown">{order.customerPhone}</p>
                  {order.customerEmail ? (
                    <p className="text-[9px] text-brown-light">{order.customerEmail}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-brown-soft">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mauve" />
                <div>
                  <p className="font-bold text-brown">
                    {order.deliveryMode === "DELIVERY" ? "Livraison" : "Retrait"}
                  </p>
                  <p className="text-[10px] leading-5">
                    {order.address || "Adresse non renseignée"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-brown-soft">
                <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mauve" />
                <div>
                  <p className="font-bold text-brown">Créneau demandé</p>
                  <p className="text-[10px]">{order.requestedFor || "Non précisé"}</p>
                </div>
              </div>
            </div>
            {order.notes ? (
              <div className="mt-3 rounded-xl bg-cream px-3 py-2 text-[11px] leading-5 text-brown-soft">
                <span className="font-bold text-brown">Note : </span>
                {order.notes}
              </div>
            ) : null}
          </section>

          <section className="admin-card p-4">
            <h2 className="font-display text-lg text-mauve-900">Coûts & marge de cette commande</h2>
            <div className="mt-2 grid gap-2 text-[11px] sm:grid-cols-3">
              <div className="rounded-xl bg-cream/60 p-3">
                <p className="text-[9px] font-bold uppercase text-brown-light">Total facturé</p>
                <p className="mt-1 font-bold text-brown">{formatFCFA(order.total)}</p>
              </div>
              <div className="rounded-xl bg-cream/60 p-3">
                <p className="text-[9px] font-bold uppercase text-brown-light">Coût matières historique</p>
                <p className="mt-1 font-bold text-brown">{formatFCFA(costTotal)}</p>
              </div>
              <div className="rounded-xl bg-cream/60 p-3">
                <p className="text-[9px] font-bold uppercase text-brown-light">Marge brute indicative</p>
                <p className="mt-1 font-bold text-mauve-900">{formatFCFA(order.total - costTotal)}</p>
              </div>
            </div>
            {missingCost ? (
              <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-5 text-amber-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Un coût matière manque sur au moins un article : la marge est incomplète.
              </p>
            ) : null}
            <p className="mt-2 text-[9px] leading-4 text-brown-light">
              La marge inclut les remises mais pas les charges fixes, la livraison
              ni les dépenses générales. Elle est indicative.
            </p>
          </section>
        </div>

        <div className="space-y-4 xl:sticky xl:top-20">
          <section className="admin-card p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-mauve" />
              <h2 className="font-display text-lg text-mauve-900">Suivi & paiement</h2>
            </div>
            <form action={updateOrder} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <div>
                <label htmlFor="status" className="admin-label">Statut de la commande</label>
                <select id="status" name="status" defaultValue={order.status} className="admin-select">
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="paymentStatus" className="admin-label">Paiement</label>
                <select id="paymentStatus" name="paymentStatus" defaultValue={order.paymentStatus} className="admin-select">
                  <option value="UNPAID">Non encaissé</option>
                  <option value="PARTIAL">Partiellement encaissé</option>
                  <option value="PAID">Encaissé intégralement</option>
                </select>
                <p className="mt-1 text-[9px] text-brown-light">
                  Actuellement : {PAYMENT_STATUS_LABELS[order.paymentStatus]} · {formatFCFA(order.amountReceived)}
                </p>
              </div>
              <div>
                <label htmlFor="amountReceived" className="admin-label">Montant reçu (FCFA)</label>
                <input
                  id="amountReceived"
                  name="amountReceived"
                  type="number"
                  min={0}
                  max={order.total}
                  defaultValue={order.amountReceived}
                  className="admin-input"
                />
              </div>
              <div>
                <label htmlFor="paymentMethod" className="admin-label">Moyen de paiement</label>
                <select id="paymentMethod" name="paymentMethod" defaultValue={order.paymentMethod} className="admin-select">
                  <option value="">Non précisé</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="cancelReason" className="admin-label">Motif d'annulation</label>
                <textarea
                  id="cancelReason"
                  name="cancelReason"
                  rows={2}
                  defaultValue={order.cancelReason}
                  className="admin-textarea"
                  placeholder="Obligatoire si la commande est annulée."
                />
              </div>
              {order.status === "CANCELLED" ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-[10px] leading-5 text-red-700">
                  Cette commande est annulée : elle ne compte pas dans les
                  plafonds des promotions ni dans le chiffre d'affaires des
                  rapports.
                  {order.cancelReason ? ` Motif : ${order.cancelReason}` : ""}
                </div>
              ) : null}
              <button type="submit" className="btn-primary btn-sm w-full">
                <Save className="h-3.5 w-3.5" />
                Enregistrer
              </button>
            </form>
          </section>

          <section className="admin-card p-4">
            <h2 className="font-display text-lg text-mauve-900">Métadonnées</h2>
            <dl className="mt-3 space-y-2 text-[10px]">
              <div className="flex justify-between gap-3">
                <dt className="text-brown-light">Canal</dt>
                <dd className="font-bold text-brown">{ORDER_CHANNEL_LABELS[order.channel]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-brown-light">Créée le</dt>
                <dd className="text-right font-bold text-brown">{formatDateTime(order.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-brown-light">Confirmée le</dt>
                <dd className="text-right font-bold text-brown">{order.confirmedAt ? formatDateTime(order.confirmedAt) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-brown-light">Terminée le</dt>
                <dd className="text-right font-bold text-brown">{order.completedAt ? formatDateTime(order.completedAt) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-brown-light">Référence</dt>
                <dd className="font-mono text-[9px] font-bold text-brown">{order.reference}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
