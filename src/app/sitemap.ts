import type { MetadataRoute } from "next";
import { getMenuData } from "@/lib/catalog";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

const staticRoutes: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/menu", priority: 0.9, changeFrequency: "weekly" },
  { path: "/promotions", priority: 0.8, changeFrequency: "daily" },
  { path: "/evenements", priority: 0.7, changeFrequency: "monthly" },
  { path: "/avis", priority: 0.7, changeFrequency: "weekly" },
  { path: "/a-propos", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/conditions", priority: 0.3, changeFrequency: "yearly" },
  { path: "/confidentialite", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = staticRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const menu = await getMenuData();
    const productEntries = menu.products
      .filter((row) => row.product.isActive && !row.product.isArchived)
      .map((row) => ({
        url: `${siteUrl}/menu/${row.product.slug}`,
        lastModified: row.product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));

    return [...staticEntries, ...productEntries];
  } catch (error) {
    // Le sitemap ne doit jamais empêcher le build ou le rendu du site.
    console.error("Sitemap : catalogue indisponible, routes statiques seules.", error);
    return staticEntries;
  }
}
