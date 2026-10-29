import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ChefHat,
  Clock3,
  Heart,
  Leaf,
  MessageCircle,
  Quote,
  Sparkles,
  Star,
  Truck,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import {
  getActiveBanners,
  getFeaturedProducts,
  getFeaturedReviews,
  getMenuData,
  getReviewStats,
} from "@/lib/catalog";
import { getCachedSettings } from "@/lib/settings";
import { CategoryCard } from "@/components/site/category-card";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeading, TextLink } from "@/components/site/section-heading";
import { MediaImage } from "@/components/ui/media-image";
import { Reveal } from "@/components/ui/reveal";
import { VideoSection } from "@/components/site/video-section";
import { formatFCFA, initials } from "@/lib/utils";
import type { Banner } from "@/db/schema";

export const dynamic = "force-dynamic";

const MARQUEE_ITEMS = [
  "Fait maison chaque jour",
  "Box à partager dès 1 000 FCFA",
  "Livraison à Dakar",
  "Commandez sur WhatsApp",
  "Des recettes généreuses",
];

function HeroTitle({ title }: { title: string }) {
  // La ponctuation suit immédiatement le mot mis en valeur : sur les petits
  // écrans, la virgule ne doit jamais se retrouver seule en début de ligne.
  const match = title.match(/^([\s\S]*?)\b(maison)\b([,.!?;:]*)([\s\S]*)$/i);
  if (!match) return <>{title}</>;

  const [, before, word, punctuation, after] = match;
  return (
    <>
      {before}
      <em className="relative inline-block text-mauve">
        {word}
        {punctuation}
        <svg
          viewBox="0 0 140 12"
          className="absolute -bottom-1 left-0 h-2.5 w-full text-mauve/30"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M2 8c30-5 70-5 136-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </em>
      {after}
    </>
  );
}

function Stars({ rating = 5, className = "" }: { rating?: number; className?: string }) {
  return (
    <span className={`flex items-center gap-0.5 ${className}`} aria-label={`${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index < Math.round(rating) ? "fill-ochre text-ochre" : "text-brown/20"
          }`}
        />
      ))}
    </span>
  );
}

