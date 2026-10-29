"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { reviews, type ReviewStatus } from "@/db/schema";
import { logAudit, requirePermission } from "@/lib/auth";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

const STATUSES: ReviewStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export async function updateReview(formData: FormData) {
  const user = await requirePermission("reviews:write");
  const id = text(formData, "id");
  const action = text(formData, "action");
  if (!id) redirect("/admin/avis");
  const db = getDb();
  if (action === "approve" || action === "reject") {
    const status: ReviewStatus = action === "approve" ? "APPROVED" : "REJECTED";
    await db
      .update(reviews)
      .set({
        status,
        approvedAt: status === "APPROVED" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id));
    await logAudit({
      actor: user,
      action: status === "APPROVED" ? "Avis approuvé" : "Avis refusé",
      entity: "review",
      entityId: id,
    });
  } else if (action === "feature") {
    const isFeatured = formData.get("value") === "true";
    await db
      .update(reviews)
      .set({ isFeatured, updatedAt: new Date() })
      .where(eq(reviews.id, id));
    await logAudit({
      actor: user,
      action: isFeatured ? "Avis mis en avant" : "Avis retiré de la une",
      entity: "review",
      entityId: id,
    });
  } else if (action === "delete") {
    await db.delete(reviews).where(eq(reviews.id, id));
    await logAudit({
      actor: user,
      action: "Avis supprimé",
      entity: "review",
      entityId: id,
    });
  } else if (action === "pending") {
    await db
      .update(reviews)
      .set({ status: "PENDING", approvedAt: null, updatedAt: new Date() })
      .where(eq(reviews.id, id));
    await logAudit({
      actor: user,
      action: "Avis remis en modération",
      entity: "review",
      entityId: id,
    });
  }
  revalidatePath("/admin/avis");
  revalidatePath("/avis");
  revalidatePath("/");
  const allowed = STATUSES.includes(text(formData, "returnStatus") as ReviewStatus)
    ? text(formData, "returnStatus")
    : "";
  redirect(`/admin/avis?ok=Avis%20mis%20à%20jour${allowed ? `&statut=${allowed}` : ""}`);
}
