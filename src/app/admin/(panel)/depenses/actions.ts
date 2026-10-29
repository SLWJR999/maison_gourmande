"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { expenses } from "@/db/schema";
import { logAudit, requirePermission } from "@/lib/auth";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function saveExpense(formData: FormData) {
  const user = await requirePermission("expenses:write");
  const id = text(formData, "id");
  const label = text(formData, "label");
  const amount = Math.max(0, Number.parseInt(text(formData, "amount"), 10) || 0);
  const expenseDate = text(formData, "expenseDate");
  if (!label || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    redirect("/admin/depenses?error=Libellé%2C%20montant%20et%20date%20valides%20requis");
  }
  const values = {
    label,
    category: text(formData, "category") || "Autre",
    amount,
    expenseDate,
    supplier: text(formData, "supplier"),
    paymentMethod: text(formData, "paymentMethod"),
    receiptRef: text(formData, "receiptRef"),
    notes: text(formData, "notes"),
    updatedAt: new Date(),
  };
  const db = getDb();
  if (id) {
    await db.update(expenses).set(values).where(eq(expenses.id, id));
    await logAudit({
      actor: user,
      action: "Dépense modifiée",
      entity: "expense",
      entityId: id,
      details: { label, amount, expenseDate },
    });
  } else {
    const [created] = await db
      .insert(expenses)
      .values({ ...values, isDemo: false })
      .returning();
    await logAudit({
      actor: user,
      action: "Dépense créée",
      entity: "expense",
      entityId: created.id,
      details: { label, amount, expenseDate },
    });
  }
  revalidatePath("/admin/depenses");
  revalidatePath("/admin/rapports");
  revalidatePath("/admin");
  redirect("/admin/depenses?ok=Dépense%20enregistrée");
}

export async function deleteExpense(formData: FormData) {
  const user = await requirePermission("expenses:write");
  const id = text(formData, "id");
  if (!id) redirect("/admin/depenses");
  await getDb().delete(expenses).where(eq(expenses.id, id));
  await logAudit({
    actor: user,
    action: "Dépense supprimée",
    entity: "expense",
    entityId: id,
  });
  revalidatePath("/admin/depenses");
  revalidatePath("/admin/rapports");
  revalidatePath("/admin");
  redirect("/admin/depenses?ok=Dépense%20supprimée");
}
