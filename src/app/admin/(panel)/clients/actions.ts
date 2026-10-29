"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { logAudit, requirePermission } from "@/lib/auth";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function updateCustomer(formData: FormData) {
  const user = await requirePermission("customers:write");
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!id || name.length < 2) {
    redirect("/admin/clients?error=Client%20ou%20nom%20invalide");
  }
  await getDb()
    .update(customers)
    .set({
      name,
      email: text(formData, "email"),
      address: text(formData, "address"),
      notes: text(formData, "notes"),
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id));
  await logAudit({
    actor: user,
    action: "Fiche client modifiée",
    entity: "customer",
    entityId: id,
    details: { name },
  });
  revalidatePath("/admin/clients");
  redirect("/admin/clients?ok=Fiche%20client%20mise%20à%20jour");
}
