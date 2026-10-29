import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ChefHat,
  ChevronRight,
  Clock3,
  Info,
  Leaf,
  MessageCircle,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import {
  getArchivedAwareProduct,
  getFeaturedProducts,
  getProductOptions,
  getProductReviews,
  getRecommendations,
} from "@/lib/catalog";
import { getCachedSettings } from "@/lib/settings";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductCard } from "@/components/site/product-card";
import { SectionHeading } from "@/components/site/section-heading";
import { MediaImage } from "@/components/ui/media-image";
import { Reveal } from "@/components/ui/reveal";
import { CategoryIcon } from "@/components/site/category-icon";
import { formatDate, formatFCFA, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const row = await getArchivedAwareProduct(slug);
  if (!row) return { title: "Produit introuvable" };
  return {
    title: row.product.name,
    description:
      row.product.shortDescription ||
      row.product.description.slice(0, 160) ||
      `${row.product.name} — Maison Gourmande`,
    alternates: { canonical: `/menu/${row.product.slug}` },
    openGraph: {
      title: `${row.product.name} · Maison Gourmande`,
      description: row.product.shortDescription,
      images: row.product.imageUrl ? [{ url: row.product.imageUrl }] : [],
    },
  };
}

function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index < Math.round(rating) ? "fill-ochre text-ochre" : "text-brown/15"
          }`}
        />
      ))}
    </span>
  );
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const row = await getArchivedAwareProduct(slug);
  if (
    !row ||
    row.product.isArchived ||
    row.category.isArchived ||
    !row.category.isActive ||
    !row.product.isActive
  ) {
    notFound();
  }

  const [options, reviews, recommendations, featured, settings] = await Promise.all([
    getProductOptions(row.product.id),
    getProductReviews(row.product.id),
    getRecommendations(row.category.id, row.product.id, 3),
    getFeaturedProducts(12),
    getCachedSettings(),
  ]);

  const fills = [...featured, ...recommendations].filter(
    (item, index, array) =>
      item.product.id !== row.product.id &&
      array.findIndex((candidate) => candidate.product.id === item.product.id) === index,
  );
  const suggestions = (recommendations.length >= 3 ? recommendations : fills).slice(0, 3);

  const galleryImages = Array.from(
    new Set([
      row.product.imageUrl,
      ...row.product.images,
      ...row.variants.map((variant) => variant.imageUrl).filter(Boolean),
    ]),
  ).filter(Boolean);

  const reviewAverage = reviews.length
    ? Math.round(
        (reviews.reduce((sum, item) => sum + item.review.rating, 0) / reviews.length) * 10,
      ) / 10
    : null;
  const priceRange = row.variants.reduce(
    (range, variant) => ({
      min: Math.min(range.min, variant.price),
      max: Math.max(range.max, variant.price),
    }),
    { min: Number.POSITIVE_INFINITY, max: 0 },
  );
  const unavailable =
    row.product.availability !== "AVAILABLE" ||
    row.variants.every(
      (variant) => variant.stock !== null && variant.stock !== undefined && variant.stock <= 0,
    );
  const whatsappHref = `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `${settings.whatsappGreeting} J'aurais une question sur « ${row.product.name} ».`,
  )}`;

  return (
    <div className="pb-20">
      <div className="container-page pt-6">
        <nav
          aria-label="Fil d'Ariane"
          className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-brown-light"
        >
          <Link href="/" className="transition hover:text-mauve-800">
            Accueil
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/menu" className="transition hover:text-mauve-800">
            Menu
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            href={`/menu?categorie=${row.category.slug}`}
            className="transition hover:text-mauve-800"
          >
            {row.category.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-mauve-800">{row.product.name}</span>
        </nav>
      </div>

      <section className="pt-5">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:gap-12">
            <Reveal>
              <ProductGallery
                images={galleryImages}
                name={row.product.name}
                badge={row.product.badge}
              />
              {row.product.videoUrl ? (
                <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-brown/10 bg-black">
                  <video
                    src={row.product.videoUrl}
                    controls
                    preload="metadata"
                    className="aspect-video w-full"
                  >
                    Votre navigateur ne prend pas en charge la lecture vidéo.
                  </video>
                </div>
              ) : null}
            </Reveal>

            <Reveal delay={1}>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/menu?categorie=${row.category.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-mauve-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-mauve-800 transition hover:bg-mauve-200"
                >
                  <CategoryIcon name={row.category.icon} className="h-3 w-3" />
                  {row.category.name}
                </Link>
                {row.product.isFeatured ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ochre-light px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-brown">
                    <Sparkles className="h-3 w-3" />
                    Incontournable
                  </span>
                ) : null}
                {unavailable ? (
                  <span className="rounded-full bg-brown/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-brown-soft">
                    {row.product.availability === "COMING_SOON"
                      ? "Bientôt disponible"
                      : "Temporairement épuisé"}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-[42px] leading-[0.98] text-mauve-900 sm:text-[52px]">
                {row.product.name}
              </h1>
              <p className="mt-3 max-w-xl text-[14px] leading-7 text-brown-soft">
                {row.product.shortDescription}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="font-display text-[30px] text-mauve-900">
                  {priceRange.min === priceRange.max
                    ? formatFCFA(priceRange.min)
                    : `Dès ${formatFCFA(priceRange.min)}`}
                  <span className="ml-1 font-sans text-[11px] font-bold text-brown-light">
                    / {row.variants[0]?.quantity > 1 ? "box" : "unité"}
                  </span>
                </p>
                {reviewAverage ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-brown shadow-sm">
                    <Stars rating={reviewAverage} />
                    {reviewAverage.toFixed(1)}
                    <span className="font-semibold text-brown-light">
                      ({reviews.length})
                    </span>
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-brown-light">
                    Nouveau sur la carte
                  </span>
                )}
                {row.product.preparationMinutes ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brown-soft">
                    <Clock3 className="h-3.5 w-3.5 text-mauve" />
                    ±{row.product.preparationMinutes} min
                  </span>
                ) : null}
              </div>

              <p className="mt-5 max-w-xl whitespace-pre-line text-[13px] leading-7 text-brown-soft">
                {row.product.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "Préparé à la commande",
                  "Sans paiement en ligne",
                  "Confirmation sur WhatsApp",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-brown/10 bg-white px-3 py-1.5 text-[10px] font-bold text-brown-soft"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-7 rounded-[1.75rem] border border-brown/10 bg-white p-5 shadow-card sm:p-6">
                <ProductPurchase
                  product={{
                    id: row.product.id,
                    slug: row.product.slug,
                    name: row.product.name,
                    imageUrl: row.product.imageUrl,
                    preparationMinutes: row.product.preparationMinutes,
                  }}
                  variants={row.variants}
                  options={options}
                  availability={row.product.availability}
                />
              </div>

              <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-mauve-900 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ochre-light" />
                  <p className="text-[11px] leading-5 text-mauve-200/85">
                    Votre commande ne sera confirmée qu'après la réponse de la
                    boutique. Aucun paiement n'est demandé sur le site.
                  </p>
                </div>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-[10px] font-extrabold text-white transition hover:bg-white/20"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Une question ?
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="container-page">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.75rem] border border-brown/10 bg-white p-6 shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mauve-100 text-mauve-700">
                <ChefHat className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-xl text-mauve-900">
                La préparation
              </h2>
              <p className="mt-2 text-[12.5px] leading-6 text-brown-soft">
                {row.product.ingredients ||
                  "Une recette maison préparée minute avec des produits choisis chaque jour."}
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-brown/10 bg-white p-6 shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mauve-100 text-mauve-700">
                <Leaf className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-xl text-mauve-900">
                Bon à savoir
              </h2>
              <p className="mt-2 text-[12.5px] leading-6 text-brown-soft">
                {row.product.allergens
                  ? `Allergènes / informations : ${row.product.allergens}`
                  : "Allergènes et informations précises sur demande auprès de la maison. Les recettes peuvent évoluer selon la saison."}
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-brown/10 bg-white p-6 shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mauve-100 text-mauve-700">
                <Truck className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-xl text-mauve-900">
                Livraison & retrait
              </h2>
              <p className="mt-2 text-[12.5px] leading-6 text-brown-soft">
                Livraison à Dakar ({settings.cuisineZone}). Retrait possible sur
                place. Les frais et le créneau sont confirmés avec la boutique.
              </p>
            </div>
          </div>
        </div>
      </section>

      {reviews.length > 0 ? (
        <section className="pt-14">
          <div className="container-page">
            <SectionHeading
              eyebrow="Ils ont goûté"
              title={
                <>
                  Ce qu'on dit de <em className="text-mauve">{row.product.name}</em>.
                </>
              }
              href="/avis"
              linkLabel="Tous les avis"
            />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {reviews.slice(0, 2).map(({ review }) => (
                <figure
                  key={review.id}
                  className="rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <Stars rating={review.rating} />
                    <Quote className="h-5 w-5 text-mauve-200" />
                  </div>
                  <blockquote className="mt-3 text-[13px] leading-6 text-brown-soft">
                    « {review.message} »
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-2.5 border-t border-brown/10 pt-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mauve-100 text-[10px] font-extrabold text-mauve-800">
                      {initials(review.customerName)}
                    </span>
                    <div>
                      <p className="text-[11px] font-extrabold text-brown">
                        {review.customerName}
                      </p>
                      <p className="text-[9px] text-brown-light">
                        {formatDate(review.approvedAt ?? review.createdAt)}
                      </p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {suggestions.length > 0 ? (
        <section className="pt-14">
          <div className="container-page">
            <SectionHeading
              eyebrow="À compléter"
              title={
                <>
                  On ajoute quelque chose <em className="text-mauve">avec ça</em> ?
                </>
              }
              description="Les associations préférées de la maison, à ajouter en un geste."
              href="/menu"
              linkLabel="Tout le menu"
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((item, index) => (
                <Reveal key={item.product.id} delay={(index % 3) as 0 | 1 | 2}>
                  <ProductCard data={item} className="h-full" />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="pt-14">
        <div className="container-page">
          <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-cream-deep px-6 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-mauve-700 shadow-sm">
              <Info className="h-5 w-5" />
            </span>
            <h2 className="max-w-xl text-[28px] leading-tight text-mauve-900">
              Une commande spéciale, une allergie, une grande tablée ?
            </h2>
            <p className="max-w-lg text-[13px] leading-6 text-brown-soft">
              Écrivez-nous : la maison vous répond et adapte la préparation quand
              c'est possible.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-primary"
              >
                <MessageCircle className="h-4 w-4" />
                Écrire sur WhatsApp
              </a>
              <Link href="/evenements" className="btn-secondary">
                Demander un devis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
