import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarDays,
  ClipboardList,
  Coins,
  Package,
  Plus,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getDashboardData } from "@/lib/admin";
import {
  formatDateTime,
  formatFCFA,
  formatNumber,
} from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/order-status";
import {
  AdminEmpty,
  AdminLink,
  AdminPageHeader,
  AdminStat,
} from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tableau de bord" };

export default async function AdminDashboardPage() {
  const user = await requirePermission("dashboard:view");
  const data = await getDashboardData();
  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Pilotage"
        title={`Bonjour, ${user.name.split(" ")[0]}.`}
        description={`${dateLabel} · Vue d'ensemble de la maison. Les commandes de démonstration sont exclues des indicateurs.`}
        actions={
          <>
            <Link href="/admin/commandes/nouvelle" className="btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" />
              Commande hors site
            </Link>
            <Link href="/admin/produits/nouveau" className="btn-secondary btn-sm">
              <Package className="h-3.5 w-3.5" />
              Nouveau produit
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat
          label="CA enregistré · ce mois"
          value={formatFCFA(data.month.revenue)}
          hint={`${formatNumber(data.month.orderCount)} commande(s) non annulée(s). Encaissements séparés ci-dessous.`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <AdminStat
          label="Encaissements déclarés · ce mois"
          value={formatFCFA(data.month.declaredReceipts)}
          hint={`Reste à encaisser : ${formatFCFA(data.month.outstanding)}`}
          icon={<Banknote className="h-4 w-4" />}
        />
        <AdminStat
          label="Marge brute estimée · ce mois"
          value={formatFCFA(data.month.estimatedMargin)}
          hint={`CA − coût matières historique. ${data.month.missingCostLines > 0 ? `${data.month.missingCostLines} ligne(s) sans coût renseigné.` : "Coûts renseignés."}`}
          icon={<Coins className="h-4 w-4" />}
        />
        <AdminStat
          label="À traiter maintenant"
          value={formatNumber(data.pendingCount)}
          hint="Commandes en attente de confirmation."
          icon={<ClipboardList className="h-4 w-4" />}
          tone="mauve"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="admin-card p-4 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-brown-light">
                Aujourd'hui
              </p>
              <p className="mt-1 font-display text-[26px] text-mauve-900">
                {formatFCFA(data.today.revenue)}
              </p>
              <p className="mt-1 text-[10px] text-brown-light">
                {formatNumber(data.today.orderCount)} commande(s) ·{" "}
                {formatFCFA(data.today.declaredReceipts)} encaissés déclarés
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mauve-100 text-mauve-700">
              <CalendarDays className="h-4.5 w-4.5" size={18} />
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Produits actifs", value: formatNumber(data.activeProducts) },
              { label: "En attente", value: formatNumber(data.pendingCount) },
              { label: "Promos actives", value: formatNumber(data.activePromotions) },
              { label: "Démo exclues", value: formatNumber(data.month.demoOrderCount) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-cream/60 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-brown-light">
                  {item.label}
                </p>
                <p className="mt-0.5 text-[13px] font-extrabold text-brown">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card p-4">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-brown-light">
            Résultat estimé · ce mois
          </p>
          <p className="mt-1 font-display text-[28px] text-mauve-900">
            {formatFCFA(data.month.estimatedResult)}
          </p>
          <p className="mt-1 text-[10px] leading-4 text-brown-light">
            CA enregistré − coût matières − dépenses de la période.
          </p>
          <div className="mt-3 space-y-1 text-[10px] text-brown-soft">
            <div className="flex justify-between">
              <span>Dépenses saisies</span>
              <span className="font-bold">{formatFCFA(data.month.expenseTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Coût matières</span>
              <span className="font-bold">{formatFCFA(data.month.productCosts)}</span>
            </div>
          </div>
          <p className="mt-3 text-[9px] leading-4 text-amber-700">
            Estimation indicative : elle ne remplace pas une comptabilité et
            n'inclut pas les charges non saisies.
          </p>
        </div>
      </div>

      {data.month.missingCostLines > 0 ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[11px] leading-5 text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>{data.month.missingCostLines} ligne(s)</strong> de commande
            n'ont pas de coût matière historique. La marge estimée est donc
            incomplète.{" "}
            <Link href="/admin/couts" className="underline">
              Vérifier les coûts
            </Link>
            .
          </span>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="admin-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-brown/10 px-4 py-3">
            <div>
              <h2 className="font-display text-lg text-mauve-900">Dernières commandes</h2>
              <p className="text-[10px] text-brown-light">
                Toutes les commandes, y compris les démos clairement identifiées.
              </p>
            </div>
            <AdminLink href="/admin/commandes">Tout voir</AdminLink>
          </div>
          {data.recentOrders.length ? (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Client</th>
                    <th>Statut</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link
                          href={`/admin/commandes/${order.id}`}
                          className="font-extrabold text-mauve-700 hover:underline"
                        >
                          {order.reference}
                        </Link>
                        {order.isDemo ? (
                          <span className="ml-1.5 rounded bg-amber-50 px-1 py-0.5 text-[8px] font-bold uppercase text-amber-700">
                            Démo
                          </span>
                        ) : null}
                      </td>
                      <td className="max-w-[160px] truncate">{order.customerName}</td>
                      <td>
                        <span className={`status-pill ${ORDER_STATUS_STYLES[order.status]}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="font-bold">{formatFCFA(order.total)}</td>
                      <td className="whitespace-nowrap text-[11px] text-brown-light">
                        {formatDateTime(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4">
              <AdminEmpty
                title="Aucune commande pour le moment"
                description="Les commandes enregistrées sur le site apparaîtront ici."
              />
            </div>
          )}
        </div>

        <div className="admin-card p-4">
          <h2 className="font-display text-lg text-mauve-900">Raccourcis</h2>
          <div className="mt-3 space-y-2">
            {[
              { href: "/admin/commandes?statut=PENDING", label: "Commandes en attente", icon: ClipboardList },
              { href: "/admin/evenements?statut=NEW", label: "Demandes d'événements", icon: CalendarDays },
              { href: "/admin/avis?statut=PENDING", label: "Avis à modérer", icon: Users },
              { href: "/admin/depenses/nouvelle", label: "Saisir une dépense", icon: Wallet },
              { href: "/admin/rapports", label: "Rapports & exports", icon: ReceiptText },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-2.5 rounded-xl border border-brown/10 px-3 py-2.5 text-[11px] font-bold text-brown-soft transition hover:border-mauve/25 hover:bg-mauve-100/30 hover:text-mauve-800"
              >
                <item.icon className="h-4 w-4 text-mauve" />
                <span className="flex-1">{item.label}</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-30 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-mauve-900 p-3.5 text-white">
            <ShoppingBag className="h-4 w-4 text-ochre-light" />
            <p className="mt-2 text-[11px] font-bold">Rappel des règles</p>
            <p className="mt-1 text-[9px] leading-4 text-mauve-200/75">
              Une offre limitée compte les commandes enregistrées non annulées.
              Un clic WhatsApp seul ne confirme aucune commande. Une seule
              meilleure offre s'applique, en plus de la remise quantité.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
