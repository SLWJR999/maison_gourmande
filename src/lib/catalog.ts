import { and, asc, desc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import {
  banners,
  categories,
  options,
  productOptions,
  productVariants,
  products,
  promotions,
  reviews,
  type Category,
  type Option,
  type Product,
  type ProductVariant,
  type Review,
} from "@/db/schema";

export type ProductWithVariants = {
  product: Product;
  category: Category;
  variants: ProductVariant[];
};

export type MenuData = {
  categories: Category[];
  products: ProductWithVariants[];
};

async function attachVariants(
  rows: Array<{ product: Product; category: Category }>,
): Promise<ProductWithVariants[]> {
  if (!rows.length) return [];
  const db = getDb();
  const ids = rows.map((row) => row.product.id);
  const variants = await db
    .select()
    .from(productVariants)
    .where(
      and(
        inArray(productVariants.productId, ids),
        eq(productVariants.isActive, true),
      ),
    )
    .orderBy(asc(productVariants.sortOrder), asc(productVariants.price));

  const byProduct = new Map<string, ProductVariant[]>();
  for (const variant of variants) {
    if (!byProduct.has(variant.productId)) byProduct.set(variant.productId, []);
    byProduct.get(variant.productId)!.push(variant);
  }

  return rows
    .map((row) => ({
      ...row,
      variants: byProduct.get(row.product.id) ?? [],
    }))
    .filter((row) => row.variants.length > 0);
}

export const getMenuData = cache(async (): Promise<MenuData> => {
  const db = getDb();
  const [categoryRows, productRows] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(and(eq(categories.isActive, true), eq(categories.isArchived, false)))
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
    db
      .select({ product: products, category: categories })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          eq(products.isActive, true),
          eq(products.isArchived, false),
          eq(categories.isActive, true),
          eq(categories.isArchived, false),
        ),
      )
      .orderBy(
        asc(products.sortOrder),
        asc(products.name),
      ),
  ]);

  const withVariants = await attachVariants(productRows);
  const availableCategories = categoryRows.filter((category) =>
    withVariants.some((row) => row.category.id === category.id),
  );

  return {
    categories: availableCategories,
    products: withVariants,
  };
});

export const getFeaturedProducts = cache(async (limit = 4) => {
  const menu = await getMenuData();
  const featured = menu.products.filter((row) => row.product.isFeatured);
  if (featured.length >= limit) return featured.slice(0, limit);
  const remaining = menu.products.filter(
    (row) => !featured.some((item) => item.product.id === row.product.id),
  );
  return [...featured, ...remaining].slice(0, limit);
});

export const getArchivedAwareProduct = cache(async (slug: string) => {
  const db = getDb();
  const [row] = await db
    .select({ product: products, category: categories })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);
  if (!row) return null;

  const variants = await db
    .select()
    .from(productVariants)
    .where(
      and(
        eq(productVariants.productId, row.product.id),
        eq(productVariants.isActive, true),
      ),
    )
    .orderBy(asc(productVariants.sortOrder), asc(productVariants.price));

  return {
    ...row,
    variants,
    available:
      row.product.isActive &&
      !row.product.isArchived &&
      row.category.isActive &&
      !row.category.isArchived,
  };
});

export const getProductOptions = cache(async (productId: string) => {
  const db = getDb();
  return db
    .select({ option: options })
    .from(productOptions)
    .innerJoin(options, eq(productOptions.optionId, options.id))
    .where(
      and(
        eq(productOptions.productId, productId),
        eq(options.isActive, true),
      ),
    )
    .orderBy(asc(options.sortOrder), asc(options.name))
    .then((rows) => rows.map((row) => row.option));
});

export const getActivePromotions = cache(async () => {
  const now = new Date();
  return getDb()
    .select()
    .from(promotions)
    .where(
      and(
        eq(promotions.isActive, true),
        or(isNull(promotions.startsAt), lte(promotions.startsAt, now)),
        or(isNull(promotions.endsAt), gte(promotions.endsAt, now)),
      ),
    )
    .orderBy(desc(promotions.showBanner), desc(promotions.createdAt));
});

export const getApprovedReviews = cache(async (limit?: number) => {
  const db = getDb();
  const query = db
    .select({
      review: reviews,
      product: products,
    })
    .from(reviews)
    .leftJoin(products, eq(reviews.productId, products.id))
    .where(eq(reviews.status, "APPROVED"))
    .orderBy(desc(reviews.isFeatured), desc(reviews.createdAt));
  const rows = limit ? await query.limit(limit) : await query;
  return rows;
});

export const getFeaturedReviews = cache(async (limit = 3) => {
  return getApprovedReviews(limit);
});

export const getReviewStats = cache(async () => {
  const rows = await getApprovedReviews();
  const count = rows.length;
  const average = count
    ? Math.round(
        (rows.reduce((sum, row) => sum + row.review.rating, 0) / count) * 10,
      ) / 10
    : null;
  return { count, average };
});

export const getProductReviews = cache(async (productId: string) => {
  const rows = await getApprovedReviews();
  return rows.filter((row) => row.review.productId === productId);
});

export const getRecommendations = cache(
  async (categoryId: string, excludeProductId: string, limit = 3) => {
    const menu = await getMenuData();
    return menu.products
      .filter(
        (row) =>
          row.category.id === categoryId && row.product.id !== excludeProductId,
      )
      .slice(0, limit);
  },
);

export async function getActiveBanners(placement: "HOME_STRIP" | "MENU" | "EVENTS") {
  const db = getDb();
  const now = new Date();
  return db
    .select()
    .from(banners)
    .where(
      and(
        eq(banners.isActive, true),
        eq(banners.placement, placement),
      ),
    )
    .orderBy(asc(banners.sortOrder))
    .then((items) =>
      items.filter(
        (banner) =>
          (!banner.startsAt || banner.startsAt <= now) &&
          (!banner.endsAt || banner.endsAt >= now),
      ),
    );
}

export type ProductOption = Option;
export type PublicReview = { review: Review; product: Product | null };

export type PublicVariantOption = {
  variantId: string;
  variantName: string;
  unitPrice: number;
  pieceCount: number;
  imageUrl: string;
  stock: number | null;
  productId: string;
  productName: string;
  productSlug: string;
  categoryId: string;
  categoryName: string;
  availability: Product["availability"];
};

export const getAllVariantOptions = cache(
  async (): Promise<PublicVariantOption[]> => {
    const menu = await getMenuData();
    return menu.products.flatMap((row) =>
      row.variants.map((variant) => ({
        variantId: variant.id,
        variantName: variant.name,
        unitPrice: variant.price,
        pieceCount: Math.max(1, variant.quantity),
        imageUrl: variant.imageUrl || row.product.imageUrl,
        stock: variant.stock,
        productId: row.product.id,
        productName: row.product.name,
        productSlug: row.product.slug,
        categoryId: row.category.id,
        categoryName: row.category.name,
        availability: row.product.availability,
      })),
    );
  },
);