function PromoCard({ banner, large = false }: { banner: Banner; large?: boolean }) {
  return (
    <Link
      href={banner.ctaHref || "/menu"}
      className={`group relative flex overflow-hidden rounded-[2rem] text-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-float ${
        large ? "min-h-[360px] sm:min-h-[420px]" : "min-h-[280px]"
      }`}
    >
      <MediaImage
        src={banner.imageUrl || "/images/crepe-nutella.jpg"}
        alt={banner.title}
        sizes={large ? "(max-width: 1024px) 100vw, 60vw" : "(max-width: 1024px) 100vw, 33vw"}
        className="absolute inset-0 h-full w-full"
        imageClassName="transition duration-700 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-gradient-to-tr from-mauve-900/95 via-mauve-900/55 to-mauve-900/5" />
      <span className="relative z-10 flex w-full flex-col justify-end p-7 sm:p-9">
        <span className="mb-auto w-fit rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] backdrop-blur">
          L'offre de la maison
        </span>
        <h3
          className={`max-w-md font-display leading-[1.02] text-white ${
            large ? "text-[42px] sm:text-[54px]" : "text-[32px]"
          }`}
        >
          {banner.title}
        </h3>
        <p className="mt-3 max-w-sm text-[13px] leading-6 text-white/75">
          {banner.subtitle}
        </p>
        <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-extrabold text-mauve-900 transition group-hover:bg-cream">
          {banner.ctaLabel}
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}

export default async function HomePage() {
  const [menu, featured, reviews, reviewStats, banners, settings] =
    await Promise.all([
      getMenuData(),
      getFeaturedProducts(4),
      getFeaturedReviews(3),
      getReviewStats(),
      getActiveBanners("HOME_STRIP"),
      getCachedSettings(),
    ]);

  const categoryCounts = new Map(
    menu.categories.map((category) => [
      category.id,
      menu.products.filter((row) => row.category.id === category.id).length,
    ]),
  );

  const boxMixte =
    menu.products.find((row) => row.product.slug === "mini-fataya") ??
    featured[0];
  const boxDefault = boxMixte?.variants[0];
  const heroImage = settings.heroImage || "/images/hero-fataya.jpg";
  const primaryBanner = banners[0];
  const secondaryBanner = banners[1];

  return (
    <>
      {/* HERO */}
      <section className="hero-grain relative overflow-hidden pb-10 pt-8 sm:pt-12 lg:pb-16 lg:pt-14">
        <div
          className="pointer-events-none absolute -right-48 -top-36 h-[560px] w-[560px] rounded-full bg-blob"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-[42%] top-24 h-16 w-16 rounded-full border border-mauve/15"
          aria-hidden="true"
        />
        <div className="container-page relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-8">
            <div className="relative z-10 animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-mauve/15 bg-white/70 px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-mauve-800 shadow-sm backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mauve opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-mauve" />
                </span>
                {settings.heroKicker}
              </span>

              <h1 className="mt-5 text-[45px] leading-[0.98] text-mauve-900 sm:text-[62px] lg:text-[72px] xl:text-[80px]">
                <HeroTitle title={settings.heroTitle} />
              </h1>

              <p className="mt-6 max-w-lg text-[14px] leading-7 text-brown-soft sm:text-[15px]">
                {settings.heroText}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/menu" className="btn-primary px-6 py-3.5">
                  Découvrir le menu
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `${settings.whatsappGreeting} Je souhaite commander.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn-secondary px-6 py-3.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  Commander sur WhatsApp
                </a>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-[11px] font-bold text-brown-soft">
                <span className="inline-flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-mauve" />
                  Fait maison
                </span>
                <span className="h-3 w-px bg-brown/15" />
                <span className="inline-flex items-center gap-2">
                  <Truck className="h-4 w-4 text-mauve" />
                  Livraison à Dakar
                </span>
                <span className="h-3 w-px bg-brown/15" />
                <span className="inline-flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-mauve" />
                  Sans paiement en ligne
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[560px] lg:mr-0">
              <div
                className="absolute -right-6 top-8 h-[82%] w-[88%] rounded-[3rem] border border-mauve-200/70 bg-mauve-100/50 rotate-3"
                aria-hidden="true"
              />
              <div className="relative overflow-visible">
                <div className="relative aspect-[4/4.7] overflow-hidden rounded-[2.5rem] bg-mauve-100 shadow-float">
                  <MediaImage
                    src={heroImage}
                    alt="Mini-fataya dorés de Maison Gourmande"
                    sizes="(max-width: 1024px) 90vw, 46vw"
                    className="absolute inset-0 h-full w-full"
                    imageClassName="transition duration-1000 hover:scale-[1.03]"
                    priority
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-mauve-900/25 via-transparent to-transparent" />

                  <div className="absolute left-4 top-4 flex max-w-[190px] items-center gap-2.5 rounded-2xl bg-white/95 p-2.5 pr-3 shadow-soft backdrop-blur sm:left-5 sm:top-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mauve-100 text-mauve-700">
                      <Heart className="h-4 w-4" fill="currentColor" />
                    </span>
                    <div>
                      <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-brown">
                        <Stars rating={reviewStats.average ?? 5} />
                        {reviewStats.average ? reviewStats.average.toFixed(1) : "—"}
                      </p>
                      <p className="mt-0.5 text-[9px] font-semibold text-brown-light">
                        {reviewStats.count > 0
                          ? `${reviewStats.count} avis gourmands`
                          : "Fait avec amour"}
                      </p>
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 sm:bottom-5 sm:left-5 sm:right-5">
                    {boxMixte && boxDefault ? (
                      <Link
                        href={`/menu/${boxMixte.product.slug}`}
                        className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-white/95 p-2.5 shadow-soft backdrop-blur transition hover:-translate-y-0.5 sm:max-w-[260px]"
                      >
                        <MediaImage
                          src={boxMixte.product.imageUrl}
                          alt={boxMixte.product.name}
                          className="h-12 w-12 shrink-0 rounded-xl"
                          sizes="48px"
                          imageClassName="transition group-hover:scale-105"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[9px] font-extrabold uppercase tracking-wider text-mauve">
                            Le favori
                          </span>
                          <span className="block truncate text-[12px] font-extrabold text-brown">
                            {boxMixte.product.name} · {boxDefault.name}
                          </span>
                          <span className="mt-0.5 block font-display text-[16px] text-mauve-900">
                            {formatFCFA(boxDefault.price)}
                          </span>
                        </span>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mauve text-white">
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="absolute -right-2 bottom-24 hidden w-32 rotate-3 overflow-hidden rounded-2xl border-4 border-cream bg-white shadow-float sm:block lg:-right-5">
                  <MediaImage
                    src="/images/crepe.jpg"
                    alt="Crêpe salée préparée maison"
                    sizes="130px"
                    className="aspect-square h-full w-full"
                  />
                </div>

                <div className="absolute -right-3 -top-7 h-[104px] w-[104px] sm:-right-5 sm:h-[118px] sm:w-[118px]">
                  <div className="relative flex h-full w-full items-center justify-center">
                    <svg
                      viewBox="0 0 120 120"
                      className="absolute inset-0 h-full w-full animate-spin-slow text-mauve-800"
                      aria-hidden="true"
                    >
                      <defs>
                        <path
                          id="circlePath"
                          d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"
                        />
                      </defs>
                      <text className="fill-current text-[8.3px] font-extrabold uppercase tracking-[0.3em]">
                        <textPath href="#circlePath">
                          Fait maison · Keur Massar · Dakar · Maison Gourmande ·
                        </textPath>
                      </text>
                    </svg>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mauve text-cream shadow-soft">
                      <Sparkles className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="relative overflow-hidden border-y border-brown/10 bg-cream-deep/70 py-3.5">
        <div className="flex w-max marquee-track items-center">
          {[0, 1].map((group) => (
            <div
              key={group}
              className="flex shrink-0 items-center"
              aria-hidden={group === 1}
            >
              {MARQUEE_ITEMS.map((item) => (
                <span
                  key={`${group}-${item}`}
                  className="flex items-center gap-6 px-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-brown-soft"
                >
                  {item}
                  <Sparkles className="h-3 w-3 text-mauve/60" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* PROMESSES */}
      <section className="pt-14 sm:pt-18 lg:pt-20">
        <div className="container-page">
          <div className="grid gap-6 border-b border-brown/10 pb-12 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ChefHat,
                title: "Cuisiné minute",
                text: "Des recettes préparées à la commande, jamais réchauffées.",
              },
              {
                icon: Leaf,
                title: "Des produits choisis",
                text: "De la fraîcheur et des produits sélectionnés chaque jour.",
              },
              {
                icon: Truck,
                title: "Livré chez vous",
                text: "Une livraison soignée à Keur Massar et Dakar, à partager ou en solo.",
              },
              {
                icon: MessageCircle,
                title: "Commande simple",
                text: "Votre panier devient un message WhatsApp prêt à envoyer.",
              },
            ].map((item, index) => (
              <Reveal
                key={item.title}
                delay={(index % 4) as 0 | 1 | 2 | 3}
                className="flex gap-3.5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-mauve-700 shadow-card">
                  <item.icon className="h-[19px] w-[19px]" />
                </span>
                <div>
                  <h3 className="font-display text-[18px] text-brown">{item.title}</h3>
                  <p className="mt-1 text-[12px] leading-5 text-brown-soft">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="pt-16 sm:pt-20 lg:pt-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="À chacun sa faim"
              title={
                <>
                  Une envie ?<br className="sm:hidden" /> Choisissez votre coin de gourmandise.
                </>
              }
              description="Du croustillant de l'apéro au fondant du dessert, la carte est pensée pour être partagée."
              href="/menu"
              linkLabel="Tout le menu"
            />
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
            {menu.categories.map((category, index) => (
              <Reveal key={category.id} delay={(index % 3) as 0 | 1 | 2}>
                <CategoryCard
                  category={category}
                  productCount={categoryCounts.get(category.id) ?? 0}
                  className="min-h-[215px] lg:min-h-[250px]"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="pt-16 sm:pt-20 lg:pt-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Les incontournables"
              title={
                <>
                  Ceux dont on <em className="text-mauve">parle</em> encore.
                </>
              }
              description="Les favoris de la maison, ceux qui reviennent dans chaque commande (ou presque)."
              href="/menu"
              linkLabel="Voir tout"
            />
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((row, index) => (
              <Reveal key={row.product.id} delay={(index % 4) as 0 | 1 | 2 | 3}>
                <ProductCard
                  data={row}
                  priority={index < 2}
                  className="h-full"
                />
              </Reveal>
            ))}
          </div>
          {featured.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-mauve/25 bg-white/60 p-10 text-center">
              <UtensilsCrossed className="mx-auto h-8 w-8 text-mauve/50" />
              <p className="mt-3 font-display text-2xl text-mauve-900">
                Le menu se prépare…
              </p>
              <p className="mt-1 text-sm text-brown-soft">
                Revenez très bientôt pour découvrir nos recettes.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* PROMOTIONS */}
      {primaryBanner ? (
        <section className="pt-16 sm:pt-20 lg:pt-24">
          <div className="container-page">
            <div className="grid gap-4 lg:grid-cols-[1.55fr_0.8fr]">
              <Reveal>
                <PromoCard banner={primaryBanner} large />
              </Reveal>
              {secondaryBanner ? (
                <Reveal delay={1}>
                  <div className="relative h-full">
                    <PromoCard banner={secondaryBanner} />
                    <span className="absolute right-5 top-5 rounded-full bg-mauve px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-white">
                      À partager
                    </span>
                  </div>
                </Reveal>
              ) : (
                <Reveal delay={1}>
                  <div className="flex h-full min-h-[280px] flex-col justify-between rounded-[2rem] bg-mauve-100 p-7 sm:p-9">
                    <div>
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-mauve">
                        <Users className="h-5 w-5" />
                      </span>
                      <h3 className="mt-5 font-display text-[32px] leading-tight text-mauve-900">
                        Les box à partager
                      </h3>
                      <p className="mt-2 text-[13px] leading-6 text-brown-soft">
                        Dès 1 000 FCFA. Pour l'apéro, le bureau ou la soirée.
                      </p>
                    </div>
                    <TextLink href="/menu">Découvrir les box</TextLink>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* VIDÉO */}
      <section className="pt-16 sm:pt-20 lg:pt-24">
        <div className="container-page">
          <Reveal>
            <VideoSection
              videoUrl={settings.videoUrl}
              poster={settings.videoPoster || "/images/chef.jpg"}
              title={settings.videoTitle}
              text={settings.videoText}
            />
          </Reveal>
        </div>
      </section>

      {/* ÉVÉNEMENTS */}
      <section className="pt-16 sm:pt-20 lg:pt-24">
        <div className="container-page">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-mauve-900 px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
              <div
                className="pointer-events-none absolute -bottom-44 -left-24 h-[420px] w-[420px] rounded-full bg-mauve-700/50 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
                <div>
                  <p className="eyebrow-light">
                    <span className="h-px w-6 bg-mauve-300" />
                    Anniversaires & événements
                  </p>
                  <h2 className="mt-4 max-w-md text-[38px] leading-[1.02] text-white sm:text-[48px] lg:text-[54px]">
                    Vos grands moments méritent une <em className="text-mauve-200">belle table</em>.
                  </h2>
                  <p className="mt-5 max-w-md text-sm leading-7 text-mauve-200/75">
                    {settings.eventIntro}
                  </p>
                  <ul className="mt-7 grid gap-3 text-[12px] font-semibold text-white/80 sm:grid-cols-2">
                    {[
                      "Anniversaires privés",
                      "Événements d'entreprise",
                      "Commandes en gros",
                      "Livraison sur le lieu",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mauve-700 text-white">
                          <Sparkles className="h-2.5 w-2.5" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link href="/evenements" className="btn-cream">
                      Demander un devis
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-mauve-200/60">
                      <Clock3 className="h-3.5 w-3.5" />
                      {settings.minLeadTime}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <MediaImage
                    src="/images/event.jpg"
                    alt="Grande tablée d'événement Maison Gourmande"
                    sizes="(max-width: 1024px) 45vw, 25vw"
                    className="aspect-[4/5] w-full rounded-[1.75rem]"
                    imageClassName="transition duration-700 hover:scale-105"
                  />
                  <div className="grid gap-3 pt-8 sm:gap-4">
                    <MediaImage
                      src="/images/tacos.jpg"
                      alt="Tacos généreux"
                      sizes="(max-width: 1024px) 45vw, 25vw"
                      className="aspect-square w-full rounded-[1.5rem]"
                      imageClassName="transition duration-700 hover:scale-105"
                    />
                    <div className="flex flex-col justify-center rounded-[1.5rem] bg-white/10 p-4 text-center backdrop-blur">
                      <span className="font-display text-[38px] leading-none text-white">24h</span>
                      <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-mauve-200/70">
                        pour vous répondre
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* AVIS */}
      <section className="pt-16 sm:pt-20 lg:pt-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Ils ont goûté"
              title={
                <>
                  Des mots qui nous <em className="text-mauve">réchauffent</em>.
                </>
              }
              description={
                reviewStats.count > 0
                  ? `${reviewStats.count} avis publiés par la communauté Maison Gourmande.`
                  : "Les premiers avis de la communauté seront bientôt ici."
              }
              href="/avis"
              linkLabel="Tous les avis"
            />
          </Reveal>

          {reviews.length > 0 ? (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {reviews.map((row, index) => (
                <Reveal key={row.review.id} delay={(index % 3) as 0 | 1 | 2}>
                  <figure className="flex h-full flex-col rounded-[1.75rem] border border-brown/10 bg-white p-6 shadow-card">
                    <div className="flex items-center justify-between">
                      <Stars rating={row.review.rating} />
                      <Quote className="h-7 w-7 text-mauve-200" />
                    </div>
                    <blockquote className="mt-5 flex-1 text-[14px] leading-7 text-brown-soft">
                      « {row.review.message} »
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3 border-t border-brown/10 pt-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mauve-100 text-[11px] font-extrabold text-mauve-800">
                        {initials(row.review.customerName)}
                      </span>
                      <div>
                        <p className="text-[12px] font-extrabold text-brown">
                          {row.review.customerName}
                        </p>
                        <p className="text-[10px] text-brown-light">
                          {row.product ? `À propos de ${row.product.name}` : "Cliente de la maison"}
                        </p>
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[2rem] border border-dashed border-mauve/25 bg-white/70 px-6 py-12 text-center">
              <Star className="mx-auto h-8 w-8 text-mauve/50" />
              <p className="mt-3 font-display text-2xl text-mauve-900">
                Les premières étoiles arrivent…
              </p>
              <p className="mt-1 text-sm text-brown-soft">
                Vous avez commandé ? Partagez votre expérience.
              </p>
              <Link href="/avis" className="btn-secondary mt-5">
                Laisser un avis
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* HISTOIRE */}
      <section className="pt-16 sm:pt-20 lg:pt-24">
        <div className="container-page">
          <Reveal>
            <div className="grid items-center gap-8 overflow-hidden rounded-[2.25rem] border border-brown/10 bg-white p-5 shadow-card sm:p-7 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
              <div className="relative overflow-hidden rounded-[1.75rem]">
                <MediaImage
                  src="/images/chef.jpg"
                  alt="L'équipe Maison Gourmande en cuisine"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="aspect-[5/4] w-full"
                />
                <div className="absolute bottom-4 left-4 rounded-2xl bg-white/90 px-4 py-3 shadow-soft backdrop-blur">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-mauve">
                    Notre promesse
                  </p>
                  <p className="mt-0.5 font-display text-lg text-brown">
                    Du vrai, du bon, du généreux.
                  </p>
                </div>
              </div>
              <div className="px-1 pb-3 sm:px-4 lg:px-8">
                <p className="eyebrow">
                  <span className="h-px w-6 bg-mauve" />
                  Notre histoire
                </p>
                <h2 className="mt-3 text-[34px] leading-[1.05] text-mauve-900 sm:text-[42px]">
                  {settings.aboutTitle}
                </h2>
                <p className="mt-5 text-sm leading-7 text-brown-soft">
                  {settings.aboutText}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Fait main", "Recettes maison", "Produits frais"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-mauve-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-mauve-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-7 flex items-center gap-3 border-t border-brown/10 pt-5">
                  <span className="font-display text-2xl italic text-mauve">La maison</span>
                  <span className="h-px flex-1 bg-mauve/15" />
                  <TextLink href="/evenements">Parlons de votre événement</TextLink>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="pt-16 sm:pt-20 lg:pt-24">
        <div className="container-page">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem]">
              <MediaImage
                src="/images/spread.jpg"
                alt="Table gourmande Maison Gourmande"
                sizes="100vw"
                className="absolute inset-0 h-full w-full"
              />
              <span className="absolute inset-0 bg-mauve-900/80" />
              <div className="relative z-10 flex flex-col items-center px-6 py-14 text-center sm:py-16 lg:py-20">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur">
                  <UtensilsCrossed className="h-5 w-5" />
                </span>
                <p className="eyebrow-light mt-5">À table</p>
                <h2 className="mt-3 max-w-2xl text-[38px] leading-[1.02] text-white sm:text-[50px]">
                  On prépare quoi pour <em className="text-mauve-200">aujourd'hui</em> ?
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-7 text-white/70">
                  Composez votre panier, envoyez-le sur WhatsApp et laissez la
                  maison s'occuper du reste.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href="/menu" className="btn-cream px-7">
                    Composer ma commande
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `${settings.whatsappGreeting} J'aurais une question.`,
                    )}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Nous écrire
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
