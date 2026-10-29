import { desc } from "drizzle-orm";
import { Film, ImageIcon, Trash2, UploadCloud } from "lucide-react";
import { getDb } from "@/db";
import { mediaAssets } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { CopyButton } from "@/components/admin/copy-button";
import {
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { addMediaUrl, deleteMedia } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Médiathèque" };

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requirePermission("media:write");
  const params = await searchParams;
  const rows = await getDb()
    .select()
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(200);
  const images = rows.filter((row) => row.type === "IMAGE");
  const videos = rows.filter((row) => row.type === "VIDEO");

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Contenu"
        title="Médiathèque"
        description="Images optimisées en WebP (max 1600 px, 8 Mo) et vidéos par URL. Copiez l'URL d'un média pour l'utiliser dans une fiche produit, une bannière ou le contenu du site."
      />
      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr] xl:items-start">
        <section className="admin-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-mauve" />
            <h2 className="font-display text-xl text-mauve-900">Téléverser une image</h2>
          </div>
          <p className="mt-1 text-[10px] leading-5 text-brown-light">
            JPEG, PNG, WebP ou AVIF. Le fichier est converti en WebP sur le serveur
            et renommé pour éviter les collisions. Le stockage local doit être
            sauvegardé au déploiement.
          </p>
          <form
            action="/admin/medias/upload"
            method="post"
            encType="multipart/form-data"
            className="mt-3 space-y-3"
          >
            <div>
              <label htmlFor="file" className="admin-label">Fichier image *</label>
              <input
                id="file"
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                required
                className="admin-input py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-mauve file:px-3 file:py-1.5 file:text-[10px] file:font-bold file:text-white"
              />
            </div>
            <div>
              <label htmlFor="alt" className="admin-label">Texte alternatif (accessibilité)</label>
              <input id="alt" name="alt" className="admin-input" placeholder="Fataya dorés dans une boîte kraft" />
            </div>
            <button type="submit" className="btn-primary btn-sm">
              <UploadCloud className="h-3.5 w-3.5" />
              Téléverser et optimiser
            </button>
          </form>
        </section>

        <section className="admin-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-mauve" />
            <h2 className="font-display text-xl text-mauve-900">Ajouter une vidéo ou une URL</h2>
          </div>
          <p className="mt-1 text-[10px] leading-5 text-brown-light">
            Pour les vidéos, indiquez une URL MP4/WebM ou un lien hébergé. Les vidéos
            ne sont pas converties sur ce serveur.
          </p>
          <form action={addMediaUrl} className="mt-3 grid gap-2.5">
            <div>
              <label htmlFor="name" className="admin-label">Nom *</label>
              <input id="name" name="name" required className="admin-input" placeholder="Coulisses — préparation des fataya" />
            </div>
            <div>
              <label htmlFor="url" className="admin-label">URL *</label>
              <input id="url" name="url" required className="admin-input" placeholder="/videos/maison-gourmande.mp4" />
            </div>
            <div>
              <label htmlFor="alt-media" className="admin-label">Description</label>
              <input id="alt-media" name="alt" className="admin-input" />
            </div>
            <button className="btn-primary btn-sm">Ajouter à la médiathèque</button>
          </form>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-mauve-900">Images ({images.length})</h2>
        {images.length ? (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {images.map((asset) => (
              <div key={asset.id} className="admin-card overflow-hidden">
                <div className="relative aspect-[4/3] bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.url} alt={asset.alt || asset.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-2.5">
                  <p className="truncate text-[10px] font-bold text-brown">{asset.name}</p>
                  <p className="truncate font-mono text-[8px] text-brown-light">{asset.url}</p>
                  <p className="mt-0.5 text-[8px] text-brown-light">{formatDate(asset.createdAt)}</p>
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <CopyButton value={asset.url} />
                    <form action={deleteMedia}>
                      <input type="hidden" name="id" value={asset.id} />
                      <button className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" title="Retirer de la bibliothèque">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmpty
            title="Aucune image dans la médiathèque"
            description="Téléversez votre premier visuel optimisé."
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-mauve-900">Vidéos & liens ({videos.length})</h2>
        {videos.length ? (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((asset) => (
              <div key={asset.id} className="admin-card flex items-start gap-2.5 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mauve-100 text-mauve-700">
                  <Film className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-bold text-brown">{asset.name}</p>
                  <p className="truncate font-mono text-[8px] text-brown-light">{asset.url}</p>
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <CopyButton value={asset.url} />
                    <form action={deleteMedia}>
                      <input type="hidden" name="id" value={asset.id} />
                      <button className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" title="Retirer">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </form>
                  </div>
                </div>
                <ImageIcon className="hidden h-3 w-3 text-mauve" />
              </div>
            ))}
          </div>
        ) : (
          <AdminEmpty title="Aucune vidéo" description="Ajoutez une URL de vidéo si vous en avez une." />
        )}
      </section>
    </div>
  );
}
