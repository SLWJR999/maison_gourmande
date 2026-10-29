"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit, requirePermission } from "@/lib/auth";
import { saveSettings } from "@/lib/settings";

const CONTENT_KEYS = [
  "brandName",
  "brandTagline",
  "announcement",
  "heroKicker",
  "heroTitle",
  "heroText",
  "heroImage",
  "aboutTitle",
  "aboutText",
  "eventIntro",
  "videoTitle",
  "videoText",
  "videoUrl",
  "videoPoster",
  "footerText",
];

export async function saveContent(formData: FormData) {
  const user = await requirePermission("content:write");
  const values: Record<string, string> = {};
  for (const key of CONTENT_KEYS) {
    values[key] = String(formData.get(key) ?? "").trim();
  }
  if (!values.heroTitle || !values.heroText) {
    redirect("/admin/contenu?error=Le%20titre%20et%20le%20texte%20d'accueil%20sont%20requis");
  }
  await saveSettings(values);
  await logAudit({
    actor: user,
    action: "Contenu du site mis à jour",
    entity: "settings",
    entityId: "site-content",
    details: { keys: CONTENT_KEYS },
  });
  revalidatePath("/");
  revalidatePath("/a-propos");
  revalidatePath("/evenements");
  revalidatePath("/admin/contenu");
  redirect("/admin/contenu?ok=Contenu%20enregistré");
}
