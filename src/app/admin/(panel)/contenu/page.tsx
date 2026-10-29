import Link from "next/link";
import { ExternalLink, FileText, ImageIcon, PlayCircle } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import {
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { saveContent } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contenu du site" };

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requirePermission("content:write");
  const params = await searchParams;
  const settings = await getSettings();

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Contenu"
        title="Contenu du site"
        description="Textes et médias de la vitrine publique. Les prix, produits et promotions se gèrent dans le catalogue ; ils ne sont jamais modifiés ici."
        actions={
          <Link href="/" target="_blank" className="btn-secondary btn-sm">
            <ExternalLink className="h-3.5 w-3.5" />
            Voir le site
          </Link>
        }
      />
      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}

      <form action={saveContent} className="space-y-4">
        <section className="admin-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-mauve" />
            <h2 className="font-display text-xl text-mauve-900">Marque</h2>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="brandName" className="admin-label">Nom de la marque</label>
              <input id="brandName" name="brandName" defaultValue={settings.brandName} className="admin-input" />
            </div>
            <div>
              <label htmlFor="brandTagline" className="admin-label">Signature</label>
              <input id="brandTagline" name="brandTagline" defaultValue={settings.brandTagline} className="admin-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="announcement" className="admin-label">Bandeau d'annonce</label>
              <input id="announcement" name="announcement" defaultValue={settings.announcement} className="admin-input" />
              <p className="mt-1 text-[9px] text-brown-light">Affiché en haut du site. Laissez vide pour le masquer.</p>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="footerText" className="admin-label">Texte de pied de page</label>
              <textarea id="footerText" name="footerText" rows={2} defaultValue={settings.footerText} className="admin-textarea" />
            </div>
          </div>
        </section>

        <section className="admin-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-mauve" />
            <h2 className="font-display text-xl text-mauve-900">Accueil</h2>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="heroKicker" className="admin-label">Sur-titre</label>
              <input id="heroKicker" name="heroKicker" defaultValue={settings.heroKicker} className="admin-input" />
            </div>
            <div>
              <label htmlFor="heroImage" className="admin-label">Image d'accueil (URL)</label>
              <input id="heroImage" name="heroImage" defaultValue={settings.heroImage} className="admin-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="heroTitle" className="admin-label">Titre principal *</label>
              <input id="heroTitle" name="heroTitle" required defaultValue={settings.heroTitle} className="admin-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="heroText" className="admin-label">Texte d'accueil *</label>
              <textarea id="heroText" name="heroText" required rows={4} defaultValue={settings.heroText} className="admin-textarea" />
            </div>
            <div className="sm:col-span-2">
              <p className="admin-label">Aperçu</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.heroImage || "/images/hero-fataya.jpg"} alt="" className="h-44 w-full rounded-xl object-cover" />
            </div>
          </div>
        </section>

        <section className="admin-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-mauve" />
            <h2 className="font-display text-xl text-mauve-900">Vidéo & à propos</h2>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="videoTitle" className="admin-label">Titre de la vidéo</label>
              <input id="videoTitle" name="videoTitle" defaultValue={settings.videoTitle} className="admin-input" />
            </div>
            <div>
              <label htmlFor="videoUrl" className="admin-label">Vidéo (URL/MP4)</label>
              <input id="videoUrl" name="videoUrl" defaultValue={settings.videoUrl} className="admin-input" />
            </div>
            <div>
              <label htmlFor="videoPoster" className="admin-label">Image de couverture vidéo</label>
              <input id="videoPoster" name="videoPoster" defaultValue={settings.videoPoster} className="admin-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="videoText" className="admin-label">Texte de la vidéo</label>
              <textarea id="videoText" name="videoText" rows={2} defaultValue={settings.videoText} className="admin-textarea" />
            </div>
            <div>
              <label htmlFor="aboutTitle" className="admin-label">Titre « À propos »</label>
              <input id="aboutTitle" name="aboutTitle" defaultValue={settings.aboutTitle} className="admin-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="aboutText" className="admin-label">Texte « À propos »</label>
              <textarea id="aboutText" name="aboutText" rows={5} defaultValue={settings.aboutText} className="admin-textarea" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="eventIntro" className="admin-label">Introduction événements</label>
              <textarea id="eventIntro" name="eventIntro" rows={3} defaultValue={settings.eventIntro} className="admin-textarea" />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="btn-primary btn-sm">Enregistrer le contenu</button>
          <p className="text-[9px] text-brown-light">
            Les URLs d'images doivent pointer vers un fichier accessible sur le site ou la médiathèque.
          </p>
        </div>
      </form>
    </div>
  );
}
