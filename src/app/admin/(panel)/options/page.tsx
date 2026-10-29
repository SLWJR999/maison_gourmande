import { asc, count, eq } from "drizzle-orm";
import { ListChecks, Plus, Trash2 } from "lucide-react";
import { getDb } from "@/db";
import { options, productOptions } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { formatFCFA } from "@/lib/utils";
import {
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { deleteOption, saveOption } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Options" };

export default async function AdminOptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requirePermission("products:read");
  const params = await searchParams;
  const rows = await getDb()
    .select({
      option: options,
      usage: count(productOptions.productId),
    })
    .from(options)
    .leftJoin(productOptions, eq(productOptions.optionId, options.id))
    .groupBy(options.id)
    .orderBy(asc(options.groupName), asc(options.sortOrder), asc(options.name));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Options & suppléments"
        description="Sauces, fromage, boisson… Les options sont proposées uniquement sur les produits auxquels elles sont associées."
        actions={
          <a href="#nouvelle-option" className="btn-primary btn-sm">
            <Plus className="h-3.5 w-3.5" />
            Nouvelle option
          </a>
        }
      />
      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-2.5">
          {rows.length ? (
            rows.map(({ option, usage }) => (
              <div key={option.id} className="admin-card p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-mauve-100 text-mauve-700">
                      <ListChecks className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[12px] font-extrabold text-brown">
                        {option.name}
                        {!option.isActive ? (
                          <span className="ml-1.5 rounded bg-stone-100 px-1 py-0.5 text-[8px] font-bold uppercase text-stone-500">
                            inactive
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[10px] text-brown-light">
                        {option.groupName} · {option.price > 0 ? `+${formatFCFA(option.price)}` : "sans supplément"} · {Number(usage)} produit(s)
                      </p>
                    </div>
                  </div>
                  <form action={deleteOption}>
                    <input type="hidden" name="id" value={option.id} />
                    <button
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
                <details className="mt-2 border-t border-brown/10 pt-2">
                  <summary className="cursor-pointer list-none text-[10px] font-bold text-mauve-700 [&::-webkit-details-marker]:hidden">
                    Modifier cette option
                  </summary>
                  <div className="mt-3 rounded-xl bg-cream/50 p-3">
                    <OptionForm option={option} />
                  </div>
                </details>
              </div>
            ))
          ) : (
            <AdminEmpty title="Aucune option" description="Créez vos premiers suppléments." />
          )}
        </div>

        <div id="nouvelle-option" className="admin-card h-fit scroll-mt-24 p-4 xl:sticky xl:top-20">
          <h2 className="font-display text-xl text-mauve-900">Ajouter une option</h2>
          <p className="mb-4 mt-1 text-[10px] leading-5 text-brown-light">
            L'option devient disponible sur les fiches produit où elle est cochée.
          </p>
          <OptionForm />
        </div>
      </div>
    </div>
  );
}

function OptionForm({
  option,
}: {
  option?: {
    id: string;
    name: string;
    groupName: string;
    price: number;
    isActive: boolean;
    sortOrder: number;
  };
}) {
  const key = option?.id ?? "new";
  return (
    <form action={saveOption} className="grid gap-2.5 sm:grid-cols-2">
      {option ? <input type="hidden" name="id" value={option.id} /> : null}
      <div>
        <label className="admin-label" htmlFor={`oname-${key}`}>
          Nom *
        </label>
        <input
          id={`oname-${key}`}
          name="name"
          required
          defaultValue={option?.name ?? ""}
          className="admin-input"
          placeholder="Fromage supplémentaire"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`ogroup-${key}`}>
          Groupe
        </label>
        <input
          id={`ogroup-${key}`}
          name="groupName"
          defaultValue={option?.groupName ?? "Suppléments"}
          className="admin-input"
          placeholder="Suppléments"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`oprice-${key}`}>
          Supplément (FCFA)
        </label>
        <input
          id={`oprice-${key}`}
          name="price"
          type="number"
          min={0}
          defaultValue={option?.price ?? 0}
          className="admin-input"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`osort-${key}`}>
          Ordre
        </label>
        <input
          id={`osort-${key}`}
          name="sortOrder"
          type="number"
          defaultValue={option?.sortOrder ?? 0}
          className="admin-input"
        />
      </div>
      <label className="flex items-center gap-2 rounded-xl border border-brown/10 px-3 py-2.5 text-[11px] font-bold text-brown-soft">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={option?.isActive ?? true}
          className="h-4 w-4 accent-mauve"
        />
        Option active
      </label>
      <button type="submit" className="btn-primary btn-sm">
        {option ? "Enregistrer" : "Créer l'option"}
      </button>
    </form>
  );
}
