import Link from "next/link";
import { and, asc, eq, like, or } from "drizzle-orm";
import {
  Archive,
  ArchiveRestore,
  Copy,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { getDb } from "@/db";
import { categories, productVariants, products } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { formatFCFA } from "@/lib/utils";
import {
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { duplicateProduct, setProductState } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produits" };

const AVAILABILITY_LABELS = {
  AVAILABLE: "Disponible",
  SOLD_OUT: "Épuisé",
  COMING_SOON: "Bientôt",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    error?: string;
    q?: string;
    categorie?: string;
    dispo?: string;
    archives?: string;
  }>;
}) {
  await requirePermission("products:read");
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const archived = params.archives === "1";

  const conditions = [eq(products.isArchived, archived)];
  if (q) {
    const search = `%${q}%`;
    conditions.push(
      or(like(products.name, search), like(products.slug, search))!,
    );
  }
  if (params.categorie) conditions.push(eq(products.categoryId, params.categorie));
  if (params.dispo) {
    const dispo = params.dispo as keyof typeof AVAILABILITY_LABELS;
    if (AVAILABILITY_LABELS[dispo]) conditions.push(eq(products.availability, dispo));
  }

  const [categoryRows, productRows, variantRows] = await Promise.all([
    getDb()
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
    getDb()
      .select({ product: products, category: categories })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(asc(products.sortOrder), asc(products.name)),
    getDb().select().from(productVariants),
  ]);

  const variantsByProduct = new Map<string, typeof variantRows>();
  for (const variant of variantRows) {
    const list = variantsByProduct.get(variant.productId) ?? [];
    list.push(variant);
    variantsByProduct.set(variant.productId, list);
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Produits"
        description="Fiche, photos, formats, options, disponibilité et coûts. Les prix affichés au public sont toujours recalculés côté serveur."
        actions={
          <Link href="/admin/produits/nouveau" className="btn-primary btn-sm">
            <Plus className="h-3.5 w-3.5" />
            Nouveau produit
          </Link>
        }
      />

      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}

      <form className="admin-card flex flex-col gap-2 p-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="q" className="admin-label">
            Recherche
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-light" />
            <input
              id="q"
              name="q"
              defaultValue={q}
              className="admin-input pl-9"
              placeholder="Nom ou slug…"
            />
          </div>
        </div>
        <div>
          <label htmlFor="categorie" className="admin-label">
            Catégorie
          </label>
          <select
            id="categorie"
            name="categorie"
            defaultValue={params.categorie ?? ""}
            className="admin-select min-w-[160px]"
          >
            <option value="">Toutes</option>
            {categoryRows.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dispo" className="admin-label">
            Disponibilité
          </label>
          <select
            id="dispo"
            name="dispo"
            defaultValue={params.dispo ?? ""}
            className="admin-select min-w-[130px]"
          >
            <option value="">Toutes</option>
            {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex h-[42px] items-center gap-2 rounded-xl border border-brown/10 px-3 text-[11px] font-bold text-brown-soft">
          <input
            type="checkbox"
            name="archives"
            value="1"
            defaultChecked={archived}
            className="h-4 w-4 accent-mauve"
          />
          Archives
        </label>
        <button type="submit" className="btn-secondary btn-sm h-[42px]">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtrer
        </button>
      </form>

      {productRows.length ? (
        <div className="grid gap-2.5">
          {productRows.map(({ product, category }) => {
            const variants = variantsByProduct.get(product.id) ?? [];
            const activeVariants = variants.filter((variant) => variant.isActive);
            const minPrice = activeVariants.length
              ? Math.min(...activeVariants.map((variant) => variant.price))
              : null;
            return (
              <div key={product.id} className="admin-card p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <span className="relative h-[70px] w-[70px] shrink-0 overflow-hidden rounded-xl bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrl || "/images/spread.jpg"}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/admin/produits/${product.id}`}
                        className="font-display text-[20px] leading-tight text-mauve-900 hover:underline"
                      >
                        {product.name}
                      </Link>
                      {product.isFeatured ? (
                        <span className="rounded bg-ochre/20 px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-amber-800">
                          Mise en avant
                        </span>
                      ) : null}
                      {!product.isActive || product.isArchived ? (
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[8px] font-bold uppercase text-stone-500">
                          {product.isArchived ? "Archivé" : "Masqué"}
                        </span>
                      ) : null}
                      <span
                        className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                          product.availability === "AVAILABLE"
                            ? "bg-emerald-50 text-emerald-700"
                            : product.availability === "SOLD_OUT"
                              ? "bg-red-50 text-red-600"
                              : "bg-sky-50 text-sky-700"
                        }`}
                      >
                        {AVAILABILITY_LABELS[product.availability]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-brown-light">
                      {category.name} · {activeVariants.length} format(s) actif(s)
                      {minPrice !== null ? ` · dès ${formatFCFA(minPrice)}` : " · aucun format actif"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-brown-soft">
                      {product.shortDescription || product.description || "Pas de description."}
                    </p>
                    <p className="mt-1 text-[9px] text-brown-light">
                      Coût matière / pièce : {product.costPrice > 0 ? formatFCFA(product.costPrice) : "non renseigné"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:flex-col sm:items-stretch">
                    <Link
                      href={`/admin/produits/${product.id}`}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-brown/10 px-2.5 py-1.5 text-[10px] font-bold text-mauve-700 hover:bg-mauve-100/40"
                    >
                      <Pencil className="h-3 w-3" />
                      Modifier
                    </Link>
                    <div className="flex flex-wrap gap-1.5">
                      {!product.isArchived ? (
                        <>
                          <form action={setProductState}>
                            <input type="hidden" name="id" value={product.id} />
                            <input type="hidden" name="action" value="toggle" />
                            <input
                              type="hidden"
                              name="value"
                              value={product.isActive ? "false" : "true"}
                            />
                            <button
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-brown-soft hover:bg-cream"
                              title={product.isActive ? "Masquer" : "Afficher"}
                            >
                              {product.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                          </form>
                          <form action={setProductState}>
                            <input type="hidden" name="id" value={product.id} />
                            <input type="hidden" name="action" value="archive" />
                            <button
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50"
                              title="Archiver"
                            >
                              <Archive className="h-3 w-3" />
                            </button>
                          </form>
                          <form action={duplicateProduct}>
                            <input type="hidden" name="id" value={product.id} />
                            <button
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-brown-soft hover:bg-cream"
                              title="Dupliquer"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </form>
                        </>
                      ) : (
                        <form action={setProductState}>
                          <input type="hidden" name="id" value={product.id} />
                          <input type="hidden" name="action" value="restore" />
                          <button className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50">
                            <ArchiveRestore className="h-3 w-3" />
                            Restaurer
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <AdminEmpty
          title="Aucun produit trouvé"
          description="Modifiez les filtres ou créez un nouveau produit."
          action={
            <Link href="/admin/produits/nouveau" className="btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" />
              Nouveau produit
            </Link>
          }
        />
      )}
    </div>
  );
}
