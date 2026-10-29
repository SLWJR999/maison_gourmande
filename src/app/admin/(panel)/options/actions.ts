"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { options } from "@/db/schema";
import { logAudit, requirePermission } from "@/lib/auth";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function saveOption(formData: FormData) {
  const user = await requirePermission("products:write");
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!name) redirect("/admin/options?error=Nom%20requis");
  const price = Math.max(
    0,
    Number.parseInt(text(formData, "price"), 10) || 0,
  );
  const values = {
    name,
    groupName: text(formData, "groupName") || "Suppléments",
    price,
    isActive: formData.get("isActive") === "on",
    sortOrder: Number.parseInt(text(formData, "sortOrder"), 10) || 0,
    updatedAt: new Date(),
  };
  const db = getDb();
  if (id) {
    await db.update(options).set(values).where(eq(options.id, id));
    await logAudit({
      actor: user,
      action: "Option modifiée",
      entity: "option",
      entityId: id,
      details: { name, price },
    });
  } else {
    const [created] = await db.insert(options).values(values).returning();
    await logAudit({
      actor: user,
      action: "Option créée",
      entity: "option",
      entityId: created.id,
      details: { name, price },
    });
  }
  revalidatePath("/admin/options");
  revalidatePath("/menu");
  redirect("/admin/options?ok=Option%20enregistrée");
}

export async function deleteOption(formData: FormData) {
  const user = await requirePermission("products:write");
  const id = text(formData, "id");
  if (!id) redirect("/admin/options");
  await getDb().delete(options).where(eq(options.id, id));
  await logAudit({
    actor: user,
    action: "Option supprimée",
    entity: "option",
    entityId: id,
  });
  revalidatePath("/admin/options");
  revalidatePath("/menu");
  redirect("/admin/options?ok=Option%20supprimée");
}
