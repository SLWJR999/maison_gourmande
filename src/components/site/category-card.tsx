import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/db/schema";
import { CategoryIcon } from "@/components/site/category-icon";
import { MediaImage } from "@/components/ui/media-image";

export function CategoryCard({
  category,
  productCount,
  className = "",
}: {
  category: Category;
  productCount: number;
  className?: string;
}) {
  return (
    <Link
      href={`/menu?categorie=${category.slug}`}
      className={`group relative flex min-h-[230px] flex-col justify-end overflow-hidden rounded-[1.75rem] bg-mauve-800 p-5 text-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-float ${className}`}
    >
      <MediaImage
        src={category.imageUrl}
        alt={category.name}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
        className="absolute inset-0 h-full w-full"
        imageClassName="transition duration-700 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-mauve-900/90 via-mauve-900/20 to-transparent" />
      <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur-md">
        <CategoryIcon name={category.icon} className="h-4 w-4" />
      </span>
      <span className="relative z-10 flex items-end justify-between gap-2">
        <span>
          <span className="block font-display text-[22px] leading-tight text-white">
            {category.name}
          </span>
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
            {productCount} produit{productCount > 1 ? "s" : ""}
          </span>
        </span>
        <span className="flex h-8 w-8 shrink-0 translate-y-1 items-center justify-center rounded-full bg-white text-mauve-800 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </span>
    </Link>
  );
}
