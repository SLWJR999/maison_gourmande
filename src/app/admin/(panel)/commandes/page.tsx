import Link from "next/link";
import { and, count, desc, eq, gte, like, lte, or, sum } from "drizzle-orm";
import {
  ArrowUpRight,
  Download,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { getDb } from "@/db";
import { orders, type OrderChannel } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { formatDateTime, formatFCFA, formatNumber } from "@/lib/utils";
import {
  ORDER_CHANNEL_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_LABELS,
} from "@/lib/order-status";
import {
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
  AdminStat,
} from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commandes" };

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    error?: string;
    statut?: string;
    canal?: string;
    q?: string;
    from?: string;
    to?: string;
    demo?: string;
  }>;
}) {
  await requirePermission("orders:read");
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const conditions = [];

  if (params.statut && (STATUSES as readonly string[]).includes(params.statut)) {
    conditions.push(eq(orders.status, params.statut as (typeof STATUSES)[number]));
  }
  if (params.canal === "WHATSAPP" || params.canal === "ADMIN") {
    conditions.push(eq(orders.channel, params.canal as OrderChannel));
  }
  if (q) {
    const search = `%${q}%`;
    conditions.push(
      or(
        like(orders.reference, search),
        like(orders.customerName, search),
        like(orders.customerPhone, search),
      )!,
    );
  }
  if (params.from) {
    const from = new Date(`${params.from}T00:00:00`);
    if (!Number.isNaN(from.getTime())) conditions.push(gte(orders.createdAt, from));
  }
  if (params.to) {
    const to = new Date(`${params.to}T23:59:59`);
    if (!Number.isNaN(to.getTime())) conditions.push(lte(orders.createdAt, to));
  }
  if (params.demo === "0") conditions.push(eq(orders.isDemo, false));
  if (params.demo === "1") conditions.push(eq(orders.isDemo, true));

  const where = conditions.length ? and(...conditions) : undefined;
  const db = getDb();
  const [rows, totals] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(250),
    db
      .select({
        orderCount: count(),
        total: sum(orders.total),
        received: sum(orders.amountReceived),
      })
      .from(orders)
      .where(where),
  ]);
  const summary = totals[0];

  const exportQuery = new URLSearchParams();
  for (const key of ["statut", "canal", "q", "from", "to", "demo"] as const) {
    const value = params[key];
    if (value) exportQuery.set(key, value);
  }
  const exportHref = `/admin/commandes/export${exportQuery.toString() ? `?${exportQuery.toString()}` : ""}`;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Commandes"
        title="Toutes les commandes"
        description="Commandes WhatsApp enregistrées sur le site et commandes saisies hors site. Les brouillons WhatsApp ne sont jamais considérés comme des commandes."
        actions={
          <>
            <Link href={exportHref} className="btn-secondary btn-sm">
              <Download className="h-3.5 w-3.5" />
              Exporter CSV
            </Link>
            <Link href="/admin/commandes/nouvelle" className="btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" />
              Commande hors site
            </Link>
          </>
        }
      />

      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStat
          label="Commandes filtrées"
          value={formatNumber(Number(summary?.orderCount ?? 0))}
          hint="Toutes les commandes correspondant aux filtres, démos incluses si non exclues."
        />
        <AdminStat
          label="Montant enregistré"
          value={formatFCFA(Number(summary?.total ?? 0))}
          hint="Somme des totaux, annulées incluses dans cette vue brute."
        />
        <AdminStat
          label="Encaissements déclarés"
          value={formatFCFA(Number(summary?.received ?? 0))}
          hint="Montant effectivement déclaré comme reçu."
        />
      </div>

      <form className="admin-card space-y-3 p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="q" className="admin-label">
              Recherche
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-light" />
              <input
                id="q"
                name="q"
                defaultValue={q}
                className="admin-input pl-9"
                placeholder="Référence, nom, téléphone…"
              />
            </div>
          </div>
          <div>
            <label htmlFor="statut" className="admin-label">
              Statut
            </label>
            <select
              id="statut"
              name="statut"
              defaultValue={params.statut ?? ""}
              className="admin-select"
            >
              <option value="">Tous</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="canal" className="admin-label">
              Canal
            </label>
            <select
              id="canal"
              name="canal"
              defaultValue={params.canal ?? ""}
              className="admin-select"
            >
              <option value="">Tous</option>
              <option value="WHATSAPP">Site / WhatsApp</option>
              <option value="ADMIN">Hors site</option>
            </select>
          </div>
          <div>
            <label htmlFor="demo" className="admin-label">
              Données démo
            </label>
            <select
              id="demo"
              name="demo"
              defaultValue={params.demo ?? ""}
              className="admin-select"
            >
              <option value="">Inclure</option>
              <option value="0">Exclure les démos</option>
              <option value="1">Démos seulement</option>
            </select>
          </div>
          <div>
            <label htmlFor="from" className="admin-label">
              Du
            </label>
            <input id="from" name="from" type="date" defaultValue={params.from ?? ""} className="admin-input" />
          </div>
          <div>
            <label htmlFor="to" className="admin-label">
              Au
            </label>
            <input id="to" name="to" type="date" defaultValue={params.to ?? ""} className="admin-input" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary btn-sm">
            <Filter className="h-3.5 w-3.5" />
            Appliquer
          </button>
          <Link href="/admin/commandes" className="btn-secondary btn-sm">
            Réinitialiser
          </Link>
        </div>
      </form>

      {rows.length ? (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Client</th>
                  <th>Canal</th>
                  <th>Statut</th>
                  <th>Paiement</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/admin/commandes/${order.id}`}
                        className="font-mono text-[11px] font-extrabold text-mauve-700 hover:underline"
                      >
                        {order.reference}
                      </Link>
                      {order.isDemo ? (
                        <span className="ml-1.5 rounded bg-amber-50 px-1 py-0.5 text-[8px] font-bold uppercase text-amber-700">
                          Démo
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <p className="font-bold text-brown">{order.customerName}</p>
                      <p className="text-[10px] text-brown-light">{order.customerPhone}</p>
                    </td>
                    <td className="text-[10px] text-brown-soft">
                      <span className="text-[10px] font-bold">
                        {ORDER_CHANNEL_LABELS[order.channel]}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${ORDER_STATUS_STYLES[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700"
                            : order.paymentStatus === "PARTIAL"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                      </span>
                      {order.amountReceived > 0 ? (
                        <p className="mt-0.5 text-[9px] text-brown-light">
                          {formatFCFA(order.amountReceived)}
                        </p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap font-bold">{formatFCFA(order.total)}</td>
                    <td className="whitespace-nowrap text-[10px] text-brown-light">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td>
                      <Link
                        href={`/admin/commandes/${order.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-mauve-700 hover:bg-mauve-100/40"
                      >
                        Ouvrir
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {Number(summary?.orderCount ?? 0) > rows.length ? (
            <p className="border-t border-brown/10 px-4 py-2 text-[10px] text-brown-light">
              Affichage des 250 commandes les plus récentes. Affinez la période
              ou exportez le CSV pour la liste complète.
            </p>
          ) : null}
        </div>
      ) : (
        <AdminEmpty
          title="Aucune commande trouvée"
          description="Ajustez les filtres ou créez une commande hors site."
          action={
            <Link href="/admin/commandes/nouvelle" className="btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" />
              Commande hors site
            </Link>
          }
        />
      )}
    </div>
  );
}
