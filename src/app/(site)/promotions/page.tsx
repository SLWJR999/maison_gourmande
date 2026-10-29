import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Gift,
  Info,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
} from "lucide-react";
import {
  getActivePromotions,
  getMenuData,
} from "@/lib/catalog";
import { getCachedSettings, settingInt } from "@/lib/settings";
import { Reveal } from "@/components/ui/reveal";
import { formatDate, formatFCFA } from "@/lib/utils";
import type { Promotion } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promotions & offres",
  description:
    "Offres en cours, codes promo et avantages Maison Gourmande : livraison offerte, remises et remise quantité sur les grandes commandes.",
  alternates: { canonical: "/promotions" },
};

const DAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

function formatDays(days: number[]) {
  if (!days.length) return null;
  if (days.length === 7) return "Tous les jours";
  const ordered = [...days].sort((a, b) => a - b);
  const labels = ordered.map((day) => DAYS[day]?.slice(0, 3) ?? "").filter(Boolean);
  if (labels.length === 1) return `Le ${DAYS[ordered[0]]}`;
  return labels.join(", ");
}

function offerLabel(promotion: Promotion) {
  if (promotion.type === "FREE_DELIVERY") return "Livraison offerte";
  if (promotion.type === "PERCENT") return `−${promotion.value} %`;
  return `−${formatFCFA(promotion.value)}`;
}

