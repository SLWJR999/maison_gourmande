import { asc } from "drizzle-orm";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
import { getDb } from "@/db";
import { banners, type Banner } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import {
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { deleteBanner, saveBanner } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bannières" };

const PLACEMENTS = {
  HOME_STRIP: "Bandeau d'accueil",
  MENU: "Menu",
  EVENTS: "Événements",
};

function toLocal(date: Date | null): string {
  if (!date) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function BannerForm({ banner }: { banner?: Banner }) {
  const key = banner?.id ?? "new";
  return (
    <form action={saveBanner} className="grid gap-2.5 sm:grid-cols-2">
      {banner ? <input type="hidden" name="id" value={banner.id} /> : null}
      <div className="sm:col-span-2">
        <label className="admin-label" htmlFor={`btitle-${key}`}>
          Titre *
        </label>
        <input
          id={`btitle-${key}`}
          name="title"
          required
          defaultValue={banner?.title ?? ""}
          className="admin-input"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="admin-label" htmlFor={`bsub-${key}`}>
          Sous-titre
        </label>
        <textarea
          id={`bsub-${key}`}
          name="subtitle"
          rows={2}
          defaultValue={banner?.subtitle ?? ""}
          className="admin-textarea"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="admin-label" htmlFor={`bimage-${key}`}>
          Image (URL)
        </label>
        <input
          id={`bimage-${key}`}
          name="imageUrl"
          defaultValue={banner?.imageUrl ?? ""}
          className="admin-input"
          placeholder="/images/event.jpg"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`bcta-${key}`}>
          Texte du bouton
        </label>
        <input
          id={`bcta-${key}`}
          name="ctaLabel"
          defaultValue={banner?.ctaLabel ?? "Voir le menu"}
          className="admin-input"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`bhref-${key}`}>
          Lien du bouton
        </label>
        <input
          id={`bhref-${key}`}
          name="ctaHref"
          defaultValue={banner?.ctaHref ?? "/menu"}
          className="admin-input"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`bplace-${key}`}>
          Emplacement
        </label>
        <select
          id={`bplace-${key}`}
          name="placement"
          defaultValue={banner?.placement ?? "HOME_STRIP"}
          className="admin-select"
        >
          {Object.entries(PLACEMENTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="admin-label" htmlFor={`bsort-${key}`}>
          Ordre
        </label>
        <input
          id={`bsort-${key}`}
          name="sortOrder"
          type="number"
          defaultValue={banner?.sortOrder ?? 0}
          className="admin-input"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`bstart-${key}`}>
          Début
        </label>
        <input
          id={`bstart-${key}`}
          name="startsAt"
          type="datetime-local"
          defaultValue={toLocal(banner?.startsAt ?? null)}
          className="admin-input"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`bend-${key}`}>
          Fin
        </label>
        <input
          id={`bend-${key}`}
          name="endsAt"
          type="datetime-local"
          defaultValue={toLocal(banner?.endsAt ?? null)}
          className="admin-input"
        />
      </div>
      <label className="flex items-center gap-2 rounded-xl border border-brown/10 px-3 py-2.5 text-[11px] font-bold text-brown-soft">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={banner?.isActive ?? true}
          className="h-4 w-4 accent-mauve"
        />
        Bannière active
      </label>
      <button type="submit" className="btn-primary btn-sm">
        {banner ? "Enregistrer" : "Créer la bannière"}
      </button>
    </form>
  );
}

export default async function AdminBannersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requirePermission("content:write");
  const params = await searchParams;
  const rows = await getDb()
    .select()
    .from(banners)
    .orderBy(asc(banners.placement), asc(banners.sortOrder));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Contenu"
        title="Bannières"
        description="Visuels promotionnels affichés sur l'accueil, le menu ou les événements. Les dates et l'activation sont contrôlées côté serveur."
        actions={
          <a href="#nouvelle-banniere" className="btn-primary btn-sm">
            <Plus className="h-3.5 w-3.5" />
            Nouvelle bannière
          </a>
        }
      />
      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-2.5">
          {rows.length ? (
            rows.map((banner) => (
              <div key={banner.id} className="admin-card overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <span className="relative h-28 w-full shrink-0 bg-cream sm:h-auto sm:w-32">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.imageUrl || "/images/spread.jpg"}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <div className="flex-1 p-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-display text-[19px] text-mauve-900">{banner.title}</p>
                      <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${banner.isActive ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                        {banner.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="rounded bg-mauve-100 px-1.5 py-0.5 text-[8px] font-bold text-mauve-800">
                        {PLACEMENTS[banner.placement]}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-brown-light">
                      {banner.subtitle || "Pas de sous-titre"} · {banner.ctaLabel} → {banner.ctaHref}
                    </p>
                    <p className="mt-1 text-[9px] text-brown-light">
                      {banner.startsAt ? `Du ${banner.startsAt.toLocaleDateString("fr-FR")}` : "Sans date de début"} ·{" "}
                      {banner.endsAt ? `au ${banner.endsAt.toLocaleDateString("fr-FR")}` : "sans date de fin"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <details className="flex-1">
                        <summary className="cursor-pointer list-none text-[10px] font-bold text-mauve-700 [&::-webkit-details-marker]:hidden">
                          Modifier
                        </summary>
                        <div className="mt-3 rounded-xl bg-cream/50 p-3">
                          <BannerForm banner={banner} />
                        </div>
                      </details>
                      <form action={deleteBanner}>
                        <input type="hidden" name="id" value={banner.id} />
                        <button className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" title="Supprimer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <AdminEmpty title="Aucune bannière" description="Créez un visuel pour l'accueil ou les événements." />
          )}
        </div>

        <div id="nouvelle-banniere" className="admin-card h-fit scroll-mt-24 p-4 xl:sticky xl:top-20">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-mauve" />
            <h2 className="font-display text-xl text-mauve-900">Nouvelle bannière</h2>
          </div>
          <div className="mt-4">
            <BannerForm />
          </div>
        </div>
      </div>
    </div>
  );
}
