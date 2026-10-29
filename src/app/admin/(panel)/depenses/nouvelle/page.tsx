import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExpenseForm } from "@/components/admin/expense-form";
import { requirePermission } from "@/lib/auth";
import {
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { saveExpense } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nouvelle dépense" };

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("expenses:write");
  const params = await searchParams;
  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Gestion"
        title="Nouvelle dépense"
        description="Saisissez une charge réelle. Les dépenses de démonstration ne doivent pas être utilisées pour piloter la maison."
        actions={
          <Link href="/admin/depenses" className="btn-secondary btn-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Link>
        }
      />
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}
      <div className="admin-card max-w-2xl p-4 sm:p-5">
        <ExpenseForm action={saveExpense} />
      </div>
    </div>
  );
}
