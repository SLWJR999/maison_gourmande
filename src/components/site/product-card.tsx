import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProductWithVariants } from "@/lib/catalog";
import { MediaImage } from "@/components/ui/media-image";
import { QuickAddButton } from "@/components/site/quick-add-button";
import { formatFCFA, cn } from "@/lib/utils";

export function ProductCard({
  data,
  className,
  priority = false,
}: {
  data: ProductWithVariants;
  className?: string;
  priority?: boolean;
}) {
  const { product, category, variants } = data;
  const defaultVariant = variants[0];
  const minVariant = variants.reduce(
    (min, variant) => (variant.price < min.price ? variant : min),
    variants[0],
  );
  const comparePrice = minVariant.compareAtPrice;
  const discount =
    comparePrice && comparePrice > minVariant.price
      ? Math.round(((comparePrice - minVariant.price) / comparePrice) * 100)
      : 0;
  const priceRange =
    variants.length > 1 &&
    variants.some((variant) => variant.price !== minVariant.price);
  const isBox = defaultVariant.quantity > 1;
  const soldOut =
    product.availability === "SOLD_OUT" ||
    variants.every(
      (variant) => variant.stock !== null && variant.stock !== undefined && variant.stock <= 0,
    );
  const comingSoon = product.availability === "COMING_SOON";
  const purchasable = !soldOut && !comingSoon;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-[1.75rem] border border-brown/[0.08] bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(91,64,53,0.4)]",
        className,
      )}
    >
      <Link
        href={`/menu/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-cream-deep"
      >
        <MediaImage
          src={product.imageUrl}
          alt={product.name}
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
          className="absolute inset-0 h-full w-full"
          imageClassName="transition duration-700 group-hover:scale-[1.04]"
          priority={priority}
        />
        <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.badge ? (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-mauve-800 shadow-sm backdrop-blur">
              {product.badge}
            </span>
          ) : null}
          {discount > 0 ? (
            <span className="rounded-full bg-mauve px-2.5 py-1 text-[10px] font-extrabold text-white shadow-sm">
              −{discount}%
            </span>
          ) : null}
          {isBox ? (
            <span className="rounded-full bg-brown/75 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur">
              {defaultVariant.quantity} pièces
            </span>
          ) : null}
          {soldOut ? (
            <span className="rounded-full bg-brown/85 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur">
              Épuisé
            </span>
          ) : null}
          {comingSoon ? (
            <span className="rounded-full bg-ochre px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              Bientôt
            </span>
          ) : null}
        </span>
        <span className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-white text-mauve-800 opacity-0 shadow-soft transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-[18px]">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-mauve/80">
          {category.name}
        </p>
        <Link href={`/menu/${product.slug}`} className="mt-1.5 block">
          <h3 className="font-display text-[21px] leading-[1.15] text-brown transition group-hover:text-mauve-800">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-brown-soft">
          {product.shortDescription}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-brown-light">
              {priceRange ? "Dès" : "Prix"}
            </span>
            <p className="flex flex-wrap items-baseline gap-1.5">
              <span className="font-display text-[19px] font-semibold text-mauve-900">
                {formatFCFA(minVariant.price)}
              </span>
              {comparePrice && comparePrice > minVariant.price ? (
                <span className="text-[11px] text-brown-light line-through">
                  {formatFCFA(comparePrice)}
                </span>
              ) : null}
            </p>
          </div>
          {defaultVariant && purchasable ? (
            <QuickAddButton
              data={{
                productId: product.id,
                variantId: defaultVariant.id,
                slug: product.slug,
                name: product.name,
                variantName: defaultVariant.name,
                imageUrl: product.imageUrl,
                unitPrice: defaultVariant.price,
                pieceCount: defaultVariant.quantity,
              }}
            />
          ) : (
            <span className="rounded-full bg-cream px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-brown-light">
              {comingSoon ? "Bientôt" : "Indisponible"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
