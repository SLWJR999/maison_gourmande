import Link from "next/link";
import { ArrowLeft, Info, Plus } from "lucide-react";
import { getActiveVariantChoices } from "@/lib/admin";
import { PAYMENT_METHODS } from "@/lib/order-status";
import { requirePermission } from "@/lib/auth";
import { formatFCFA } from "@/lib/utils";
import {
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { createOffsiteOrder } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nouvelle commande hors site" };

export default async function NewOffsiteOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("orders:write");
  const params = await searchParams;
  const variants = await getActiveVariantChoices();
  const grouped = new Map<string, typeof variants>();
  for (const variant of variants) {
    const list = grouped.get(variant.productName) ?? [];
    list.push(variant);
    grouped.set(variant.productName, list);
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Commandes"
        title="Commande hors site"
        description="Saisissez une commande prise par téléphone, sur place ou en direct sur WhatsApp. Les prix et remises sont vérifiés côté serveur."
        actions={
          <Link href="/admin/commandes" className="btn-secondary btn-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Link>
        }
      />
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}
      <div className="flex items-start gap-2 rounded-xl border border-mauve-200 bg-mauve-100/40 p-3 text-[10px] leading-5 text-mauve-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Cette commande est identifiée « Hors site » dans les statistiques. Elle
        compte dans les plafonds de promotion uniquement si elle est enregistrée
        puis non annulée.
      </div>

      <form action={createOffsiteOrder} className="space-y-4">
        <section className="admin-card p-4 sm:p-5">
          <h2 className="font-display text-xl text-mauve-900">Client</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="customerName" className="admin-label">Nom *</label>
              <input id="customerName" name="customerName" required className="admin-input" placeholder="Aïcha Koné" />
            </div>
            <div>
              <label htmlFor="customerPhone" className="admin-label">Téléphone *</label>
              <input id="customerPhone" name="customerPhone" required inputMode="tel" className="admin-input" placeholder="07 00 00 00 00" />
            </div>
            <div>
              <label htmlFor="customerEmail" className="admin-label">E-mail</label>
              <input id="customerEmail" name="customerEmail" type="email" className="admin-input" />
            </div>
            <div>
              <label htmlFor="requestedFor" className="admin-label">Créneau souhaité</label>
              <input id="requestedFor" name="requestedFor" className="admin-input" placeholder="Samedi 12h30 / dès que possible" />
            </div>
          </div>
        </section>

        <section className="admin-card p-4 sm:p-5">
          <h2 className="font-display text-xl text-mauve-900">Produits</h2>
          <p className="mt-0.5 text-[10px] text-brown-light">
            Ajoutez jusqu'à 8 lignes. Pour les options, ajoutez une note ou
            créez la commande depuis le panier côté client si nécessaire.
          </p>
          <div className="mt-3 space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="grid grid-cols-[1fr_80px] gap-2">
                <select
                  name="variantId"
                  className="admin-select text-[11px]"
                  aria-label={`Produit ligne ${index + 1}`}
                >
                  <option value="">— Ligne {index + 1} —</option>
                  {Array.from(grouped.entries()).map(([productName, list]) => (
                    <optgroup key={productName} label={productName}>
                      {list.map((variant) => (
                        <option key={variant.variantId} value={variant.variantId}>
                          {variant.variantName} · {formatFCFA(variant.price)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  max={99}
                  defaultValue={index === 0 ? 1 : ""}
                  className="admin-input text-center"
                  placeholder="Qté"
                  aria-label={`Quantité ligne ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="admin-card p-4 sm:p-5">
          <h2 className="font-display text-xl text-mauve-900">Réception & règlement</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="deliveryMode" className="admin-label">Mode</label>
              <select id="deliveryMode" name="deliveryMode" className="admin-select" defaultValue="DELIVERY">
                <option value="DELIVERY">Livraison</option>
                <option value="PICKUP">Retrait sur place</option>
              </select>
            </div>
            <div>
              <label htmlFor="initialStatus" className="admin-label">Statut initial</label>
              <select id="initialStatus" name="initialStatus" className="admin-select" defaultValue="PENDING">
                <option value="PENDING">En attente de confirmation</option>
                <option value="CONFIRMED">Confirmée</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address" className="admin-label">Adresse de livraison</label>
              <input id="address" name="address" className="admin-input" placeholder="Quartier, repère, immeuble…" />
            </div>
            <div>
              <label htmlFor="promoCode" className="admin-label">Code promo</label>
              <input id="promoCode" name="promoCode" className="admin-input uppercase" placeholder="MARDI10" />
            </div>
            <div>
              <label htmlFor="paymentStatus" className="admin-label">Paiement</label>
              <select id="paymentStatus" name="paymentStatus" className="admin-select" defaultValue="UNPAID">
                <option value="UNPAID">Non encaissé</option>
                <option value="PARTIAL">Partiellement encaissé</option>
                <option value="PAID">Encaissé intégralement</option>
              </select>
            </div>
            <div>
              <label htmlFor="amountReceived" className="admin-label">Montant reçu (FCFA)</label>
              <input id="amountReceived" name="amountReceived" type="number" min={0} className="admin-input" placeholder="0" />
              <p className="mt-1 text-[9px] text-brown-light">
                Ignoré si le paiement est « non encaissé » ; forcé au total si « encaissé intégralement ».
              </p>
            </div>
            <div>
              <label htmlFor="paymentMethod" className="admin-label">Moyen de paiement</label>
              <select id="paymentMethod" name="paymentMethod" className="admin-select" defaultValue="">
                <option value="">Non précisé</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="admin-label">Notes internes / demande du client</label>
              <textarea id="notes" name="notes" rows={3} className="admin-textarea" placeholder="Sans oignons, appeler avant livraison…" />
            </div>
          </div>
        </section>

        <button type="submit" className="btn-primary w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Enregistrer la commande
        </button>
      </form>
    </div>
  );
}
