import Link from "next/link";
import { and, count, desc, eq, gte, lte, ne, sql, sum } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowDownToLine,
  BarChart3,
  CalendarRange,
  Coins,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getDb } from "@/db";
import { expenses, orderItems, orders, type PaymentStatus } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import {
  dateInputValue,
  endOfDay,
  getReport,
  monthStart,
  parseDateInput,
  startOfDay,
} from "@/lib/admin";
import { formatDate, formatFCFA, formatNumber } from "@/lib/utils";
import { PAYMENT_STATUS_LABELS } from "@/lib/order-status";
import {
  AdminNotice,
  AdminPageHeader,
  AdminStat,
} from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rapports" };

function number(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    demo?: string;
    ok?: string;
  }>;
}) {
  await requirePermission("reports:read");
  const params = await searchParams;
  const includeDemo = params.demo === "1";
  const from = startOfDay(parseDateInput(params.from, monthStart()));
  const to = endOfDay(parseDateInput(params.to, new Date()));
  const rangeFrom = from <= to ? from : to;
  const rangeTo = from <= to ? to : from;
  const demoFlag = !includeDemo;
  const db = getDb();

  const orderConditions = [
    ne(orders.status, "CANCELLED"),
    gte(orders.createdAt, rangeFrom),
    lte(orders.createdAt, rangeTo),
  ];
  if (demoFlag) orderConditions.push(eq(orders.isDemo, false));

  const [report, productRows, paymentRows, channelRows, dailyRows, expenseRows] =
    await Promise.all([
      getReport(rangeFrom, rangeTo, includeDemo),
      db
        .select({
          productName: orderItems.productName,
          quantity: sum(orderItems.quantity),
          revenue: sum(orderItems.lineTotal),
          cost: sum(sql`${orderItems.costPrice} * ${orderItems.quantity}`),
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(...orderConditions))
        .groupBy(orderItems.productName)
        .orderBy(desc(sum(orderItems.lineTotal)))
        .limit(10),
      db
        .select({
          paymentStatus: orders.paymentStatus,
          total: count(),
          amount: sum(orders.total),
        })
        .from(orders)
        .where(and(...orderConditions))
        .groupBy(orders.paymentStatus),
      db
        .select({
          channel: orders.channel,
          total: count(),
          amount: sum(orders.total),
        })
        .from(orders)
        .where(and(...orderConditions))
        .groupBy(orders.channel),
      db
        .select({
          createdAt: orders.createdAt,
          total: orders.total,
        })
        .from(orders)
        .where(and(...orderConditions)),
      db
        .select({
          category: expenses.category,
          total: sum(expenses.amount),
        })
        .from(expenses)
        .where(
          and(
            gte(expenses.expenseDate, dateInputValue(rangeFrom)),
            lte(expenses.expenseDate, dateInputValue(rangeTo)),
            ...(demoFlag ? [eq(expenses.isDemo, false)] : []),
          ),
        )
        .groupBy(expenses.category)
        .orderBy(desc(sum(expenses.amount))),
    ]);

  const days = new Map<string, number>();
  for (const row of dailyRows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    days.set(key, (days.get(key) ?? 0) + row.total);
  }
  const daily = Array.from(days.entries()).sort(([a], [b]) => a.localeCompare(b));
  const maxDay = Math.max(1, ...daily.map(([, total]) => total));
  const topProductMax = Math.max(
    1,
    ...productRows.map((row) => number(row.revenue)),
  );
  const exportHref = `/admin/rapports/export?from=${dateInputValue(rangeFrom)}&to=${dateInputValue(rangeTo)}${includeDemo ? "&demo=1" : ""}`;
  const ordersCsvHref = `/admin/commandes/export?from=${dateInputValue(rangeFrom)}&to=${dateInputValue(rangeTo)}${demoFlag ? "&demo=0" : ""}`;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Gestion"
        title="Rapports & exports"
        description="Chiffre d'affaires enregistré, encaissements déclarés et résultat indicatif. Les données de démonstration sont exclues par défaut et clairement signalées lorsqu'elles sont incluses."
        actions={
          <>
            <Link href={ordersCsvHref} className="btn-secondary btn-sm">
              <ArrowDownToLine className="h-3.5 w-3.5" />
              CSV commandes
            </Link>
            <Link href={exportHref} className="btn-primary btn-sm">
              <ArrowDownToLine className="h-3.5 w-3.5" />
              CSV synthèse
            </Link>
          </>
        }
      />
      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}

      <form className="admin-card grid gap-2 p-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <div>
          <label htmlFor="from" className="admin-label">
            Du
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={dateInputValue(rangeFrom)}
            className="admin-input"
          />
        </div>
        <div>
          <label htmlFor="to" className="admin-label">
            Au
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={dateInputValue(rangeTo)}
            className="admin-input"
          />
        </div>
        <label className="flex h-[42px] items-center gap-2 rounded-xl border border-brown/10 px-3 text-[10px] font-bold text-brown-soft">
          <input
            type="checkbox"
            name="demo"
            value="1"
            defaultChecked={includeDemo}
            className="h-4 w-4 accent-mauve"
          />
          Inclure la démo
        </label>
        <button type="submit" className="btn-primary btn-sm h-[42px]">
          <CalendarRange className="h-3.5 w-3.5" />
          Actualiser
        </button>
      </form>

      {includeDemo ? (
        <AdminNotice tone="warning">
          Les commandes et dépenses de démonstration sont incluses dans cette
          vue. Les chiffres ne représentent pas l'activité réelle.
        </AdminNotice>
      ) : report.demoOrderCount > 0 ? (
        <AdminNotice tone="info">
          {report.demoOrderCount} commande(s) de démonstration sur la période
          sont exclues des indicateurs. Cochez « Inclure la démo » pour les voir.
        </AdminNotice>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-brown-light">
        <span className="rounded-full bg-white px-3 py-1.5">
          Période : {formatDate(rangeFrom)} → {formatDate(rangeTo)}
        </span>
        <span className="rounded-full bg-white px-3 py-1.5">
          {formatNumber(report.orderCount)} commande(s) non annulée(s)
        </span>
        <span className="rounded-full bg-white px-3 py-1.5">
          Données démo : {includeDemo ? "incluses" : "exclues"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat
          label="CA enregistré"
          value={formatFCFA(report.revenue)}
          hint="Total des commandes non annulées, livraison incluse. Ce n'est pas la trésorerie encaissée."
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <AdminStat
          label="Encaissements déclarés"
          value={formatFCFA(report.declaredReceipts)}
          hint={`Reste déclaré à encaisser : ${formatFCFA(report.outstanding)}. Champ saisi par l'équipe, non vérifié par une banque.`}
          icon={<Wallet className="h-4 w-4" />}
        />
        <AdminStat
          label="Marge brute indicative"
          value={formatFCFA(report.estimatedMargin)}
          hint={`CA − coût matières historique (${formatFCFA(report.productCosts)}). Hors charges fixes et livraison.`}
          icon={<Coins className="h-4 w-4" />}
        />
        <AdminStat
          label="Résultat indicatif"
          value={formatFCFA(report.estimatedResult)}
          hint={`Marge brute − dépenses réelles saisies (${formatFCFA(report.expenseTotal)}). Estimation, jamais une comptabilité officielle.`}
          icon={
            report.estimatedResult >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )
          }
          tone={report.estimatedResult >= 0 ? "emerald" : "amber"}
        />
      </div>

      {report.missingCostLines > 0 ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>{report.missingCostLines} ligne(s)</strong> de commande sans
            coût matière sur la période. La marge et le résultat indicatif sont
            incomplets.{" "}
            <Link href="/admin/couts?manque=1" className="underline">
              Compléter les coûts
            </Link>
            .
          </span>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="admin-card p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-mauve" />
            <h2 className="font-display text-lg text-mauve-900">
              CA enregistré par jour
            </h2>
          </div>
          {daily.length ? (
            <div className="mt-4 flex h-44 items-end gap-1.5 overflow-x-auto pb-1">
              {daily.map(([day, total]) => (
                <div
                  key={day}
                  className="flex min-w-[24px] flex-1 flex-col items-center justify-end gap-1"
                  title={`${formatDate(day)} · ${formatFCFA(total)}`}
                >
                  <div
                    className="w-full rounded-t-md bg-mauve transition hover:bg-mauve-700"
                    style={{ height: `${Math.max(4, (total / maxDay) * 135)}px` }}
                  />
                  <span className="whitespace-nowrap text-[8px] text-brown-light">
                    {day.slice(8, 10)}/{day.slice(5, 7)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-[11px] italic text-brown-light">
              Aucune commande non annulée sur cette période.
            </p>
          )}
          <p className="mt-2 text-[9px] leading-4 text-brown-light">
            Histogramme des totaux enregistrés. Une commande annulée est exclue.
            Les encaissements réels ne sont pas représentés ici.
          </p>
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-mauve" />
            <h2 className="font-display text-lg text-mauve-900">
              Paiements déclarés
            </h2>
          </div>
          <div className="mt-3 space-y-2">
            {paymentRows.length ? (
              paymentRows.map((row) => (
                <div
                  key={row.paymentStatus}
                  className="flex items-center justify-between rounded-xl bg-cream/60 px-3 py-2"
                >
                  <div>
                    <p className="text-[10px] font-bold text-brown">
                      {PAYMENT_STATUS_LABELS[row.paymentStatus as PaymentStatus]}
                    </p>
                    <p className="text-[9px] text-brown-light">
                      {number(row.total)} commande(s)
                    </p>
                  </div>
                  <p className="text-[11px] font-extrabold text-mauve-900">
                    {formatFCFA(number(row.amount))}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[11px] italic text-brown-light">
                Aucun paiement sur la période.
              </p>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {channelRows.map((row) => (
              <div
                key={row.channel}
                className="flex justify-between text-[10px] text-brown-soft"
              >
                <span>
                  {row.channel === "ADMIN" ? "Hors site" : "Site / WhatsApp"}
                </span>
                <span className="font-bold">
                  {number(row.total)} · {formatFCFA(number(row.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="admin-card p-4">
          <h2 className="font-display text-lg text-mauve-900">
            Meilleurs produits
          </h2>
          <p className="text-[9px] text-brown-light">
            Sur la période, hors commandes annulées. Les noms sont des
            instantanés historiques.
          </p>
          <div className="mt-3 space-y-2.5">
            {productRows.length ? (
              productRows.map((row) => {
                const revenue = number(row.revenue);
                const cost = number(row.cost);
                return (
                  <div key={row.productName}>
                    <div className="flex items-baseline justify-between gap-2 text-[10px]">
                      <span className="font-bold text-brown">
                        {row.productName}
                      </span>
                      <span className="whitespace-nowrap font-extrabold text-mauve-900">
                        {formatFCFA(revenue)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream">
                      <div
                        className="h-full rounded-full bg-mauve"
                        style={{
                          width: `${Math.max(3, (revenue / topProductMax) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-0.5 text-[9px] text-brown-light">
                      {formatNumber(number(row.quantity))} vendu(s) · coût{" "}
                      {formatFCFA(cost)} · marge brute{" "}
                      {formatFCFA(revenue - cost)}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] italic text-brown-light">
                Aucune vente sur la période.
              </p>
            )}
          </div>
        </div>

        <div className="admin-card p-4">
          <h2 className="font-display text-lg text-mauve-900">
            Dépenses par catégorie
          </h2>
          <p className="text-[9px] text-brown-light">
            {demoFlag
              ? "Dépenses réelles uniquement."
              : "Dépenses de démonstration incluses."}
          </p>
          <div className="mt-3 space-y-2">
            {expenseRows.length ? (
              expenseRows.map((row) => (
                <div
                  key={row.category}
                  className="flex justify-between gap-2 text-[10px]"
                >
                  <span className="text-brown-soft">{row.category}</span>
                  <span className="font-bold text-brown">
                    {formatFCFA(number(row.total))}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[11px] italic text-brown-light">
                Aucune dépense réelle saisie sur la période.
              </p>
            )}
          </div>
          <div className="mt-4 rounded-xl bg-mauve-900 p-3 text-white">
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-mauve-200/60">
              Lecture des chiffres
            </p>
            <ul className="mt-1.5 space-y-1 text-[9px] leading-4 text-mauve-200/75">
              <li>CA enregistré ≠ argent reçu.</li>
              <li>Encaissements déclarés = montant saisi par l'équipe.</li>
              <li>Résultat indicatif = estimation, hors charges non saisies.</li>
              <li>Aucune donnée n'est inventée : un coût manquant est signalé.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
