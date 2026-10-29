"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgePercent,
  ChefHat,
  CheckCircle2,
  Package,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import type { Category } from "@/db/schema";
import type { ProductWithVariants } from "@/lib/catalog";
import { CategoryIcon } from "@/components/site/category-icon";
import { ProductCard } from "@/components/site/product-card";
import { cn } from "@/lib/utils";

type SortValue = "recommended" | "price-asc" | "price-desc" | "name";
type BudgetValue = "all" | "under-3000" | "3000-6000" | "6000-10000" | "over-10000";

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: "recommended", label: "Nos suggestions" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "name", label: "Nom (A – Z)" },
];

const BUDGET_OPTIONS: Array<{ value: BudgetValue; label: string }> = [
  { value: "all", label: "Tous les budgets" },
  { value: "under-3000", label: "Moins de 3 000 FCFA" },
  { value: "3000-6000", label: "3 000 – 6 000 FCFA" },
  { value: "6000-10000", label: "6 000 – 10 000 FCFA" },
  { value: "over-10000", label: "Plus de 10 000 FCFA" },
];

function minPrice(product: ProductWithVariants) {
  return product.variants.reduce(
    (min, variant) => Math.min(min, variant.price),
    Number.POSITIVE_INFINITY,
  );
}

function matchesBudget(product: ProductWithVariants, budget: BudgetValue) {
  if (budget === "all") return true;
  const price = minPrice(product);
  if (budget === "under-3000") return price < 3000;
  if (budget === "3000-6000") return price >= 3000 && price <= 6000;
  if (budget === "6000-10000") return price > 6000 && price <= 10000;
  return price > 10000;
}

