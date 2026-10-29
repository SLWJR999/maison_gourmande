"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { mediaAssets } from "@/db/schema";
import { logAudit, requirePermission } from "@/lib/auth";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function addMediaUrl(formData: FormData) {
  const user = await requirePermission("media:write");
  const name = text(formData, "name");
  const url = text(formData, "url");
  if (!name || !url) redirect("/admin/medias?error=Nom%20et%20URL%20requis");
  if (!url.startsWith("/") && !/^https?:\/\//i.test(url)) {
    redirect("/admin/medias?error=L'URL%20doit%20être%20un%20chemin%20interne%20ou%20une%20URL%20https");
  }
  await getDb().insert(mediaAssets).values({
    name,
    url,
    type: /\.(mp4|webm|mov)(\?|$)/i.test(url) ? "VIDEO" : "IMAGE",
    alt: text(formData, "alt"),
  });
  await logAudit({
    actor: user,
    action: "Média externe ajouté",
    entity: "media",
    details: { name, url },
  });
  revalidatePath("/admin/medias");
  redirect("/admin/medias?ok=Média%20ajouté");
}

export async function deleteMedia(formData: FormData) {
  const user = await requirePermission("media:write");
  const id = text(formData, "id");
  if (!id) redirect("/admin/medias");
  await getDb().delete(mediaAssets).where(eq(mediaAssets.id, id));
  await logAudit({
    actor: user,
    action: "Média retiré de la bibliothèque",
    entity: "media",
    entityId: id,
    details: { note: "Le fichier physique n'est pas supprimé." },
  });
  revalidatePath("/admin/medias");
  redirect("/admin/medias?ok=Média%20retiré%20de%20la%20bibliothèque");
}
