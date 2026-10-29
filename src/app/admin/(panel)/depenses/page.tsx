import Link from "next/link";
import { and, asc, desc, eq, gte, lte, sum } from "drizzle-orm";
import { Pencil, Plus, ReceiptText, Trash2, Wallet } from "lucide-react";
import { getDb } from "@/db";
import { expenses } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { dateInputValue, monthStart } from "@/lib/admin";
import { formatDate, formatFCFA } from "@/lib/utils";
import {
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
  AdminStat,
} from "@/components/admin/admin-ui";
import { deleteExpense } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dépenses" };

export default async function AdminExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requirePermission("expenses:read");
  const params = await searchParams;
  const monthFrom = dateInputValue(monthStart());
  const today = dateInputValue();
  const db = getDb();
  const [rows, monthRows, categoryRows, demoCount] = await Promise.all([
    db.select().from(expenses).orderBy(desc(expenses.expenseDate), desc(expenses.createdAt)).limit(300),
    db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          gte(expenses.expenseDate, monthFrom),
          lte(expenses.expenseDate, today),
          eq(expenses.isDemo, false),
        ),
      ),
    db
      .select({ category: expenses.category, total: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          gte(expenses.expenseDate, monthFrom),
          lte(expenses.expenseDate, today),
          eq(expenses.isDemo, false),
        ),
      )
      .groupBy(expenses.category)
      .orderBy(asc(expenses.category)),
    db
      .select({ id: expenses.id })
      .from(expenses)
      .where(eq(expenses.isDemo, true)),
  ]);
  const monthTotal = Number(monthRows[0]?.total ?? 0);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Gestion"
        title="Dépenses"
        description="Enregistrez les achats et charges pour calculer un résultat indicatif fiable. Les dépenses de démonstration sont exclues des totaux."
        actions={
          <Link href="/admin/depenses/nouvelle" className="btn-primary btn-sm">
            <Plus className="h-3.5 w-3.5" />
            Nouvelle dépense
          </Link>
        }
      />
      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStat
          label="Dépenses · ce mois"
          value={formatFCFA(monthTotal)}
          hint="Réelles uniquement (hors démonstration)."
          icon={<Wallet className="h-4 w-4" />}
        />
        <AdminStat
          label="Lignes de démonstration"
          value={demoCount.length}
          hint="Visibles ci-dessous mais exclues des totaux et rapports."
          icon={<ReceiptText className="h-4 w-4" />}
        />
        <AdminStat
          label="Catégories du mois"
          value={categoryRows.length}
          hint="Répartition affichée ci-dessous."
        />
      </div>

      {categoryRows.length ? (
        <div className="admin-card p-4">
          <h2 className="font-display text-lg text-mauve-900">Répartition du mois</h2>
          <div className="mt-3 space-y-2">
            {categoryRows.map((row) => {
              const total = Number(row.total ?? 0);
              const percent = monthTotal > 0 ? Math.round((total / monthTotal) * 100) : 0;
              return (
                <div key={row.category}>
                  <div className="flex justify-between text-[10px] font-bold text-brown-soft">
                    <span>{row.category}</span>
                    <span>{formatFCFA(total)} · {percent}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream">
                    <div className="h-full rounded-full bg-mauve" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {rows.length ? (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Libellé</th>
                  <th>Catégorie</th>
                  <th>Fournisseur</th>
                  <th>Montant</th>
                  <th>Reçu</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((expense) => (
                  <tr key={expense.id}>
                    <td className="whitespace-nowrap text-[10px] text-brown-light">
                      {formatDate(expense.expenseDate)}
                    </td>
                    <td>
                      <p className="font-bold text-brown">
                        {expense.label}
                        {expense.isDemo ? (
                          <span className="ml-1.5 rounded bg-amber-50 px-1 py-0.5 text-[8px] font-bold uppercase text-amber-700">
                            Démo
                          </span>
                        ) : null}
                      </p>
                      {expense.notes ? (
                        <p className="text-[9px] text-brown-light">{expense.notes}</p>
                      ) : null}
                    </td>
                    <td className="text-[10px]">{expense.category}</td>
                    <td className="text-[10px] text-brown-light">{expense.supplier || "—"}</td>
                    <td className="whitespace-nowrap font-extrabold text-mauve-900">
                      {formatFCFA(expense.amount)}
                    </td>
                    <td className="text-[9px] text-brown-light">
                      {expense.receiptRef || "—"}
                      <br />
                      {expense.paymentMethod || ""}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/depenses/${expense.id}`}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-mauve-700 hover:bg-mauve-100/40"
                        >
                          <Pencil className="h-3 w-3" />
                          Modifier
                        </Link>
                        <form action={deleteExpense}>
                          <input type="hidden" name="id" value={expense.id} />
                          <button className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" title="Supprimer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <AdminEmpty
          title="Aucune dépense saisie"
          description="Ajoutez les achats et charges pour obtenir un résultat indicatif."
          action={
            <Link href="/admin/depenses/nouvelle" className="btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" />
              Nouvelle dépense
            </Link>
          }
        />
      )}
    </div>
  );
}