export default async function PromotionsPage() {
  const [promotions, menu, settings] = await Promise.all([
    getActivePromotions(),
    getMenuData(),
    getCachedSettings(),
  ]);
  const quantityThreshold = settingInt(settings, "quantityDiscountThreshold", 50);
  const quantityPercent = settingInt(settings, "quantityDiscountPercent", 5);
  const categoryNames = new Map(menu.categories.map((category) => [category.id, category.name]));
  const productNames = new Map(menu.products.map((row) => [row.product.id, row.product.name]));
  const whatsappHref = `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `${settings.whatsappGreeting} Je souhaite profiter d'une offre.`,
  )}`;

  return (
    <div className="pb-20">
      <section className="hero-grain relative overflow-hidden py-12 sm:py-16">
        <div className="pointer-events-none absolute -right-32 top-0 h-[420px] w-[420px] rounded-full bg-blob" aria-hidden="true" />
        <div className="container-page relative">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brown-light">
            <Link href="/" className="transition hover:text-mauve-800">Accueil</Link>
            <span aria-hidden="true">/</span>
            <span className="text-mauve-800">Promotions</span>
          </nav>

          <div className="mt-7 grid gap-8 lg:grid-cols-[1.05fr_0.5fr] lg:items-end">
            <div className="animate-fade-up">
              <p className="eyebrow"><span className="h-px w-6 bg-mauve" />Les petits plus de la maison</p>
              <h1 className="mt-4 max-w-3xl text-[44px] leading-[0.98] text-mauve-900 sm:text-[58px] lg:text-[66px]">
                Les offres qui font <em className="text-mauve">plaisir</em>.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-brown-soft sm:text-[15px]">
                Des codes gourmands, des livraisons offertes et une remise
                quantité sur les grandes tablées. Chaque avantage est vérifié
                côté serveur au moment du panier, pas seulement affiché.
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <Link href="/menu" className="btn-primary">
                  <ShoppingBag className="h-4 w-4" />
                  Composer ma commande
                </Link>
                <a href={whatsappHref} target="_blank" rel="noreferrer noopener" className="btn-secondary">
                  <MessageCircle className="h-4 w-4" />
                  Une question ?
                </a>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-brown/10 bg-white/85 p-5 shadow-card backdrop-blur">
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-mauve-700">
                <Gift className="h-4 w-4" />
                L'avantage maison
              </p>
              <p className="mt-3 font-display text-[32px] leading-none text-mauve-900">
                −{quantityPercent} %
              </p>
              <p className="mt-1 text-[11px] leading-5 text-brown-soft">
                dès {quantityThreshold} pièces dans votre panier, cumulable avec
                la meilleure offre du moment.
              </p>
              <div className="mt-4 space-y-2 border-t border-brown/10 pt-3 text-[10px] leading-5 text-brown-light">
                <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />Une seule meilleure offre par commande</p>
                <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />Prix recalculés côté serveur</p>
                <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />Aucun paiement en ligne</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-9">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow"><span className="h-px w-5 bg-mauve" />En ce moment</p>
              <h2 className="mt-2 text-[32px] text-mauve-900 sm:text-[38px]">
                {promotions.length > 0
                  ? `${promotions.length} offre${promotions.length > 1 ? "s" : ""} à découvrir`
                  : "Les prochaines offres arrivent"}
              </h2>
            </div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold text-brown-light">
              <CalendarClock className="h-3.5 w-3.5 text-mauve" />
              Conditions et créneaux affichés pour chaque offre
            </p>
          </div>

          {promotions.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {promotions.map((promotion, index) => {
                const dayLabel = formatDays(promotion.daysOfWeek);
                const scopeLabel =
                  promotion.scopeType === "ALL"
                    ? "Toute la carte"
                    : promotion.scopeType === "CATEGORIES"
                      ? promotion.scopeCategoryIds
                          .map((id) => categoryNames.get(id))
                          .filter(Boolean)
                          .join(", ") || "Catégories sélectionnées"
                      : promotion.scopeProductIds
                          .map((id) => productNames.get(id))
                          .filter(Boolean)
                          .join(", ") || "Produits sélectionnés";
                const conditions = [
                  promotion.minSubtotal > 0
                    ? `Dès ${formatFCFA(promotion.minSubtotal)} d'achat`
                    : null,
                  promotion.minItems > 0
                    ? `Dès ${promotion.minItems} article${promotion.minItems > 1 ? "s" : ""}`
                    : null,
                  promotion.type === "FREE_DELIVERY" ? "En livraison uniquement" : null,
                  dayLabel,
                  promotion.startTime || promotion.endTime
                    ? `${promotion.startTime ?? "ouverture"} – ${promotion.endTime ?? "fermeture"}`
                    : null,
                  promotion.loyaltyMinOrders > 0
                    ? `Clients fidèles : ${promotion.loyaltyMinOrders}+ commande${promotion.loyaltyMinOrders > 1 ? "s" : ""} confirmée${promotion.loyaltyMinOrders > 1 ? "s" : ""}`
                    : null,
                  promotion.endsAt ? `Jusqu'au ${formatDate(promotion.endsAt)}` : null,
                  promotion.maxRedemptions !== null ? "Dans la limite des offres disponibles" : null,
                ].filter(Boolean);

                return (
                  <Reveal key={promotion.id} delay={(index % 3) as 0 | 1 | 2}>
                    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-brown/10 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-float">
                      <div className="relative overflow-hidden bg-mauve-900 px-5 pb-5 pt-5 text-white">
                        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full border-[18px] border-white/10" />
                        <div className="flex items-start justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-[0.16em] text-mauve-100">
                            {promotion.isAutomatic ? <Sparkles className="h-3 w-3" /> : <Tag className="h-3 w-3" />}
                            {promotion.isAutomatic ? "Offre automatique" : "Code promo"}
                          </span>
                          {promotion.type === "FREE_DELIVERY" ? (
                            <Truck className="h-5 w-5 text-ochre-light" />
                          ) : (
                            <BadgePercent className="h-5 w-5 text-ochre-light" />
                          )}
                        </div>
                        <p className="mt-5 font-display text-[38px] leading-none text-white">
                          {offerLabel(promotion)}
                        </p>
                        <h3 className="mt-2 text-[17px] leading-tight text-white">
                          {promotion.name}
                        </h3>
                        {promotion.description ? (
                          <p className="mt-2 text-[11px] leading-5 text-mauve-200/80">
                            {promotion.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        {!promotion.isAutomatic && promotion.code ? (
                          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-dashed border-mauve/35 bg-mauve-100/45 px-3 py-2.5">
                            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-mauve-700">Votre code</span>
                            <code className="rounded bg-white px-2 py-1 text-[11px] font-extrabold tracking-[0.12em] text-mauve-900">
                              {promotion.code}
                            </code>
                          </div>
                        ) : (
                          <p className="mb-3 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[9px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Appliquée automatiquement dans le panier
                          </p>
                        )}

                        <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-brown-light">Valable sur</p>
                        <p className="mt-1 text-[11px] font-bold leading-5 text-brown">{scopeLabel}</p>

                        <ul className="mt-3 space-y-1.5 border-t border-brown/10 pt-3 text-[10px] leading-4 text-brown-soft">
                          {conditions.map((condition) => (
                            <li key={condition} className="flex items-start gap-1.5">
                              <Clock3 className="mt-0.5 h-3 w-3 shrink-0 text-mauve" />
                              <span>{condition}</span>
                            </li>
                          ))}
                          {conditions.length === 0 ? (
                            <li className="flex items-start gap-1.5">
                              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                              Sans condition particulière
                            </li>
                          ) : null}
                        </ul>

                        <div className="mt-auto pt-4">
                          <Link href="/menu" className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-cream px-3 py-2.5 text-[10px] font-extrabold text-mauve-800 transition group-hover:bg-mauve group-hover:text-white">
                            En profiter
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[2rem] border border-dashed border-mauve/25 bg-white/70 px-6 py-14 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mauve-100 text-mauve-700">
                <Gift className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-display text-2xl text-mauve-900">
                Pas de code actif pour le moment
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-brown-soft">
                La remise quantité reste disponible, et la maison prépare
                sûrement déjà la prochaine gourmandise. Suivez-nous ou
                écrivez-nous sur WhatsApp.
              </p>
              <a href={whatsappHref} target="_blank" rel="noreferrer noopener" className="btn-primary mt-5">
                <MessageCircle className="h-4 w-4" />
                Nous écrire
              </a>
            </div>
          )}
        </div>
      </section>

      <section className="pt-12">
        <div className="container-page">
          <div className="grid gap-4 rounded-[2rem] border border-mauve/15 bg-mauve-100/45 p-6 sm:p-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <p className="eyebrow"><span className="h-px w-5 bg-mauve" />Comment ça marche</p>
              <h2 className="mt-2 text-[28px] leading-tight text-mauve-900 sm:text-[34px]">
                La meilleure offre, sans empiler les remises.
              </h2>
              <p className="mt-2 max-w-xl text-[12px] leading-6 text-brown-soft">
                La remise quantité est calculée d'abord. Ensuite, le moteur
                compare toutes les offres éligibles et retient la plus
                avantageuse. En cas d'égalité, le code saisi est prioritaire.
              </p>
            </div>
            <div className="grid gap-2 text-[10px] leading-5 text-brown-soft">
              <p className="flex items-start gap-2 rounded-xl bg-white/80 p-3"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mauve" />Une commande enregistrée et non annulée compte pour les offres limitées. Un simple clic WhatsApp ne crée ni ne confirme de commande.</p>
              <p className="flex items-start gap-2 rounded-xl bg-white/80 p-3"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mauve" />Les prix, disponibilités et conditions sont revérifiés lorsque vous validez le panier.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-10">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-4 rounded-[2rem] bg-mauve-900 p-7 text-white sm:flex-row sm:items-center sm:p-9">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-ochre-light">Une grande tablée ?</p>
              <h2 className="mt-2 text-[27px] leading-tight text-white sm:text-[32px]">
                La remise quantité aime les grandes faims.
              </h2>
              <p className="mt-1 text-[12px] leading-6 text-mauve-200/75">
                À partir de {quantityThreshold} pièces : −{quantityPercent} % automatiquement.
              </p>
            </div>
            <Link href="/menu" className="btn-cream shrink-0">
              Voir les box
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
