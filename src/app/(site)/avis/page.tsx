import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  MessageCircle,
  Quote,
  Sparkles,
  Star,
  StarHalf,
} from "lucide-react";
import { getApprovedReviews, getMenuData } from "@/lib/catalog";
import { getCachedSettings } from "@/lib/settings";
import { ReviewForm } from "@/components/reviews/review-form";
import { MediaImage } from "@/components/ui/media-image";
import { formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Avis clients",
  description:
    "Les avis de la communauté Maison Gourmande et le formulaire pour partager votre expérience après une commande.",
  alternates: { canonical: "/avis" },
};

function Stars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((value) => {
        if (rounded >= value) {
          return <Star key={value} className={`${size} fill-ochre text-ochre`} />;
        }
        if (rounded >= value - 0.5) {
          return <StarHalf key={value} className={`${size} fill-ochre text-ochre`} />;
        }
        return <Star key={value} className={`${size} fill-transparent text-brown/20`} />;
      })}
    </span>
  );
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ note?: string }>;
}) {
  const [reviews, menu, settings, params] = await Promise.all([
    getApprovedReviews(),
    getMenuData(),
    getCachedSettings(),
    searchParams,
  ]);
  const selectedRating = [1, 2, 3, 4, 5].includes(Number(params.note))
    ? Number(params.note)
    : null;
  const visibleReviews = selectedRating
    ? reviews.filter((row) => row.review.rating === selectedRating)
    : reviews;
  const count = reviews.length;
  const average = count
    ? Math.round((reviews.reduce((sum, row) => sum + row.review.rating, 0) / count) * 10) / 10
    : null;
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((row) => row.review.rating === rating).length,
  }));
  const products = menu.products.map((row) => ({
    id: row.product.id,
    name: row.product.name,
  }));
  const whatsappHref = `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `${settings.whatsappGreeting} Je souhaite partager un retour sur ma commande.`,
  )}`;

  return (
    <div className="pb-20">
      <section className="hero-grain relative overflow-hidden py-12 sm:py-16">
        <div className="pointer-events-none absolute -left-40 bottom-0 h-[420px] w-[420px] rounded-full bg-blob" aria-hidden="true" />
        <div className="container-page relative">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brown-light">
            <Link href="/" className="transition hover:text-mauve-800">Accueil</Link>
            <span aria-hidden="true">/</span>
            <span className="text-mauve-800">Avis clients</span>
          </nav>

          <div className="mt-7 grid items-end gap-8 lg:grid-cols-[1.1fr_0.55fr]">
            <div className="animate-fade-up">
              <p className="eyebrow"><span className="h-px w-6 bg-mauve" />La parole aux gourmands</p>
              <h1 className="mt-4 max-w-3xl text-[44px] leading-[0.98] text-mauve-900 sm:text-[58px] lg:text-[66px]">
                Vos mots, notre plus belle <em className="text-mauve">recette</em>.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-brown-soft sm:text-[15px]">
                Un fataya qui croustille, une crêpe qui console, un accueil qui
                fait sourire : partagez ce qui a compté. Les avis sont lus et
                modérés par la maison avant publication.
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <a href="#laisser-un-avis" className="btn-primary">
                  <Sparkles className="h-4 w-4" />
                  Laisser un avis
                </a>
                <a href={whatsappHref} target="_blank" rel="noreferrer noopener" className="btn-secondary">
                  <MessageCircle className="h-4 w-4" />
                  Écrire à la maison
                </a>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] bg-mauve-900 p-5 text-white shadow-float">
              <Quote className="absolute -right-3 -top-4 h-24 w-24 text-white/5" />
              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-ochre-light">
                La note de la communauté
              </p>
              <div className="mt-3 flex items-end gap-3">
                <p className="font-display text-[54px] leading-none text-white">
                  {average ? average.toFixed(1).replace(".", ",") : "—"}
                </p>
                <div className="pb-1">
                  <Stars rating={average ?? 0} size="h-4 w-4" />
                  <p className="mt-1 text-[10px] text-mauve-200/70">
                    {count} avis publié{count > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 border-t border-white/10 pt-3">
                {distribution.map((item) => {
                  const percentage = count ? Math.round((item.count / count) * 100) : 0;
                  return (
                    <div key={item.rating} className="flex items-center gap-2 text-[9px]">
                      <span className="w-7 text-mauve-200/75">{item.rating} ★</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        <span className="block h-full rounded-full bg-ochre" style={{ width: `${percentage}%` }} />
                      </span>
                      <span className="w-5 text-right text-mauve-200/60">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-9">
        <div className="container-page">
          <div className="grid gap-6 xl:grid-cols-[1fr_370px] xl:items-start">
            <div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="eyebrow"><span className="h-px w-5 bg-mauve" />Ils ont goûté</p>
                  <h2 className="mt-2 text-[30px] text-mauve-900 sm:text-[36px]">
                    Les avis de la maison
                  </h2>
                </div>
                <p className="text-[10px] font-bold text-brown-light">
                  {visibleReviews.length} avis affiché{visibleReviews.length > 1 ? "s" : ""}
                </p>
              </div>

              {count > 0 ? (
                <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
                  <Link
                    href="/avis"
                    className={`shrink-0 rounded-full border px-3.5 py-2 text-[10px] font-extrabold transition ${selectedRating === null ? "border-mauve bg-mauve text-white" : "border-brown/10 bg-white text-brown-soft hover:border-mauve/30"}`}
                  >
                    Tous
                  </Link>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <Link
                      key={rating}
                      href={`/avis?note=${rating}`}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-2 text-[10px] font-extrabold transition ${selectedRating === rating ? "border-mauve bg-mauve text-white" : "border-brown/10 bg-white text-brown-soft hover:border-mauve/30"}`}
                    >
                      {rating} <Star className="h-3 w-3 fill-current" />
                    </Link>
                  ))}
                </div>
              ) : null}

              {visibleReviews.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {visibleReviews.map((row) => (
                    <article
                      key={row.review.id}
                      className="flex h-full flex-col rounded-[1.5rem] border border-brown/10 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mauve-100 text-[10px] font-extrabold text-mauve-800">
                            {initials(row.review.customerName)}
                          </span>
                          <div>
                            <p className="flex items-center gap-1 text-[11px] font-extrabold text-brown">
                              {row.review.customerName}
                              <BadgeCheck className="h-3 w-3 text-emerald-600" aria-label="Avis publié après modération" />
                            </p>
                            <p className="text-[8px] text-brown-light">
                              {formatDate(row.review.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Stars rating={row.review.rating} size="h-3 w-3" />
                      </div>
                      <p className="mt-3 flex-1 text-[12px] leading-6 text-brown-soft">
                        « {row.review.message} »
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-brown/10 pt-2.5">
                        {row.product ? (
                          <Link
                            href={`/menu/${row.product.slug}`}
                            className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-1 text-[8px] font-bold text-brown-soft transition hover:text-mauve-800"
                          >
                            {row.product.name}
                            <ArrowRight className="h-2.5 w-2.5" />
                          </Link>
                        ) : (
                          <span className="rounded-full bg-cream px-2 py-1 text-[8px] font-bold text-brown-light">
                            Expérience maison
                          </span>
                        )}
                        {row.review.isDemo ? (
                          <span className="rounded-full bg-amber-50 px-2 py-1 text-[8px] font-bold text-amber-700">
                            Avis de démonstration
                          </span>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[2rem] border border-dashed border-mauve/25 bg-white/70 px-6 py-14 text-center">
                  <Quote className="mx-auto h-8 w-8 text-mauve/40" />
                  <h3 className="mt-3 font-display text-2xl text-mauve-900">
                    {count ? "Aucun avis pour cette note" : "Les premiers avis arrivent"}
                  </h3>
                  <p className="mx-auto mt-1 max-w-md text-[12px] leading-6 text-brown-soft">
                    {count
                      ? "Essayez une autre note ou découvrez tous les retours de la communauté."
                      : "Après votre commande, votre expérience peut aider un prochain gourmand à choisir. Merci pour votre confiance."}
                  </p>
                  {count ? (
                    <Link href="/avis" className="btn-secondary mt-5">Voir tous les avis</Link>
                  ) : null}
                </div>
              )}
            </div>

            <div id="laisser-un-avis" className="scroll-mt-24 xl:sticky xl:top-24">
              <ReviewForm products={products} />
              <div className="mt-3 flex items-start gap-2 rounded-2xl bg-cream/80 p-3 text-[9px] leading-5 text-brown-light">
                <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mauve" />
                Un souci avec une commande en cours ? Écrivez directement à la
                maison sur WhatsApp avec votre référence : c'est plus rapide
                qu'un avis en attente de modération.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-12">
        <div className="container-page">
          <div className="grid overflow-hidden rounded-[2rem] bg-mauve-900 text-white lg:grid-cols-[1fr_0.5fr]">
            <div className="p-7 sm:p-9">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-ochre-light">Après la dégustation</p>
              <h2 className="mt-2 text-[28px] leading-tight text-white sm:text-[34px]">
                Un avis, une étoile, un mot doux.
              </h2>
              <p className="mt-2 max-w-lg text-[12px] leading-6 text-mauve-200/75">
                Les retours publiés sont modérés. Les avis de démonstration
                éventuels sont signalés comme tels pour rester transparents.
              </p>
            </div>
            <div className="relative hidden min-h-[180px] lg:block">
              <MediaImage src="/images/crepe-nutella.jpg" alt="" sizes="30vw" className="absolute inset-0 h-full w-full" />
              <span className="absolute inset-0 bg-gradient-to-r from-mauve-900 via-mauve-900/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
