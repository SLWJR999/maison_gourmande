import { asc } from "drizzle-orm";
import {
  KeyRound,
  Plus,
  ShieldCheck,
  UserCog,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import { getDb } from "@/db";
import { users, type UserRole } from "@/db/schema";
import { getCurrentUser, requirePermission } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import {
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { createTeamMember, updateTeamMember } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Équipe" };

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super administrateur",
  MANAGER: "Gérant",
  STAFF: "Équipe",
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  SUPER_ADMIN:
    "Accès complet : équipe, paramètres, journal d'audit, finances et catalogue.",
  MANAGER:
    "Commandes, catalogue, promotions, clients, événements et finances. Pas de gestion des comptes.",
  STAFF:
    "Commandes, lecture catalogue et suivi des événements/avis selon les permissions attribuées.",
};

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const actor = await requirePermission("team:manage");
  const params = await searchParams;
  const rows = await getDb().select().from(users).orderBy(asc(users.name));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Sécurité"
        title="Équipe & accès"
        description="Chaque personne doit avoir son propre compte. Les permissions sont contrôlées côté serveur à chaque action ; ne partagez jamais un mot de passe."
      />
      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr] xl:items-start">
        <div className="space-y-2.5">
          {rows.map((member) => (
            <div key={member.id} className="admin-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${member.isActive ? "bg-mauve-100 text-mauve-700" : "bg-stone-100 text-stone-500"}`}>
                    {member.isActive ? <UserRoundCheck className="h-4 w-4" /> : <UserRoundX className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-[12px] font-extrabold text-brown">
                      {member.name}
                      {member.id === actor.id ? (
                        <span className="ml-1.5 rounded bg-sky-50 px-1 py-0.5 text-[8px] font-bold uppercase text-sky-700">Vous</span>
                      ) : null}
                      {!member.isActive ? (
                        <span className="ml-1.5 rounded bg-stone-100 px-1 py-0.5 text-[8px] font-bold uppercase text-stone-500">Inactif</span>
                      ) : null}
                    </p>
                    <p className="text-[10px] text-brown-light">{member.email}</p>
                    <p className="mt-0.5 text-[9px] text-brown-light">
                      {ROLE_LABELS[member.role]} · Dernière connexion : {member.lastLoginAt ? formatDateTime(member.lastLoginAt) : "jamais"}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase ${member.role === "SUPER_ADMIN" ? "bg-mauve text-white" : member.role === "MANAGER" ? "bg-ochre/20 text-amber-800" : "bg-cream text-brown-soft"}`}>
                  {ROLE_LABELS[member.role]}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-brown/10 pt-2">
                <details className="flex-1">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-mauve-700 hover:bg-mauve-100/40 [&::-webkit-details-marker]:hidden">
                    <UserCog className="h-3 w-3" />
                    Gérer le rôle
                  </summary>
                  <form action={updateTeamMember} className="mt-2 flex flex-wrap items-end gap-1.5">
                    <input type="hidden" name="id" value={member.id} />
                    <input type="hidden" name="action" value="role" />
                    <div>
                      <label className="admin-label" htmlFor={`role-${member.id}`}>Rôle</label>
                      <select id={`role-${member.id}`} name="role" defaultValue={member.role} className="admin-select min-w-[180px]">
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <button className="btn-primary btn-sm">Mettre à jour</button>
                  </form>
                </details>
                <details>
                  <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-brown-soft hover:bg-cream [&::-webkit-details-marker]:hidden">
                    <KeyRound className="h-3 w-3" />
                    Réinitialiser le mot de passe
                  </summary>
                  <form action={updateTeamMember} className="mt-2 flex flex-wrap items-end gap-1.5">
                    <input type="hidden" name="id" value={member.id} />
                    <input type="hidden" name="action" value="password" />
                    <div>
                      <label className="admin-label" htmlFor={`password-${member.id}`}>Nouveau mot de passe (12+ caractères)</label>
                      <input id={`password-${member.id}`} name="password" type="password" minLength={12} required autoComplete="new-password" className="admin-input" />
                    </div>
                    <button className="btn-primary btn-sm">Réinitialiser</button>
                  </form>
                </details>
                <form action={updateTeamMember}>
                  <input type="hidden" name="id" value={member.id} />
                  <input type="hidden" name="action" value="toggle" />
                  <input type="hidden" name="value" value={member.isActive ? "false" : "true"} />
                  <button className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold ${member.isActive ? "text-red-600 hover:bg-red-50" : "text-emerald-700 hover:bg-emerald-50"}`}>
                    {member.isActive ? <UserRoundX className="h-3 w-3" /> : <UserRoundCheck className="h-3 w-3" />}
                    {member.isActive ? "Désactiver" : "Réactiver"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 xl:sticky xl:top-20">
          <div className="admin-card p-4">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-mauve" />
              <h2 className="font-display text-xl text-mauve-900">Ajouter un membre</h2>
            </div>
            <form action={createTeamMember} className="mt-3 grid gap-2.5">
              <div>
                <label htmlFor="name" className="admin-label">Nom complet *</label>
                <input id="name" name="name" required className="admin-input" />
              </div>
              <div>
                <label htmlFor="email" className="admin-label">E-mail *</label>
                <input id="email" name="email" type="email" required className="admin-input" />
              </div>
              <div>
                <label htmlFor="password" className="admin-label">Mot de passe temporaire (12+ caractères) *</label>
                <input id="password" name="password" type="password" minLength={12} required autoComplete="new-password" className="admin-input" />
              </div>
              <div>
                <label htmlFor="role" className="admin-label">Rôle</label>
                <select id="role" name="role" defaultValue="STAFF" className="admin-select">
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <button className="btn-primary btn-sm">Créer le compte</button>
            </form>
            <p className="mt-2 text-[9px] leading-4 text-brown-light">
              Le mot de passe doit être communiqué de façon sécurisée et changé
              par la personne dès sa première connexion.
            </p>
          </div>

          <div className="admin-card p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-mauve" />
              <h2 className="font-display text-lg text-mauve-900">Rôles</h2>
            </div>
            <div className="mt-2 space-y-2">
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                <div key={role} className="rounded-xl bg-cream/60 p-2.5">
                  <p className="text-[10px] font-extrabold text-brown">{ROLE_LABELS[role]}</p>
                  <p className="mt-0.5 text-[9px] leading-4 text-brown-light">{ROLE_DESCRIPTIONS[role]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
