import { asc, count, eq } from "drizzle-orm";
import {
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Tags,
} from "lucide-react";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { formatNumber } from "@/lib/utils";
import {
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { saveCategory, setCategoryState } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Catégories" };

function CategoryForm({
  category,
}: {
  category?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    imageUrl: string;
    icon: string;
    sortOrder: number;
    isActive: boolean;
  };
}) {
  return (
    <form action={saveCategory} className="grid gap-3 sm:grid-cols-2">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <div>
        <label className="admin-label" htmlFor={`name-${category?.id ?? "new"}`}>
          Nom *
        </label>
        <input
          id={`name-${category?.id ?? "new"}`}
          name="name"
          required
          defaultValue={category?.name ?? ""}
          className="admin-input"
          placeholder="Fataya & nems"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`slug-${category?.id ?? "new"}`}>
          Slug (URL)
        </label>
        <input
          id={`slug-${category?.id ?? "new"}`}
          name="slug"
          defaultValue={category?.slug ?? ""}
          className="admin-input"
          placeholder="fataya-nems"
        />
        <p className="mt-1 text-[9px] text-brown-light">
          Laissez vide pour générer automatiquement.
        </p>
      </div>
      <div className="sm:col-span-2">
        <label className="admin-label" htmlFor={`description-${category?.id ?? "new"}`}>
          Description courte
        </label>
        <textarea
          id={`description-${category?.id ?? "new"}`}
          name="description"
          rows={2}
          defaultValue={category?.description ?? ""}
          className="admin-textarea"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`image-${category?.id ?? "new"}`}>
          Image (URL)
        </label>
        <input
          id={`image-${category?.id ?? "new"}`}
          name="imageUrl"
          defaultValue={category?.imageUrl ?? ""}
          className="admin-input"
          placeholder="/images/fataya.jpg"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`icon-${category?.id ?? "new"}`}>
          Icône
        </label>
        <input
          id={`icon-${category?.id ?? "new"}`}
          name="icon"
          defaultValue={category?.icon ?? "Sparkles"}
          className="admin-input"
          placeholder="Sparkles, Pizza, CupSoda…"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`sort-${category?.id ?? "new"}`}>
          Ordre d'affichage
        </label>
        <input
          id={`sort-${category?.id ?? "new"}`}
          name="sortOrder"
          type="number"
          defaultValue={category?.sortOrder ?? 0}
          className="admin-input"
        />
      </div>
      <label className="flex items-center gap-2 self-end rounded-xl border border-brown/10 px-3 py-2.5 text-[12px] font-bold text-brown-soft">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={category?.isActive ?? true}
          className="h-4 w-4 accent-mauve"
        />
        Visible sur le site
      </label>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary btn-sm">
          {category ? "Enregistrer les modifications" : "Créer la catégorie"}
        </button>
      </div>
    </form>
  );
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; edit?: string }>;
}) {
  await requirePermission("products:read");
  const params = await searchParams;
  const rows = await getDb()
    .select({
      category: categories,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Catégories"
        description="Organisez la vitrine du menu. Une catégorie masquée ou archivée disparaît du site public sans perdre son historique."
        actions={
          <a href="#nouvelle-categorie" className="btn-primary btn-sm">
            <Plus className="h-3.5 w-3.5" />
            Nouvelle catégorie
          </a>
        }
      />

      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-2.5">
          {rows.length ? (
            rows.map(({ category, productCount }) => (
              <div key={category.id} className="admin-card p-3.5">
                <div className="flex items-start gap-3">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={category.imageUrl || "/images/spread.jpg"}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-display text-[19px] leading-tight text-mauve-900">
                        {category.name}
                      </p>
                      {category.isArchived ? (
                        <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[8px] font-bold uppercase text-stone-500">
                          Archivée
                        </span>
                      ) : category.isActive ? (
                        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold uppercase text-emerald-700">
                          Visible
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-700">
                          Masquée
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[10px] text-brown-light">
                      /{category.slug} · {formatNumber(Number(productCount))} produit(s) · ordre {category.sortOrder}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-brown-soft">
                      {category.description || "Pas de description."}
                    </p>
                  </div>
                  <Tags className="hidden h-4 w-4 text-mauve sm:block" />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-brown/10 pt-2.5">
                  <details className="group">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-mauve-700 hover:bg-mauve-100/50 [&::-webkit-details-marker]:hidden">
                      <Pencil className="h-3 w-3" />
                      Modifier
                    </summary>
                    <div className="mt-3 rounded-xl bg-cream/50 p-3">
                      <CategoryForm category={category} />
                    </div>
                  </details>
                  {!category.isArchived ? (
                    <>
                      <form action={setCategoryState}>
                        <input type="hidden" name="id" value={category.id} />
                        <input type="hidden" name="action" value="active" />
                        <input
                          type="hidden"
                          name="value"
                          value={category.isActive ? "false" : "true"}
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-brown-soft hover:bg-white"
                        >
                          {category.isActive ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                          {category.isActive ? "Masquer" : "Afficher"}
                        </button>
                      </form>
                      <form action={setCategoryState}>
                        <input type="hidden" name="id" value={category.id} />
                        <input type="hidden" name="action" value="archive" />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50"
                        >
                          <Archive className="h-3 w-3" />
                          Archiver
                        </button>
                      </form>
                    </>
                  ) : (
                    <form action={setCategoryState}>
                      <input type="hidden" name="id" value={category.id} />
                      <input type="hidden" name="action" value="restore" />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50"
                      >
                        <ArchiveRestore className="h-3 w-3" />
                        Restaurer
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))
          ) : (
            <AdminEmpty title="Aucune catégorie" description="Commencez par créer la première catégorie du menu." />
          )}
        </div>

        <div id="nouvelle-categorie" className="admin-card h-fit scroll-mt-24 p-4 xl:sticky xl:top-20">
          <h2 className="font-display text-xl text-mauve-900">Ajouter une catégorie</h2>
          <p className="mb-4 mt-1 text-[10px] leading-5 text-brown-light">
            La catégorie Pâtisserie peut rester masquée tant que l'offre n'est pas
            prête. Vous pourrez l'activer à tout moment.
          </p>
          <CategoryForm />
        </div>
      </div>
    </div>
  );
}
