"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { eventRequests, type EventStatus } from "@/db/schema";
import { logAudit, requirePermission } from "@/lib/auth";

const STATUSES: EventStatus[] = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "CONFIRMED",
  "DECLINED",
  "ARCHIVED",
];

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function updateEventRequest(formData: FormData) {
  const user = await requirePermission("events:write");
  const id = text(formData, "id");
  if (!id) redirect("/admin/evenements");
  const statusRaw = text(formData, "status");
  const status = STATUSES.includes(statusRaw as EventStatus)
    ? (statusRaw as EventStatus)
    : "NEW";
  const quoteAmount = Math.max(
    0,
    Number.parseInt(text(formData, "quoteAmount"), 10) || 0,
  );
  await getDb()
    .update(eventRequests)
    .set({
      status,
      quoteAmount,
      adminNotes: text(formData, "adminNotes"),
      updatedAt: new Date(),
    })
    .where(eq(eventRequests.id, id));
  await logAudit({
    actor: user,
    action: "Demande événement mise à jour",
    entity: "event_request",
    entityId: id,
    details: { status, quoteAmount },
  });
  revalidatePath("/admin/evenements");
  redirect("/admin/evenements?ok=Demande%20mise%20à%20jour");
}
