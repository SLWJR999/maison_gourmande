import { and, asc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  Images,
  ListChecks,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { getDb } from "@/db";
import {
  categories,
  options,
  productOptions,
  productVariants,
  products,
  type ProductVariant,
} from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { formatFCFA } from "@/lib/utils";
import { ProductForm } from "@/components/admin/product-form";
import {
  AdminBreadcrumb,
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import {
  deleteVariant,
  duplicateProduct,
  saveProduct,
  saveProductOptions,
  saveVariant,
  setProductState,
} from "../actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Modifier un produit" };

function VariantForm({
  productId,
  variant,
}: {
  productId: string;
  variant?: ProductVariant;
}) {
  const key = variant?.id ?? "new";
  return (
    <form action={saveVariant} className="grid gap-2.5 sm:grid-cols-2">
      <input type="hidden" name="productId" value={productId} />
      {variant ? <input type="hidden" name="id" value={variant.id} /> : null}
      <div>
        <label className="admin-label" htmlFor={`vname-${key}`}>
          Nom du format *
        </label>
        <input
          id={`vname-${key}`}
          name="name"
          required
          defaultValue={variant?.name ?? ""}
          className="admin-input"
          placeholder="Box 10 pièces"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`vqty-${key}`}>
          Nombre de pièces / unités
        </label>
        <input
          id={`vqty-${key}`}
          name="quantity"
          type="number"
          min={1}
          defaultValue={variant?.quantity ?? 1}
          className="admin-input"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`vprice-${key}`}>
          Prix (FCFA) *
        </label>
        <input
          id={`vprice-${key}`}
          name="price"
          type="number"
          min={0}
          step={5}
          required
          defaultValue={variant?.price ?? 0}
          className="admin-input"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`vcompare-${key}`}>
          Prix barré (FCFA)
        </label>
        <input
          id={`vcompare-${key}`}
          name="compareAtPrice"
          type="number"
          min={0}
          defaultValue={variant?.compareAtPrice ?? ""}
          className="admin-input"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`vstock-${key}`}>
          Stock (vide = non suivi)
        </label>
        <input
          id={`vstock-${key}`}
          name="stock"
          type="number"
          min={0}
          defaultValue={variant?.stock ?? ""}
          className="admin-input"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`vsort-${key}`}>
          Ordre
        </label>
        <input
          id={`vsort-${key}`}
          name="sortOrder"
          type="number"
          defaultValue={variant?.sortOrder ?? 0}
          className="admin-input"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="admin-label" htmlFor={`vimage-${key}`}>
          Image du format (URL)
        </label>
        <input
          id={`vimage-${key}`}
          name="imageUrl"
          defaultValue={variant?.imageUrl ?? ""}
          className="admin-input"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="admin-label" htmlFor={`vcomposition-${key}`}>
          Composition du format
        </label>
        <textarea
          id={`vcomposition-${key}`}
          name="composition"
          rows={2}
          defaultValue={variant?.composition ?? ""}
          className="admin-textarea"
          placeholder="6 fataya, 2 nems, sauce maison…"
        />
      </div>
      <label className="flex items-center gap-2 rounded-xl border border-brown/10 px-3 py-2 text-[11px] font-bold text-brown-soft">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={variant?.isActive ?? true}
          className="h-4 w-4 accent-mauve"
        />
        Format proposé au public
      </label>
      <button type="submit" className="btn-primary btn-sm">
        <Save className="h-3.5 w-3.5" />
        {variant ? "Enregistrer" : "Ajouter le format"}
      </button>
    </form>
  );
}

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requirePermission("products:read");
  const { id } = await params;
  const notices = await searchParams;
  const db = getDb();

  const [row] = await db
    .select({ product: products, category: categories })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1);
  if (!row) notFound();
  const { product, category } = row;

  const [categoryRows, variantRows, optionRows, assignedRows] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(eq(categories.isArchived, false))
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id))
      .orderBy(asc(productVariants.sortOrder), asc(productVariants.price)),
    db
      .select()
      .from(options)
      .where(eq(options.isActive, true))
      .orderBy(asc(options.sortOrder), asc(options.name)),
    db
      .select({ optionId: productOptions.optionId })
      .from(productOptions)
      .where(eq(productOptions.productId, id)),
  ]);
  const assigned = new Set(assignedRows.map((item) => item.optionId));
  const gallery = Array.from(
    new Set([product.imageUrl, ...product.images].filter(Boolean)),
  );

  return (
    <div className="space-y-5">
      <AdminBreadcrumb
        items={[
          { href: "/admin/produits", label: "Produits" },
          { label: product.name },
        ]}
      />
      <AdminPageHeader
        eyebrow={`${category.name}${product.isArchived ? " · archivé" : product.isActive ? "" : " · masqué"}`}
        title={product.name}
        description={`/${product.slug} · ${variantRows.length} format(s) · coût matière ${formatFCFA(product.costPrice)} / pièce`}
        actions={
          <>
            <Link
              href={`/menu/${product.slug}`}
              target="_blank"
              className="btn-secondary btn-sm"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Voir la fiche
            </Link>
            <form action={setProductState}>
              <input type="hidden" name="id" value={product.id} />
              <input type="hidden" name="action" value="toggle" />
              <input
                type="hidden"
                name="value"
                value={product.isActive ? "false" : "true"}
              />
              <button className="btn-secondary btn-sm">
                {product.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {product.isActive ? "Masquer" : "Afficher"}
              </button>
            </form>
            <form action={duplicateProduct}>
              <input type="hidden" name="id" value={product.id} />
              <button className="btn-secondary btn-sm">
                <Copy className="h-3.5 w-3.5" />
                Dupliquer
              </button>
            </form>
            <form action={setProductState}>
              <input type="hidden" name="id" value={product.id} />
              <input
                type="hidden"
                name="action"
                value={product.isArchived ? "restore" : "archive"}
              />
              <button className="btn-ghost btn-sm text-red-600">
                {product.isArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                {product.isArchived ? "Restaurer" : "Archiver"}
              </button>
            </form>
          </>
        }
      />

      {notices.ok ? <AdminNotice>{notices.ok}</AdminNotice> : null}
      {notices.error ? <AdminNotice tone="error">{notices.error}</AdminNotice> : null}
      {!variantRows.filter((variant) => variant.isActive).length ? (
        <AdminNotice tone="warning">
          Ce produit n'a aucun format actif : il n'apparaît pas sur le menu public.
        </AdminNotice>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr] xl:items-start">
        <div className="space-y-4">
          <section className="admin-card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-mauve-900">Fiche produit</h2>
              <span className="rounded-full bg-cream px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-brown-light">
                {product.availability === "AVAILABLE" ? "Disponible" : product.availability === "SOLD_OUT" ? "Épuisé" : "Bientôt"}
              </span>
            </div>
            <div className="mt-4">
              <ProductForm action={saveProduct} categories={categoryRows} product={product} />
            </div>
          </section>

          <section className="admin-card overflow-hidden">
            <div className="border-b border-brown/10 px-4 py-3">
              <h2 className="font-display text-xl text-mauve-900">
                Formats & prix
              </h2>
              <p className="mt-0.5 text-[10px] text-brown-light">
                Chaque format a son propre prix, son nombre de pièces et sa composition. Le prix de référence du produit est recalculé sur le format actif le moins cher.
              </p>
            </div>
            <div className="divide-y divide-brown/10">
              {variantRows.map((variant) => (
                <div key={variant.id} className="p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[12px] font-extrabold text-brown">
                        {variant.name}
                        {!variant.isActive ? (
                          <span className="ml-1.5 rounded bg-stone-100 px-1 py-0.5 text-[8px] font-bold uppercase text-stone-500">
                            inactif
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[10px] text-brown-light">
                        {variant.quantity} pièce(s) · {formatFCFA(variant.price)}
                        {variant.stock !== null ? ` · stock ${variant.stock}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <details>
                        <summary className="cursor-pointer list-none rounded-lg px-2 py-1 text-[10px] font-bold text-mauve-700 hover:bg-mauve-100/40 [&::-webkit-details-marker]:hidden">
                          Modifier
                        </summary>
                        <div className="mt-3 rounded-xl bg-cream/50 p-3">
                          <VariantForm productId={product.id} variant={variant} />
                        </div>
                      </details>
                      <form action={deleteVariant}>
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="id" value={variant.id} />
                        <button
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                          title="Supprimer ce format"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <details className="border-t border-brown/10">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-3 text-[11px] font-extrabold text-mauve-700 hover:bg-cream/50 [&::-webkit-details-marker]:hidden">
                <Plus className="h-3.5 w-3.5" />
                Ajouter un format
              </summary>
              <div className="border-t border-brown/10 bg-cream/30 p-4">
                <VariantForm productId={product.id} />
              </div>
            </details>
          </section>

          <section className="admin-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-mauve" />
              <h2 className="font-display text-xl text-mauve-900">Options proposées</h2>
            </div>
            <p className="mt-1 text-[10px] leading-5 text-brown-light">
              Les options cochées seront proposées sur cette fiche. Gérez le catalogue d'options dans l'onglet Options.
            </p>
            <form action={saveProductOptions} className="mt-3">
              <input type="hidden" name="productId" value={product.id} />
              <div className="grid gap-2 sm:grid-cols-2">
                {optionRows.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 rounded-xl border border-brown/10 px-3 py-2 text-[11px] font-bold text-brown-soft"
                  >
                    <input
                      type="checkbox"
                      name="optionIds"
                      value={option.id}
                      defaultChecked={assigned.has(option.id)}
                      className="h-4 w-4 accent-mauve"
                    />
                    <span className="flex-1">
                      {option.name}
                      <span className="ml-1 font-normal text-brown-light">
                        · {option.groupName}
                      </span>
                    </span>
                    <span className="text-mauve-700">
                      {option.price > 0 ? `+${formatFCFA(option.price)}` : "inclus"}
                    </span>
                  </label>
                ))}
              </div>
              {!optionRows.length ? (
                <p className="text-[11px] italic text-brown-light">
                  Aucune option active. Créez-en dans l'onglet Options.
                </p>
              ) : null}
              <button type="submit" className="btn-primary btn-sm mt-3">
                <Check className="h-3.5 w-3.5" />
                Enregistrer les options
              </button>
            </form>
          </section>
        </div>

        <div className="space-y-4 xl:sticky xl:top-20">
          <div className="admin-card overflow-hidden">
            <div className="border-b border-brown/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Images className="h-4 w-4 text-mauve" />
                <h2 className="font-display text-lg text-mauve-900">Aperçu</h2>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl || "/images/spread.jpg"}
              alt={product.name}
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="grid grid-cols-4 gap-1 p-2">
              {gallery.slice(0, 4).map((src) => (
                <span key={src} className="relative aspect-square overflow-hidden rounded-lg bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </span>
              ))}
            </div>
            <div className="border-t border-brown/10 p-3 text-[10px] leading-5 text-brown-light">
              {gallery.length} média(s) déclaré(s). Les images sont servies en
              l'état depuis leurs URL ; utilisez la médiathèque pour téléverser
              des fichiers optimisés.
            </div>
          </div>

          <div className="admin-card p-4">
            <h2 className="font-display text-lg text-mauve-900">Informations</h2>
            <dl className="mt-3 space-y-2 text-[10px]">
              <div className="flex justify-between gap-3">
                <dt className="text-brown-light">Créé le</dt>
                <dd className="font-bold text-brown">
                  {new Intl.DateTimeFormat("fr-FR").format(product.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-brown-light">Modifié le</dt>
                <dd className="font-bold text-brown">
                  {new Intl.DateTimeFormat("fr-FR").format(product.updatedAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-brown-light">Ordre</dt>
                <dd className="font-bold text-brown">{product.sortOrder}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-brown-light">ID</dt>
                <dd className="max-w-[150px] truncate font-mono text-[9px] text-brown-light">
                  {product.id}
                </dd>
              </div>
            </dl>
            <Link href="/admin/produits" className="btn-secondary btn-sm mt-4 w-full">
              <ArrowLeft className="h-3.5 w-3.5" />
              Tous les produits
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
