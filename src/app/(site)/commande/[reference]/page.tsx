import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";
import {
  buildWhatsAppUrlForExistingOrder,
  getOrderWithItems,
} from "@/lib/checkout";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
} from "@/lib/order-status";
import { formatDateTime, formatFCFA, formatPhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ma commande",
  robots: { index: false, follow: false },
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const result = await getOrderWithItems(reference);
  if (!result) notFound();
  const { order, items } = result;
  const whatsappUrl = await buildWhatsAppUrlForExistingOrder(order.reference);
  const currentStep = ORDER_STATUS_FLOW.indexOf(order.status);
  const cancelled = order.status === "CANCELLED";

  return (
    <div className="container-page pb-20 pt-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">
              <span className="h-px w-6 bg-mauve" />
              Suivi de commande
            </p>
            <h1 className="mt-2 text-[38px] leading-none text-mauve-900 sm:text-[46px]">
              Commande <em className="text-mauve">{order.reference}</em>
            </h1>
            <p className="mt-2 text-[12px] text-brown-soft">
              Enregistrée le {formatDateTime(order.createdAt)} ·{" "}
              {order.isDemo ? "Données de démonstration" : "Commande réelle"}
            </p>
          </div>
          <span
            className={`status-pill ${ORDER_STATUS_STYLES[order.status]}`}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        <div
          className={`mt-6 flex items-start gap-3 rounded-[1.5rem] border p-4 ${
            cancelled
              ? "border-red-200 bg-red-50"
              : order.status === "PENDING"
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50"
          }`}
        >
          {cancelled ? (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          ) : order.status === "PENDING" ? (
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          )}
          <div>
            <p className="text-sm font-extrabold text-brown">
              {cancelled
                ? "Cette commande a été annulée."
                : order.status === "PENDING"
                  ? "Votre commande est enregistrée, en attente de confirmation."
                  : ORDER_STATUS_LABELS[order.status]}
            </p>
            <p className="mt-1 text-[12px] leading-6 text-brown-soft">
              {cancelled
                ? order.cancelReason ||
                  "Contactez la maison sur WhatsApp pour toute question."
                : order.status === "PENDING"
                  ? "La boutique doit maintenant confirmer la disponibilité, le prix final et le délai. Le simple enregistrement ou l'ouverture de WhatsApp ne vaut pas confirmation."
                  : "La maison a pris en charge votre commande. Le suivi est mis à jour par la boutique."}
            </p>
            {order.cancelReason && !cancelled ? (
              <p className="mt-1 text-[11px] text-brown-light">
                Raison : {order.cancelReason}
              </p>
            ) : null}
          </div>
        </div>

        {!cancelled ? (
          <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {ORDER_STATUS_FLOW.map((status, index) => {
              const reached = currentStep >= index;
              return (
                <li
                  key={status}
                  className={`rounded-xl border px-2.5 py-2 text-center text-[9px] font-extrabold uppercase tracking-wide ${
                    reached
                      ? "border-mauve/30 bg-mauve-100 text-mauve-800"
                      : "border-brown/10 bg-white text-brown-light"
                  }`}
                >
                  <span className="mb-1 flex justify-center">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] ${
                        reached ? "bg-mauve text-white" : "bg-cream text-brown-light"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </span>
                  {ORDER_STATUS_LABELS[status]}
                </li>
              );
            })}
          </ol>
        ) : null}

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[1.75rem] border border-brown/10 bg-white shadow-card">
            <div className="border-b border-brown/10 px-5 py-4">
              <h2 className="font-display text-xl text-mauve-900">Votre commande</h2>
            </div>
            <ul className="divide-y divide-brown/10">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 px-5 py-4">
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl || "/images/spread.jpg"}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[17px] leading-tight text-brown">
                      {item.productName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-brown-soft">
                      {item.quantity} × {item.variantName}
                    </p>
                    {item.optionsSnapshot.length ? (
                      <p className="mt-1 text-[10px] text-brown-light">
                        {item.optionsSnapshot.map((option) => option.name).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-[13px] font-extrabold text-mauve-900">
                    {formatFCFA(item.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="space-y-2 border-t border-brown/10 bg-cream/40 px-5 py-4 text-[12px]">
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
                  <span>{order.promotionLabel || "Offre appliquée"}</span>
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
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brown-light">
                  Total estimé
                </span>
                <span className="font-display text-2xl text-mauve-900">
                  {formatFCFA(order.total)}
                </span>
              </div>
              {order.paymentStatus !== "UNPAID" ? (
                <p className="text-right text-[10px] text-emerald-700">
                  Encaissé déclaré : {formatFCFA(order.amountReceived)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-card">
              <h2 className="font-display text-lg text-mauve-900">Réception</h2>
              <ul className="mt-3 space-y-3 text-[12px] leading-5 text-brown-soft">
                <li className="flex items-start gap-2">
                  <Package className="mt-0.5 h-4 w-4 shrink-0 text-mauve" />
                  {order.deliveryMode === "DELIVERY" ? "Livraison" : "Retrait sur place"}
                </li>
                {order.address ? (
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mauve" />
                    {order.address}
                  </li>
                ) : null}
                {order.requestedFor ? (
                  <li className="flex items-start gap-2">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-mauve" />
                    Créneau souhaité : {order.requestedFor}
                  </li>
                ) : null}
                <li className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-mauve" />
                  {order.customerName} · {formatPhone(order.customerPhone)}
                </li>
                {order.notes ? (
                  <li className="rounded-xl bg-cream px-3 py-2 text-[11px] italic">
                    Note : {order.notes}
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="rounded-[1.5rem] bg-mauve-900 p-5 text-white shadow-card">
              <MessageCircle className="h-6 w-6 text-ochre-light" />
              <h2 className="mt-2 font-display text-xl text-white">
                Votre message WhatsApp
              </h2>
              <p className="mt-1 text-[11px] leading-5 text-mauve-200/80">
                Si vous n'avez pas encore envoyé le message, vous pouvez le faire
                maintenant. La boutique confirmera ensuite la commande.
              </p>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn-cream mt-3 w-full text-xs"
                >
                  Ouvrir WhatsApp
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>

            <Link href="/menu" className="btn-secondary w-full text-xs">
              <ShoppingBag className="h-4 w-4" />
              Commander autre chose
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-brown/10 bg-white/60 p-4 text-[11px] leading-5 text-brown-soft">
          <ReceiptText className="mt-0.5 h-4 w-4 shrink-0 text-mauve" />
          Conservez cette référence. Elle permet à la maison de retrouver votre
          commande. Aucun paiement en ligne n'a été effectué : le règlement se fait
          selon les modalités convenues avec la boutique.
        </div>
      </div>
    </div>
  );
}
