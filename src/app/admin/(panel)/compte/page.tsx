import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { changeOwnPassword, updateOwnProfile } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon compte" };

export default async function AdminAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Sécurité"
        title="Mon compte"
        description="Vos informations personnelles et votre mot de passe. Utilisez un mot de passe unique et suffisamment long."
        actions={
          <Link href="/admin/parametres" className="btn-secondary btn-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Paramètres
          </Link>
        }
      />
      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}

      <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
        <section className="admin-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-mauve" />
            <h2 className="font-display text-xl text-mauve-900">Profil</h2>
          </div>
          <form action={updateOwnProfile} className="mt-3 space-y-3">
            <div>
              <label htmlFor="name" className="admin-label">Nom complet</label>
              <input id="name" name="name" defaultValue={user.name} required className="admin-input" />
            </div>
            <div>
              <label htmlFor="email" className="admin-label">E-mail</label>
              <input id="email" name="email" type="email" defaultValue={user.email} required className="admin-input" />
            </div>
            <div className="rounded-xl bg-cream/60 px-3 py-2 text-[10px] text-brown-light">
              Rôle actuel : <strong className="text-brown">{user.role.replace("_", " ")}</strong>. Un changement de rôle est effectué par un super administrateur depuis l'onglet Équipe.
            </div>
            <button className="btn-primary btn-sm">Enregistrer le profil</button>
          </form>
        </section>

        <section className="admin-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-mauve" />
            <h2 className="font-display text-xl text-mauve-900">Mot de passe</h2>
          </div>
          <form action={changeOwnPassword} className="mt-3 space-y-3">
            <div>
              <label htmlFor="currentPassword" className="admin-label">Mot de passe actuel</label>
              <input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" className="admin-input" />
            </div>
            <div>
              <label htmlFor="newPassword" className="admin-label">Nouveau mot de passe (12+ caractères)</label>
              <input id="newPassword" name="newPassword" type="password" minLength={12} required autoComplete="new-password" className="admin-input" />
            </div>
            <div>
              <label htmlFor="confirmation" className="admin-label">Confirmer le nouveau mot de passe</label>
              <input id="confirmation" name="confirmation" type="password" minLength={12} required autoComplete="new-password" className="admin-input" />
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-mauve-200 bg-mauve-100/40 p-2.5 text-[9px] leading-4 text-mauve-800">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Les autres sessions déjà ouvertes ne sont pas révoquées automatiquement.
              En cas de doute, déconnectez-vous sur les appareils concernés.
            </div>
            <button className="btn-primary btn-sm">Changer le mot de passe</button>
          </form>
        </section>
      </div>
    </div>
  );
}
