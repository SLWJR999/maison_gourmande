import Link from "next/link";
import { and, count, desc, eq, like, max, ne, or, sum } from "drizzle-orm";
import {
  Mail,
  MapPin,
  Phone,
  Search,
  UserRound,
} from "lucide-react";
import { getDb } from "@/db";
import { customers, orders } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { formatDate, formatFCFA, formatPhone } from "@/lib/utils";
import {
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { updateCustomer } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clients" };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; q?: string }>;
}) {
  await requirePermission("customers:read");
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const conditions = q
    ? [
        or(
          like(customers.name, `%${q}%`),
          like(customers.phone, `%${q}%`),
          like(customers.email, `%${q}%`),
        )!,
      ]
    : [];
  const rows = await getDb()
    .select({
      customer: customers,
      orderCount: count(orders.id),
      spent: sum(orders.total),
      lastOrderAt: max(orders.createdAt),
    })
    .from(customers)
    .leftJoin(
      orders,
      and(eq(orders.customerId, customers.id), ne(orders.status, "CANCELLED")),
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(customers.id)
    .orderBy(desc(max(orders.createdAt)), desc(customers.createdAt))
    .limit(200);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Relation client"
        title="Clients"
        description="Fiches créées automatiquement à chaque commande. Les coordonnées servent uniquement au suivi de la relation et ne sont jamais revendues."
      />
      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}

      <form className="admin-card flex flex-col gap-2 p-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="q" className="admin-label">Rechercher un client</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-light" />
            <input id="q" name="q" defaultValue={q} className="admin-input pl-9" placeholder="Nom, téléphone ou e-mail…" />
          </div>
        </div>
        <button className="btn-primary btn-sm">Rechercher</button>
        {q ? <Link href="/admin/clients" className="btn-secondary btn-sm">Effacer</Link> : null}
      </form>

      {rows.length ? (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {rows.map(({ customer, orderCount, spent, lastOrderAt }) => (
            <div key={customer.id} className="admin-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mauve-100 text-mauve-700">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-extrabold text-brown">
                      {customer.name}
                      {customer.isDemo ? (
                        <span className="ml-1.5 rounded bg-amber-50 px-1 py-0.5 text-[8px] font-bold uppercase text-amber-700">Démo</span>
                      ) : null}
                    </p>
                    <div className="mt-0.5 space-y-0.5 text-[10px] text-brown-light">
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {formatPhone(customer.phone)}
                      </p>
                      {customer.email ? (
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </p>
                      ) : null}
                      {customer.address ? (
                        <p className="flex items-start gap-1">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                          {customer.address}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-brown-light">CA cumulé</p>
                  <p className="text-[13px] font-extrabold text-mauve-900">{formatFCFA(Number(spent ?? 0))}</p>
                  <p className="text-[9px] text-brown-light">{Number(orderCount)} commande(s)</p>
                </div>
              </div>
              <p className="mt-2 text-[9px] text-brown-light">
                Dernière commande : {lastOrderAt ? formatDate(lastOrderAt) : "—"} · Client depuis {formatDate(customer.createdAt)}
              </p>
              <details className="mt-3 border-t border-brown/10 pt-2">
                <summary className="cursor-pointer list-none text-[10px] font-bold text-mauve-700 [&::-webkit-details-marker]:hidden">
                  Modifier les coordonnées / notes
                </summary>
                <form action={updateCustomer} className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input type="hidden" name="id" value={customer.id} />
                  <div>
                    <label className="admin-label" htmlFor={`cname-${customer.id}`}>Nom</label>
                    <input id={`cname-${customer.id}`} name="name" defaultValue={customer.name} required className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label" htmlFor={`cmail-${customer.id}`}>E-mail</label>
                    <input id={`cmail-${customer.id}`} name="email" type="email" defaultValue={customer.email} className="admin-input" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="admin-label" htmlFor={`caddress-${customer.id}`}>Adresse</label>
                    <input id={`caddress-${customer.id}`} name="address" defaultValue={customer.address} className="admin-input" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="admin-label" htmlFor={`cnotes-${customer.id}`}>Notes internes</label>
                    <textarea id={`cnotes-${customer.id}`} name="notes" rows={2} defaultValue={customer.notes} className="admin-textarea" />
                  </div>
                  <button className="btn-primary btn-sm sm:col-span-2">Enregistrer</button>
                </form>
                <Link
                  href={`/admin/commandes?q=${encodeURIComponent(customer.phone)}`}
                  className="mt-2 inline-block text-[10px] font-bold text-mauve-700 underline"
                >
                  Voir ses commandes
                </Link>
              </details>
            </div>
          ))}
        </div>
      ) : (
        <AdminEmpty
          title="Aucun client trouvé"
          description="Les fiches apparaissent dès la première commande enregistrée."
        />
      )}
    </div>
  );
}
