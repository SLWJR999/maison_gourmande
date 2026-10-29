import { and, desc, eq } from "drizzle-orm";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getDb } from "@/db";
import { eventRequests, type EventStatus } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { formatDate, formatFCFA } from "@/lib/utils";
import {
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { updateEventRequest } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Événements & devis" };

const STATUS_LABELS: Record<EventStatus, string> = {
  NEW: "Nouvelle",
  CONTACTED: "Contactée",
  QUOTED: "Devis envoyé",
  CONFIRMED: "Confirmée",
  DECLINED: "Refusée",
  ARCHIVED: "Archivée",
};

const STATUS_STYLES: Record<EventStatus, string> = {
  NEW: "bg-amber-50 text-amber-800",
  CONTACTED: "bg-sky-50 text-sky-800",
  QUOTED: "bg-mauve-100 text-mauve-800",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  DECLINED: "bg-red-50 text-red-700",
  ARCHIVED: "bg-stone-100 text-stone-500",
};

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; statut?: string }>;
}) {
  await requirePermission("events:read");
  const params = await searchParams;
  const status = params.statut && STATUS_LABELS[params.statut as EventStatus]
    ? (params.statut as EventStatus)
    : null;
  const rows = await getDb()
    .select()
    .from(eventRequests)
    .where(status ? and(eq(eventRequests.status, status)) : undefined)
    .orderBy(desc(eventRequests.createdAt))
    .limit(200);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Relation client"
        title="Événements & devis"
        description="Demandes reçues via le site. Une demande n'est jamais une réservation automatique : confirmez le devis et les modalités avant l'événement."
      />
      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}

      <div className="flex flex-wrap gap-1.5">
        <Link
          href="/admin/evenements"
          className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${!status ? "bg-mauve text-white" : "border border-brown/10 bg-white text-brown-soft"}`}
        >
          Toutes
        </Link>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/evenements?statut=${value}`}
            className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${status === value ? "bg-mauve text-white" : "border border-brown/10 bg-white text-brown-soft"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {rows.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((request) => {
            const digits = request.phone.replace(/\D/g, "");
            const waHref = `https://wa.me/${digits}?text=${encodeURIComponent(
              `Bonjour ${request.name}, ici Maison Gourmande. Nous revenons vers vous concernant votre demande ${request.reference} pour le ${formatDate(request.eventDate)}.`,
            )}`;
            return (
              <div key={request.id} className="admin-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-display text-[20px] leading-tight text-mauve-900">
                        {request.eventType}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase ${STATUS_STYLES[request.status]}`}>
                        {STATUS_LABELS[request.status]}
                      </span>
                      {request.isDemo ? (
                        <span className="rounded bg-amber-50 px-1 py-0.5 text-[8px] font-bold uppercase text-amber-700">Démo</span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 font-mono text-[9px] text-brown-light">{request.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase text-brown-light">Devis</p>
                    <p className="text-[13px] font-extrabold text-mauve-900">
                      {request.quoteAmount > 0 ? formatFCFA(request.quoteAmount) : "À établir"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-brown-soft">
                  <p className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3 text-mauve" />
                    {formatDate(request.eventDate)}
                    {request.eventTime ? ` · ${request.eventTime}` : ""}
                  </p>
                  <p className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-mauve" />
                    {request.peopleCount} personne(s)
                  </p>
                  <p className="flex items-start gap-1">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-mauve" />
                    {request.location}
                  </p>
                  <p className="flex items-center gap-1">
                    <Clock3 className="h-3 w-3 text-mauve" />
                    Reçue le {formatDate(request.createdAt)}
                  </p>
                </div>

                <div className="mt-2 rounded-xl bg-cream/60 p-2.5 text-[10px] leading-5 text-brown-soft">
                  <p className="font-bold text-brown">{request.name}</p>
                  <p className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {request.phone}
                    {request.email ? (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {request.email}
                      </span>
                    ) : null}
                  </p>
                  <p>Budget indicatif : {request.budget > 0 ? formatFCFA(request.budget) : "non précisé"}</p>
                  {request.products.length ? (
                    <p>
                      Produits :{" "}
                      {request.products.map((product) => `${product.quantity} × ${product.name}`).join(", ")}
                    </p>
                  ) : null}
                  {request.notes ? <p className="italic">« {request.notes} »</p> : null}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <a href={waHref} target="_blank" rel="noreferrer noopener" className="btn-primary btn-sm">
                    <MessageCircle className="h-3 w-3" />
                    WhatsApp
                  </a>
                  <a href={`tel:${request.phone.replace(/\s/g, "")}`} className="btn-secondary btn-sm">
                    <Phone className="h-3 w-3" />
                    Appeler
                  </a>
                </div>

                <details className="mt-3 border-t border-brown/10 pt-2">
                  <summary className="cursor-pointer list-none text-[10px] font-extrabold text-mauve-700 [&::-webkit-details-marker]:hidden">
                    Traiter la demande
                  </summary>
                  <form action={updateEventRequest} className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input type="hidden" name="id" value={request.id} />
                    <div>
                      <label className="admin-label" htmlFor={`estatus-${request.id}`}>Statut</label>
                      <select id={`estatus-${request.id}`} name="status" defaultValue={request.status} className="admin-select">
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="admin-label" htmlFor={`equote-${request.id}`}>Montant du devis (FCFA)</label>
                      <input id={`equote-${request.id}`} name="quoteAmount" type="number" min={0} defaultValue={request.quoteAmount} className="admin-input" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="admin-label" htmlFor={`enotes-${request.id}`}>Notes internes</label>
                      <textarea id={`enotes-${request.id}`} name="adminNotes" rows={2} defaultValue={request.adminNotes} className="admin-textarea" />
                    </div>
                    <button className="btn-primary btn-sm sm:col-span-2">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Enregistrer le suivi
                    </button>
                  </form>
                </details>
              </div>
            );
          })}
        </div>
      ) : (
        <AdminEmpty
          title="Aucune demande d'événement"
          description="Les demandes de devis apparaîtront ici avec leur référence."
        />
      )}
    </div>
  );
}
