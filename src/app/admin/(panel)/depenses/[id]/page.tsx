import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { getDb } from "@/db";
import { expenses } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { formatDate, formatFCFA } from "@/lib/utils";
import { ExpenseForm } from "@/components/admin/expense-form";
import {
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { saveExpense } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Modifier une dépense" };

export default async function EditExpensePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requirePermission("expenses:write");
  const [{ id }, notices] = await Promise.all([params, searchParams]);
  const [expense] = await getDb()
    .select()
    .from(expenses)
    .where(eq(expenses.id, id))
    .limit(1);
  if (!expense) notFound();

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Dépenses"
        title={expense.label}
        description={`Dépense du ${formatDate(expense.expenseDate)} · ${formatFCFA(expense.amount)}${expense.isDemo ? " · donnée de démonstration" : ""}`}
        actions={
          <Link href="/admin/depenses" className="btn-secondary btn-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Toutes les dépenses
          </Link>
        }
      />
      {notices.ok ? <AdminNotice>{notices.ok}</AdminNotice> : null}
      {notices.error ? <AdminNotice tone="error">{notices.error}</AdminNotice> : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_320px] xl:items-start">
        <section className="admin-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-mauve" />
            <h2 className="font-display text-xl text-mauve-900">Modifier la dépense</h2>
          </div>
          <p className="mt-1 text-[10px] leading-5 text-brown-light">
            Le montant et la date alimentent le résultat indicatif du tableau de
            bord et des rapports. Les dépenses de démonstration restent exclues
            des totaux réels.
          </p>
          <div className="mt-4">
            <ExpenseForm action={saveExpense} expense={expense} />
          </div>
        </section>

        <aside className="admin-card p-4 text-[10px] leading-5 text-brown-light">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-mauve-700">Rappel</p>
          <p className="mt-2">
            Une dépense doit correspondre à une sortie réelle et justifiable.
            Indiquez la référence du reçu ou de la facture lorsque vous l'avez.
          </p>
          <p className="mt-2">
            Le résultat affiché dans les rapports est une estimation de gestion,
            pas une comptabilité officielle.
          </p>
        </aside>
      </div>
    </div>
  );
}
