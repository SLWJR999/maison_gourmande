"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { logAudit, requirePermission } from "@/lib/auth";

export async function updateProductCost(formData: FormData) {
  const user = await requirePermission("products:write");
  const id = String(formData.get("id") ?? "").trim();
  const cost = Math.max(0, Number.parseInt(String(formData.get("costPrice") ?? ""), 10) || 0);
  if (!id) redirect("/admin/couts");
  await getDb()
    .update(products)
    .set({ costPrice: cost, updatedAt: new Date() })
    .where(eq(products.id, id));
  await logAudit({
    actor: user,
    action: "Coût matière modifié",
    entity: "product",
    entityId: id,
    details: { costPrice: cost },
  });
  revalidatePath("/admin/couts");
  revalidatePath("/admin/produits");
  redirect("/admin/couts?ok=Coût%20matière%20mis%20à%20jour");
}
