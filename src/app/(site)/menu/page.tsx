import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChefHat, Clock3, Sparkles, Truck } from "lucide-react";
import { getActiveBanners, getActivePromotions, getMenuData } from "@/lib/catalog";
import { getCachedSettings } from "@/lib/settings";
import { MenuExplorer } from "@/components/menu/menu-explorer";
import { MediaImage } from "@/components/ui/media-image";
import { Reveal } from "@/components/ui/reveal";
import { CategoryIcon } from "@/components/site/category-icon";
import { formatFCFA } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Le menu",
  description:
    "Fataya, tacos, burgers, pizzas, crêpes et jus naturels : découvrez toute la carte Maison Gourmande et composez votre commande.",
  alternates: { canonical: "/menu" },
};

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const [menu, banners, settings, promotions, params] = await Promise.all([
    getMenuData(),
    getActiveBanners("MENU"),
    getCachedSettings(),
    getActivePromotions(),
    searchParams,
  ]);

  const totalPieces = menu.products.reduce(
    (count, row) => count + row.variants.length,
    0,
  );
  const cheapest = menu.products.reduce(
    (min, row) =>
      Math.min(
        min,
        ...row.variants.map((variant) => variant.price),
      ),
    Number.POSITIVE_INFINITY,
  );
  const banner = banners[0];
  const promotedAll = promotions.some(
    (promotion) => promotion.scopeType === "ALL" && promotion.isAutomatic,
  );
  const promotedCategoryIds = Array.from(
    new Set(
      promotions
        .filter((promotion) => promotion.scopeType === "CATEGORIES")
        .flatMap((promotion) => promotion.scopeCategoryIds),
    ),
  );
  const promotedProductIds = Array.from(
    new Set(
      promotions
        .filter((promotion) => promotion.scopeType === "PRODUCTS")
        .flatMap((promotion) => promotion.scopeProductIds),
    ),
  );

  return (
    <div className="pb-20">
      <section className="hero-grain relative overflow-hidden pb-10 pt-8 sm:pt-12">
        <div
          className="pointer-events-none absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-blob"
          aria-hidden="true"
        />
        <div className="container-page relative">
          <nav
            aria-label="Fil d'Ariane"
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brown-light"
          >
            <Link href="/" className="transition hover:text-mauve-800">
              Accueil
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-mauve-800">Le menu</span>
          </nav>

          <div className="mt-6 grid items-end gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="animate-fade-up">
              <p className="eyebrow">
                <span className="h-px w-6 bg-mauve" />
                La carte de la maison
              </p>
              <h1 className="mt-4 max-w-2xl text-[46px] leading-[0.98] text-mauve-900 sm:text-[62px] lg:text-[70px]">
                Tout ce dont votre <em className="text-mauve">envie</em> a besoin.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-brown-soft sm:text-[15px]">
                Croustillant, fondant, généreux… Parcourez la carte, filtrez selon
                votre faim et ajoutez vos favoris au panier. La maison s'occupe du
                reste sur WhatsApp.
              </p>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-bold text-brown-soft">
                <span className="inline-flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-mauve" />
                  {menu.products.length} recettes maison
                </span>
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-mauve" />
                  {menu.categories.length} catégories
                </span>
                <span className="inline-flex items-center gap-2">
                  <Truck className="h-4 w-4 text-mauve" />
                  Dès {formatFCFA(Number.isFinite(cheapest) ? cheapest : 0)}
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[500px] lg:mx-0 lg:ml-auto">
              <div className="relative overflow-hidden rounded-[2rem] bg-mauve-100 shadow-float">
                <MediaImage
                  src={banner?.imageUrl || "/images/spread.jpg"}
                  alt={banner?.title || "La table Maison Gourmande"}
                  sizes="(max-width: 1024px) 92vw, 44vw"
                  className="aspect-[5/3.6] w-full"
                  priority
                />
                <span className="absolute inset-0 bg-gradient-to-t from-mauve-900/80 via-mauve-900/10 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-mauve-200">
                      À ne pas manquer
                    </p>
                    <p className="mt-1 truncate font-display text-xl text-white sm:text-2xl">
                      {banner?.title || "Les box à partager"}
                    </p>
                  </div>
                  {banner ? (
                    <Link
                      href={banner.ctaHref || "/menu"}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[10px] font-extrabold text-mauve-900 transition hover:bg-cream"
                    >
                      {banner.ctaLabel || "Découvrir"}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 hidden items-center gap-2 rounded-2xl border border-brown/10 bg-white px-4 py-3 shadow-card sm:flex">
                <Clock3 className="h-4 w-4 text-mauve" />
                <p className="text-[10px] font-extrabold uppercase leading-4 tracking-wider text-brown-soft">
                  Préparé à la commande
                  <span className="block text-[9px] font-semibold normal-case tracking-normal text-brown-light">
                    {totalPieces} formats disponibles
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="no-scrollbar mt-9 flex gap-2 overflow-x-auto border-t border-brown/10 pt-6">
            {menu.categories.map((category) => (
              <Link
                key={category.id}
                href={`/menu?categorie=${category.slug}`}
                className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[11px] font-extrabold text-brown-soft shadow-sm transition hover:-translate-y-0.5 hover:text-mauve-800"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mauve-100 text-mauve-700">
                  <CategoryIcon name={category.icon} className="h-3 w-3" />
                </span>
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-4 sm:pt-6">
        <div className="container-page">
          <Reveal>
            <MenuExplorer
              categories={menu.categories}
              products={menu.products}
              initialCategory={params.categorie ?? ""}
              promotionScope={{
                all: promotedAll,
                categoryIds: promotedCategoryIds,
                productIds: promotedProductIds,
              }}
              hasPromotions={promotions.length > 0}
            />
          </Reveal>
        </div>
      </section>

      <section className="pt-16">
        <div className="container-page">
          <div className="grid gap-4 rounded-[2rem] bg-mauve-900 p-7 text-white sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="eyebrow-light">
                <span className="h-px w-5 bg-mauve-300" />
                Une grande tablée ?
              </p>
              <h2 className="mt-3 max-w-xl text-[30px] leading-tight text-white sm:text-[36px]">
                Boxes, buffets et commandes en gros : parlons-en.
              </h2>
              <p className="mt-2 max-w-xl text-[13px] leading-6 text-mauve-200/75">
                Pour un anniversaire, un événement d'entreprise ou simplement une
                faim collective, la maison compose une offre adaptée.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/evenements" className="btn-cream">
                Demander un devis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `${settings.whatsappGreeting} Je souhaite une commande en gros.`,
                )}`}
                target="_blank"
                rel="noreferrer noopener"
                className="btn border border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
