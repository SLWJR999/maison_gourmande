import Link from "next/link";
import { and, desc, eq, gte, like, lte, or } from "drizzle-orm";
import { Filter, ScrollText, Search } from "lucide-react";
import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import {
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Journal d'audit" };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    entity?: string;
    from?: string;
    to?: string;
  }>;
}) {
  await requirePermission("audit:read");
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const conditions = [];
  if (q) {
    const search = `%${q}%`;
    conditions.push(
      or(
        like(auditLogs.actorName, search),
        like(auditLogs.action, search),
        like(auditLogs.entity, search),
      )!,
    );
  }
  if (params.entity) conditions.push(eq(auditLogs.entity, params.entity));
  if (params.from) {
    const date = new Date(`${params.from}T00:00:00`);
    if (!Number.isNaN(date.getTime())) conditions.push(gte(auditLogs.createdAt, date));
  }
  if (params.to) {
    const date = new Date(`${params.to}T23:59:59`);
    if (!Number.isNaN(date.getTime())) conditions.push(lte(auditLogs.createdAt, date));
  }

  const rows = await getDb()
    .select()
    .from(auditLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(300);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Sécurité"
        title="Journal d'audit"
        description="Traçabilité des connexions et actions sensibles. Le journal est en lecture seule ; il ne contient jamais de mot de passe."
        actions={
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-[10px] font-bold text-brown-light">
            <ScrollText className="h-3.5 w-3.5 text-mauve" />
            {rows.length} événement(s) affiché(s)
          </span>
        }
      />
      <AdminNotice tone="info">
        Les 300 événements les plus récents sont affichés. Conservez et sauvegardez
        la base pour garder l'historique sur la durée.
      </AdminNotice>

      <form className="admin-card grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <div className="lg:col-span-2">
          <label htmlFor="q" className="admin-label">Recherche</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-light" />
            <input id="q" name="q" defaultValue={q} className="admin-input pl-9" placeholder="Acteur, action, entité…" />
          </div>
        </div>
        <div>
          <label htmlFor="entity" className="admin-label">Entité</label>
          <input id="entity" name="entity" defaultValue={params.entity ?? ""} className="admin-input" placeholder="order, product…" />
        </div>
        <div>
          <label htmlFor="from" className="admin-label">Du</label>
          <input id="from" name="from" type="date" defaultValue={params.from ?? ""} className="admin-input" />
        </div>
        <div>
          <label htmlFor="to" className="admin-label">Au</label>
          <input id="to" name="to" type="date" defaultValue={params.to ?? ""} className="admin-input" />
        </div>
        <div className="flex gap-2 lg:col-span-5">
          <button className="btn-primary btn-sm"><Filter className="h-3.5 w-3.5" />Filtrer</button>
          <Link href="/admin/journal" className="btn-secondary btn-sm">Réinitialiser</Link>
        </div>
      </form>

      {rows.length ? (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Acteur</th>
                  <th>Action</th>
                  <th>Entité</th>
                  <th>IP</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap text-[10px] text-brown-light">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="font-bold text-brown">{log.actorName}</td>
                    <td className="text-[11px]">{log.action}</td>
                    <td className="font-mono text-[9px] text-brown-light">
                      {log.entity}
                      {log.entityId ? <span className="block truncate max-w-[130px]">{log.entityId}</span> : null}
                    </td>
                    <td className="font-mono text-[9px] text-brown-light">{log.ip || "—"}</td>
                    <td>
                      {log.details ? (
                        <details>
                          <summary className="cursor-pointer text-[9px] font-bold text-mauve-700 [&::-webkit-details-marker]:hidden">
                            Voir
                          </summary>
                          <pre className="mt-1 max-h-32 max-w-[280px] overflow-auto rounded-lg bg-mauve-900 p-2 text-[8px] leading-4 text-mauve-100">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-[9px] text-brown-light">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <AdminEmpty title="Aucun événement" description="Aucune entrée ne correspond aux filtres." />
      )}
    </div>
  );
}