export function MenuExplorer({
  categories,
  products,
  initialCategory = "",
  promotionScope,
  hasPromotions = false,
}: {
  categories: Category[];
  products: ProductWithVariants[];
  initialCategory?: string;
  promotionScope?: {
    all: boolean;
    categoryIds: string[];
    productIds: string[];
  };
  hasPromotions?: boolean;
}) {
  const validInitial = categories.some((category) => category.slug === initialCategory)
    ? initialCategory
    : "all";
  const [category, setCategory] = useState(validInitial);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortValue>("recommended");
  const [boxesOnly, setBoxesOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [promoOnly, setPromoOnly] = useState(false);
  const [budget, setBudget] = useState<BudgetValue>("all");
  const deferredQuery = useDeferredValue(query);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of products) {
      map.set(row.category.slug, (map.get(row.category.slug) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    const rows = products.filter((row) => {
      if (category !== "all" && row.category.slug !== category) return false;
      if (availableOnly && row.product.availability !== "AVAILABLE") return false;
      if (promoOnly) {
        const scoped =
          promotionScope?.all ||
          promotionScope?.categoryIds.includes(row.category.id) ||
          promotionScope?.productIds.includes(row.product.id);
        const reduced = row.variants.some(
          (variant) =>
            variant.compareAtPrice !== null &&
            variant.compareAtPrice > variant.price,
        );
        if (!scoped && !reduced) return false;
      }
      if (!matchesBudget(row, budget)) return false;
      if (
        boxesOnly &&
        !row.variants.some((variant) => variant.quantity > 1)
      ) {
        return false;
      }
      if (!needle) return true;
      return [
        row.product.name,
        row.product.shortDescription,
        row.product.description,
        row.category.name,
        ...row.variants.map((variant) => variant.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });

    return [...rows].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return minPrice(a) - minPrice(b);
        case "price-desc":
          return minPrice(b) - minPrice(a);
        case "name":
          return a.product.name.localeCompare(b.product.name, "fr");
        default:
          return (
            Number(b.product.isFeatured) - Number(a.product.isFeatured) ||
            a.product.sortOrder - b.product.sortOrder ||
            a.product.name.localeCompare(b.product.name, "fr")
          );
      }
    });
  }, [products, category, boxesOnly, availableOnly, promoOnly, promotionScope, budget, deferredQuery, sort]);

  const activeFilterCount =
    (category !== "all" ? 1 : 0) +
    (boxesOnly ? 1 : 0) +
    (availableOnly ? 1 : 0) +
    (promoOnly ? 1 : 0) +
    (budget !== "all" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const reset = () => {
    setCategory("all");
    setQuery("");
    setBoxesOnly(false);
    setAvailableOnly(false);
    setPromoOnly(false);
    setBudget("all");
    setSort("recommended");
  };

  return (
    <div>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[12px] font-extrabold transition",
            category === "all"
              ? "border-mauve bg-mauve text-white shadow-soft"
              : "border-brown/10 bg-white text-brown-soft hover:border-mauve/30 hover:text-mauve-800",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Tout le menu
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px]",
              category === "all" ? "bg-white/20" : "bg-cream text-brown-light",
            )}
          >
            {products.length}
          </span>
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.slug)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[12px] font-extrabold transition",
              category === item.slug
                ? "border-mauve bg-mauve text-white shadow-soft"
                : "border-brown/10 bg-white text-brown-soft hover:border-mauve/30 hover:text-mauve-800",
            )}
          >
            <CategoryIcon name={item.icon} className="h-3.5 w-3.5" />
            {item.name}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px]",
                category === item.slug
                  ? "bg-white/20"
                  : "bg-cream text-brown-light",
              )}
            >
              {counts.get(item.slug) ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-[1.5rem] border border-brown/10 bg-white/80 p-3 shadow-card backdrop-blur sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Rechercher un produit</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-light" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Une envie ? Fataya, tacos, crêpe…"
            className="w-full rounded-xl border border-transparent bg-cream/80 py-3 pl-11 pr-10 text-sm text-brown outline-none transition placeholder:text-brown-light/80 focus:border-mauve/30 focus:bg-white focus:ring-4 focus:ring-mauve/10"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Effacer la recherche"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-brown-light hover:bg-cream hover:text-brown"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBoxesOnly((value) => !value)}
            aria-pressed={boxesOnly}
            className={cn(
              "inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-3.5 text-[11px] font-extrabold transition",
              boxesOnly
                ? "border-mauve bg-mauve-100 text-mauve-800"
                : "border-brown/10 bg-white text-brown-soft hover:border-mauve/30",
            )}
          >
            <Package className="h-3.5 w-3.5" />
            Boxes
          </button>

          <label className="relative">
            <span className="sr-only">Trier les produits</span>
            <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brown-light" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortValue)}
              className="min-h-[42px] cursor-pointer appearance-none rounded-xl border border-brown/10 bg-white py-2 pl-9 pr-8 text-[11px] font-extrabold text-brown-soft outline-none transition focus:border-mauve/40 focus:ring-4 focus:ring-mauve/10"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="no-scrollbar mt-2 flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setAvailableOnly((value) => !value)}
          aria-pressed={availableOnly}
          className={cn(
            "inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-[10px] font-extrabold transition",
            availableOnly
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-brown/10 bg-white text-brown-soft hover:border-emerald-300",
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Disponibles
        </button>
        {hasPromotions ? (
          <button
            type="button"
            onClick={() => setPromoOnly((value) => !value)}
            aria-pressed={promoOnly}
            className={cn(
              "inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-[10px] font-extrabold transition",
              promoOnly
                ? "border-mauve bg-mauve-100 text-mauve-800"
                : "border-brown/10 bg-white text-brown-soft hover:border-mauve/30",
            )}
          >
            <BadgePercent className="h-3.5 w-3.5" />
            Avec une offre
          </button>
        ) : null}
        <label className="relative shrink-0">
          <span className="sr-only">Filtrer par budget</span>
          <select
            value={budget}
            onChange={(event) => setBudget(event.target.value as BudgetValue)}
            className={cn(
              "min-h-[38px] cursor-pointer appearance-none rounded-full border bg-white py-1.5 pl-3.5 pr-8 text-[10px] font-extrabold outline-none transition focus:border-mauve/40 focus:ring-4 focus:ring-mauve/10",
              budget === "all"
                ? "border-brown/10 text-brown-soft"
                : "border-mauve/40 text-mauve-800",
            )}
          >
            {BUDGET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-brown-light" />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] font-semibold text-brown-soft">
          <span className="font-extrabold text-mauve-800">{filtered.length}</span>{" "}
          {filtered.length > 1 ? "gourmandises" : "gourmandise"}
          {category !== "all" ? (
            <>
              {" "}
              dans{" "}
              <span className="font-extrabold text-brown">
                {categories.find((item) => item.slug === category)?.name}
              </span>
            </>
          ) : null}
        </p>
        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-mauve-700 transition hover:text-mauve-900"
          >
            <X className="h-3 w-3" />
            Réinitialiser les filtres
          </button>
        ) : null}
      </div>

      {filtered.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((row, index) => (
            <ProductCard
              key={row.product.id}
              data={row}
              priority={index < 4}
              className="h-full"
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-[2rem] border border-dashed border-mauve/25 bg-white/70 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mauve-100 text-mauve-700">
            <ChefHat className="h-6 w-6" />
          </span>
          <h3 className="mt-4 font-display text-2xl text-mauve-900">
            Rien ne correspond encore…
          </h3>
          <p className="mt-1 max-w-sm text-sm leading-6 text-brown-soft">
            Essayez un autre mot, une autre catégorie, ou laissez-vous guider par
            nos suggestions.
          </p>
          <button type="button" onClick={reset} className="btn-secondary mt-5">
            Voir toute la carte
          </button>
        </div>
      )}
    </div>
  );
}
