import { and, asc, count, eq, ne } from "drizzle-orm";
import {
  BadgePercent,
  CalendarClock,
  Eye,
  EyeOff,
  Percent,
  Plus,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { getDb } from "@/db";
import { categories, orders, products, promotions, type Promotion } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { formatFCFA } from "@/lib/utils";
import {
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { savePromotion, setPromotionState } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promotions" };

const DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
  { value: 0, label: "Dim" },
];

function localInput(date: Date | null): string {
  if (!date) return "";
  const value = new Date(date);
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function describeType(promotion: Promotion): string {
  if (promotion.type === "PERCENT") return `−${promotion.value} %`;
  if (promotion.type === "FIXED") return `−${formatFCFA(promotion.value)}`;
  return "Livraison offerte";
}

function PromotionForm({
  promotion,
  categories: categoryRows,
  products: productRows,
}: {
  promotion?: Promotion;
  categories: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string }>;
}) {
  const key = promotion?.id ?? "new";
  const scope = promotion?.scopeType ?? "ALL";
  const days = new Set(promotion?.daysOfWeek ?? []);
  return (
    <form action={savePromotion} className="space-y-4">
      {promotion ? <input type="hidden" name="id" value={promotion.id} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="admin-label" htmlFor={`pname-${key}`}>
            Nom interne de l'offre *
          </label>
          <input
            id={`pname-${key}`}
            name="name"
            required
            defaultValue={promotion?.name ?? ""}
            className="admin-input"
            placeholder="Menu du mardi"
          />
        </div>
        <div>
          <label className="admin-label" htmlFor={`pcode-${key}`}>
            Code promo (facultatif)
          </label>
          <input
            id={`pcode-${key}`}
            name="code"
            defaultValue={promotion?.code ?? ""}
            className="admin-input uppercase"
            placeholder="MARDI10"
          />
          <p className="mt-1 text-[9px] text-brown-light">
            Sans code + automatique = offre appliquée d'office. Avec code =
            l'offre doit être saisie au panier.
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className="admin-label" htmlFor={`pdesc-${key}`}>
            Description publique
          </label>
          <textarea
            id={`pdesc-${key}`}
            name="description"
            rows={2}
            defaultValue={promotion?.description ?? ""}
            className="admin-textarea"
            placeholder="Une remise gourmande pour bien commencer la semaine."
          />
        </div>
        <div>
          <label className="admin-label" htmlFor={`ptype-${key}`}>
            Type d'avantage
          </label>
          <select
            id={`ptype-${key}`}
            name="type"
            defaultValue={promotion?.type ?? "PERCENT"}
            className="admin-select"
          >
            <option value="PERCENT">Pourcentage</option>
            <option value="FIXED">Montant fixe</option>
            <option value="FREE_DELIVERY">Livraison offerte</option>
          </select>
        </div>
        <div>
          <label className="admin-label" htmlFor={`pvalue-${key}`}>
            Valeur (% ou FCFA)
          </label>
          <input
            id={`pvalue-${key}`}
            name="value"
            type="number"
            min={0}
            defaultValue={promotion?.value ?? 10}
            className="admin-input"
          />
          <p className="mt-1 text-[9px] text-brown-light">
            Ignorée pour la livraison offerte.
          </p>
        </div>
      </div>

      <details className="rounded-xl border border-brown/10 bg-cream/40 p-3" open>
        <summary className="cursor-pointer list-none text-[11px] font-extrabold text-mauve-800 [&::-webkit-details-marker]:hidden">
          Conditions & limites
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="admin-label" htmlFor={`pmin-${key}`}>
              Montant minimum (FCFA)
            </label>
            <input
              id={`pmin-${key}`}
              name="minSubtotal"
              type="number"
              min={0}
              defaultValue={promotion?.minSubtotal ?? 0}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label" htmlFor={`pitems-${key}`}>
              Nombre minimum d'articles
            </label>
            <input
              id={`pitems-${key}`}
              name="minItems"
              type="number"
              min={0}
              defaultValue={promotion?.minItems ?? 0}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label" htmlFor={`pmax-${key}`}>
              Utilisations maximum (global)
            </label>
            <input
              id={`pmax-${key}`}
              name="maxRedemptions"
              type="number"
              min={0}
              defaultValue={promotion?.maxRedemptions ?? ""}
              className="admin-input"
              placeholder="Illimité si vide"
            />
          </div>
          <div>
            <label className="admin-label" htmlFor={`ppers-${key}`}>
              Utilisations max / client
            </label>
            <input
              id={`ppers-${key}`}
              name="maxPerCustomer"
              type="number"
              min={0}
              defaultValue={promotion?.maxPerCustomer ?? ""}
              className="admin-input"
              placeholder="Illimité si vide"
            />
          </div>
          <div>
            <label className="admin-label" htmlFor={`ployal-${key}`}>
              Fidélité : commandes terminées minimum
            </label>
            <input
              id={`ployal-${key}`}
              name="loyaltyMinOrders"
              type="number"
              min={0}
              defaultValue={promotion?.loyaltyMinOrders ?? 0}
              className="admin-input"
              placeholder="0 = tout le monde"
            />
          </div>
          <div>
            <p className="admin-label">Jours de validité</p>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((day) => (
                <label
                  key={day.value}
                  className="inline-flex items-center gap-1 rounded-lg border border-brown/10 bg-white px-2 py-1 text-[10px] font-bold text-brown-soft"
                >
                  <input
                    type="checkbox"
                    name="days"
                    value={day.value}
                    defaultChecked={days.has(day.value)}
                    className="h-3 w-3 accent-mauve"
                  />
                  {day.label}
                </label>
              ))}
            </div>
            <p className="mt-1 text-[9px] text-brown-light">
              Aucun jour coché = tous les jours.
            </p>
          </div>
          <div>
            <label className="admin-label" htmlFor={`pstarttime-${key}`}>
              Heure de début (Dakar)
            </label>
            <input
              id={`pstarttime-${key}`}
              name="startTime"
              type="time"
              defaultValue={promotion?.startTime ?? ""}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label" htmlFor={`pendtime-${key}`}>
              Heure de fin
            </label>
            <input
              id={`pendtime-${key}`}
              name="endTime"
              type="time"
              defaultValue={promotion?.endTime ?? ""}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label" htmlFor={`pstarts-${key}`}>
              Du (date & heure)
            </label>
            <input
              id={`pstarts-${key}`}
              name="startsAt"
              type="datetime-local"
              defaultValue={localInput(promotion?.startsAt ?? null)}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label" htmlFor={`pends-${key}`}>
              Au
            </label>
            <input
              id={`pends-${key}`}
              name="endsAt"
              type="datetime-local"
              defaultValue={localInput(promotion?.endsAt ?? null)}
              className="admin-input"
            />
          </div>
        </div>
      </details>

      <details className="rounded-xl border border-brown/10 bg-cream/40 p-3">
        <summary className="cursor-pointer list-none text-[11px] font-extrabold text-mauve-800 [&::-webkit-details-marker]:hidden">
          Périmètre de l'offre
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="admin-label" htmlFor={`pscope-${key}`}>
              S'applique à
            </label>
            <select
              id={`pscope-${key}`}
              name="scopeType"
              defaultValue={scope}
              className="admin-select"
            >
              <option value="ALL">Tout le panier</option>
              <option value="CATEGORIES">Certaines catégories</option>
              <option value="PRODUCTS">Certains produits</option>
            </select>
          </div>
          <div>
            <p className="admin-label">Catégories éligibles</p>
            <div className="grid max-h-40 gap-1.5 overflow-y-auto rounded-xl border border-brown/10 bg-white p-2 sm:grid-cols-2">
              {categoryRows.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-1.5 text-[10px] font-semibold text-brown-soft"
                >
                  <input
                    type="checkbox"
                    name="scopeCategoryIds"
                    value={category.id}
                    defaultChecked={promotion?.scopeCategoryIds.includes(category.id) ?? false}
                    className="h-3.5 w-3.5 accent-mauve"
                  />
                  {category.name}
                </label>
              ))}
            </div>
            <p className="mt-1 text-[9px] text-brown-light">
              Utilisées uniquement si « certaines catégories » est choisi.
            </p>
          </div>
          <div>
            <label className="admin-label" htmlFor={`pproducts-${key}`}>
              Produits éligibles
            </label>
            <select
              id={`pproducts-${key}`}
              name="scopeProductIds"
              multiple
              size={7}
              className="admin-select h-auto"
              defaultValue={promotion?.scopeProductIds ?? []}
            >
              {productRows.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[9px] text-brown-light">
              Maintenez Ctrl / Cmd pour sélectionner plusieurs produits.
            </p>
          </div>
        </div>
      </details>

      <div className="flex flex-wrap gap-2">
        <label className="inline-flex items-center gap-2 rounded-xl border border-brown/10 px-3 py-2 text-[10px] font-bold text-brown-soft">
          <input
            type="checkbox"
            name="isAutomatic"
            defaultChecked={promotion?.isAutomatic ?? true}
            className="h-4 w-4 accent-mauve"
          />
          Offre automatique
        </label>
        <label className="inline-flex items-center gap-2 rounded-xl border border-brown/10 px-3 py-2 text-[10px] font-bold text-brown-soft">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={promotion?.isActive ?? true}
            className="h-4 w-4 accent-mauve"
          />
          Active
        </label>
        <label className="inline-flex items-center gap-2 rounded-xl border border-brown/10 px-3 py-2 text-[10px] font-bold text-brown-soft">
          <input
            type="checkbox"
            name="showBanner"
            defaultChecked={promotion?.showBanner ?? false}
            className="h-4 w-4 accent-mauve"
          />
          Afficher en avant sur le site
        </label>
      </div>

      <button type="submit" className="btn-primary btn-sm">
        {promotion ? "Enregistrer l'offre" : "Créer l'offre"}
      </button>
    </form>
  );
}

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requirePermission("promotions:read");
  const params = await searchParams;
  const db = getDb();
  const [promotionRows, categoryRows, productRows] = await Promise.all([
    db
      .select({
        promotion: promotions,
        usage: count(orders.id),
      })
      .from(promotions)
      .leftJoin(
        orders,
        and(eq(orders.promotionId, promotions.id), ne(orders.status, "CANCELLED")),
      )
      .groupBy(promotions.id)
      .orderBy(asc(promotions.name)),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.name)),
    db.select({ id: products.id, name: products.name }).from(products).orderBy(asc(products.name)),
  ]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Promotions"
        description="Codes promo, offres automatiques, livraison offerte et conditions horaires. Une seule meilleure offre est appliquée par commande, en plus de la remise quantité."
        actions={
          <a href="#nouvelle-promotion" className="btn-primary btn-sm">
            <Plus className="h-3.5 w-3.5" />
            Nouvelle offre
          </a>
        }
      />
      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Percent, label: "Offres actives", value: promotionRows.filter((row) => row.promotion.isActive).length },
          { icon: Wallet, label: "Codes promo", value: promotionRows.filter((row) => row.promotion.code).length },
          { icon: Truck, label: "Livraison offerte", value: promotionRows.filter((row) => row.promotion.type === "FREE_DELIVERY").length },
          { icon: Users, label: "Usages enregistrés", value: promotionRows.reduce((total, row) => total + Number(row.usage), 0) },
        ].map((item) => (
          <div key={item.label} className="admin-card flex items-center gap-3 p-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mauve-100 text-mauve-700">
              <item.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-brown-light">{item.label}</p>
              <p className="text-lg font-extrabold text-mauve-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-mauve-200 bg-mauve-100/40 p-3 text-[10px] leading-5 text-mauve-800">
        <strong>Règle des offres limitées :</strong> seules les commandes
        enregistrées et non annulées comptent dans les plafonds. Un simple clic
        WhatsApp ou l'ouverture d'une conversation ne crée aucune commande. En cas
        d'égalité d'avantage, le code saisi est prioritaire ; sinon la première
        offre par ordre alphabétique est retenue. La remise quantité reste
        cumulable et s'applique au sous-total.
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr] xl:items-start">
        <div className="space-y-2.5">
          {promotionRows.length ? (
            promotionRows.map(({ promotion, usage }) => (
              <div key={promotion.id} className="admin-card p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-display text-[20px] leading-tight text-mauve-900">
                        {promotion.name}
                      </p>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                          promotion.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {promotion.isActive ? "Active" : "Inactive"}
                      </span>
                      {promotion.code ? (
                        <span className="rounded bg-mauve-100 px-1.5 py-0.5 font-mono text-[8px] font-bold text-mauve-800">
                          {promotion.code}
                        </span>
                      ) : (
                        <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[8px] font-bold uppercase text-sky-700">
                          Sans code
                        </span>
                      )}
                      {promotion.isAutomatic ? (
                        <span className="rounded bg-ochre/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-800">
                          Auto
                        </span>
                      ) : null}
                      {promotion.loyaltyMinOrders > 0 ? (
                        <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[8px] font-bold uppercase text-violet-700">
                          Fidélité {promotion.loyaltyMinOrders}+
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[10px] text-brown-light">
                      {describeType(promotion)} · minimum {formatFCFA(promotion.minSubtotal)} / {promotion.minItems} article(s)
                    </p>
                    <p className="mt-1 text-[10px] leading-5 text-brown-soft">
                      {promotion.description || "Pas de description publique."}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-brown-light">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {promotion.daysOfWeek.length
                          ? promotion.daysOfWeek.map((day) => DAYS.find((d) => d.value === day)?.label).join(", ")
                          : "Tous les jours"}
                        {promotion.startTime ? ` · ${promotion.startTime}` : ""}
                        {promotion.endTime ? `–${promotion.endTime}` : ""}
                      </span>
                      <span>
                        Périmètre :{" "}
                        {promotion.scopeType === "ALL"
                          ? "tout le panier"
                          : promotion.scopeType === "CATEGORIES"
                            ? `${promotion.scopeCategoryIds.length} catégorie(s)`
                            : `${promotion.scopeProductIds.length} produit(s)`}
                      </span>
                      <span>
                        Plafonds : {promotion.maxRedemptions ?? "∞"} global ·{" "}
                        {promotion.maxPerCustomer ?? "∞"} / client
                      </span>
                      <span>Utilisée {Number(usage)} fois</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <form action={setPromotionState}>
                      <input type="hidden" name="id" value={promotion.id} />
                      <input type="hidden" name="value" value={promotion.isActive ? "false" : "true"} />
                      <button
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-brown-soft hover:bg-cream"
                        title={promotion.isActive ? "Désactiver" : "Activer"}
                      >
                        {promotion.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {promotion.isActive ? "Désactiver" : "Activer"}
                      </button>
                    </form>
                  </div>
                </div>
                <details className="mt-3 border-t border-brown/10 pt-2">
                  <summary className="cursor-pointer list-none text-[10px] font-extrabold text-mauve-700 [&::-webkit-details-marker]:hidden">
                    Modifier cette offre
                  </summary>
                  <div className="mt-3 rounded-xl bg-cream/50 p-3">
                    <PromotionForm
                      promotion={promotion}
                      categories={categoryRows}
                      products={productRows}
                    />
                  </div>
                </details>
              </div>
            ))
          ) : (
            <AdminEmpty title="Aucune promotion" description="Créez la première offre de la maison." />
          )}
        </div>

        <div id="nouvelle-promotion" className="admin-card h-fit scroll-mt-24 p-4 xl:sticky xl:top-20">
          <div className="flex items-center gap-2">
            <BadgePercent className="h-4 w-4 text-mauve" />
            <h2 className="font-display text-xl text-mauve-900">Nouvelle offre</h2>
          </div>
          <p className="mb-4 mt-1 text-[10px] leading-5 text-brown-light">
            Elle peut rester inactive pendant la préparation.
          </p>
          <PromotionForm categories={categoryRows} products={productRows} />
        </div>
      </div>
    </div>
  );
}
