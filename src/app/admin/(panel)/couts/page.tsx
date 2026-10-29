import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowUpRight,
  Calculator,
  Coins,
  Edit3,
  Percent,
} from "lucide-react";
import { getDb } from "@/db";
import { categories, productVariants, products } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { formatFCFA, formatNumber } from "@/lib/utils";
import {
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
  AdminStat,
} from "@/components/admin/admin-ui";
import { updateProductCost } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Coûts & marges" };

export default async function AdminCostsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; manque?: string }>;
}) {
  await requirePermission("products:read");
  const params = await searchParams;
  const onlyMissing = params.manque === "1";
  const db = getDb();
  const [productRows, variantRows] = await Promise.all([
    db
      .select({ product: products, category: categories })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.isArchived, false))
      .orderBy(asc(products.name)),
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.isActive, true))
      .orderBy(asc(productVariants.sortOrder), asc(productVariants.price)),
  ]);
  const variantsByProduct = new Map<string, typeof variantRows>();
  for (const variant of variantRows) {
    const list = variantsByProduct.get(variant.productId) ?? [];
    list.push(variant);
    variantsByProduct.set(variant.productId, list);
  }
  const rows = productRows
    .map((row) => ({
      ...row,
      variants: variantsByProduct.get(row.product.id) ?? [],
    }))
    .filter((row) => (onlyMissing ? row.product.costPrice === 0 : true));
  const missing = productRows.filter((row) => row.product.costPrice === 0).length;
  const covered = productRows.length - missing;
  const withMargin = productRows
    .filter((row) => row.product.costPrice > 0)
    .map((row) => {
      const variants = variantsByProduct.get(row.product.id) ?? [];
      if (!variants.length) return null;
      const cheapest = variants[0];
      const pieces = Math.max(1, cheapest.quantity);
      const unitCost = row.product.costPrice * pieces;
      if (cheapest.price <= 0) return null;
      return ((cheapest.price - unitCost) / cheapest.price) * 100;
    })
    .filter((value): value is number => value !== null);
  const averageMargin = withMargin.length
    ? withMargin.reduce((sum, value) => sum + value, 0) / withMargin.length
    : null;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Gestion"
        title="Coûts & marges"
        description="Le coût matière est saisi par pièce. La marge affichée est indicative : elle ne déduit ni les charges fixes, ni les remises globales, ni les dépenses."
        actions={
          <Link href="/admin/couts?manque=1" className="btn-secondary btn-sm">
            <AlertTriangle className="h-3.5 w-3.5" />
            Coûts manquants ({missing})
          </Link>
        }
      />
      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStat
          label="Produits actifs"
          value={formatNumber(productRows.length)}
          hint="Hors archives, toutes visibilités confondues."
          icon={<Coins className="h-4 w-4" />}
        />
        <AdminStat
          label="Coûts renseignés"
          value={`${covered} / ${productRows.length}`}
          hint={missing ? `${missing} produit(s) sans coût matière.` : "Tous les produits ont un coût."}
          icon={<Calculator className="h-4 w-4" />}
          tone={missing ? "amber" : "default"}
        />
        <AdminStat
          label="Marge indicative moyenne"
          value={averageMargin === null ? "—" : `${averageMargin.toFixed(1)} %`}
          hint="Calculée sur le premier format actif de chaque produit. Ne remplace pas un compte d'exploitation."
          icon={<Percent className="h-4 w-4" />}
        />
      </div>

      {missing ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Les produits sans coût faussent les rapports de marge. Renseignez un coût
          matière par pièce, même estimé, et identifiez les données manquantes dans
          vos rapports.
        </div>
      ) : null}

      {rows.length ? (
        <div className="space-y-2.5">
          {rows.map(({ product, category, variants }) => (
            <div key={product.id} className="admin-card p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.imageUrl || "/images/spread.jpg"} alt="" className="h-full w-full object-cover" />
                  </span>
                  <div>
                    <p className="text-[12px] font-extrabold text-brown">
                      {product.name}
                      {product.costPrice === 0 ? (
                        <span className="ml-1.5 rounded bg-amber-50 px-1 py-0.5 text-[8px] font-bold uppercase text-amber-700">
                          Coût manquant
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[10px] text-brown-light">
                      {category.name} · {variants.length} format(s) actif(s)
                    </p>
                  </div>
                </div>
                <form action={updateProductCost} className="flex items-end gap-1.5">
                  <input type="hidden" name="id" value={product.id} />
                  <div>
                    <label className="admin-label" htmlFor={`cost-${product.id}`}>
                      Coût / pièce
                    </label>
                    <input
                      id={`cost-${product.id}`}
                      name="costPrice"
                      type="number"
                      min={0}
                      defaultValue={product.costPrice}
                      className="admin-input w-28"
                    />
                  </div>
                  <button className="btn-primary btn-sm">
                    <Edit3 className="h-3.5 w-3.5" />
                    Mettre à jour
                  </button>
                </form>
              </div>

              {variants.length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="admin-table min-w-[560px]">
                    <thead>
                      <tr>
                        <th>Format</th>
                        <th>Pièces</th>
                        <th>Prix de vente</th>
                        <th>Prix / pièce</th>
                        <th>Coût du format</th>
                        <th>Marge / format</th>
                        <th>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((variant) => {
                        const pieces = Math.max(1, variant.quantity);
                        const formatCost = product.costPrice * pieces;
                        const margin = variant.price - formatCost;
                        const percent = variant.price > 0 ? (margin / variant.price) * 100 : null;
                        return (
                          <tr key={variant.id}>
                            <td className="font-bold text-brown">{variant.name}</td>
                            <td>{pieces}</td>
                            <td>{formatFCFA(variant.price)}</td>
                            <td>{formatFCFA(Math.round(variant.price / pieces))}</td>
                            <td>{formatFCFA(formatCost)}</td>
                            <td className={margin < 0 ? "font-bold text-red-600" : "font-bold text-emerald-700"}>
                              {formatFCFA(margin)}
                            </td>
                            <td>
                              {percent === null ? "—" : `${percent.toFixed(1)} %`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-2 text-[10px] text-brown-light">
                  Aucun format actif : la marge ne peut pas être calculée.
                </p>
              )}
              <Link href={`/admin/produits/${product.id}`} className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-mauve-700 hover:underline">
                Modifier la fiche et les prix
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <AdminEmpty title="Aucun produit à afficher" description="Tous les produits sont couverts ou aucun produit n'existe." />
      )}
    </div>
  );
}
