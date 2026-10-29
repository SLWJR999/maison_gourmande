"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit, requirePermission } from "@/lib/auth";
import { saveSettings } from "@/lib/settings";

const OPERATIONAL_KEYS = [
  "phone",
  "whatsapp",
  "email",
  "address",
  "hours",
  "instagram",
  "facebook",
  "tiktok",
  "cuisineZone",
  "deliveryFee",
  "quantityDiscountThreshold",
  "quantityDiscountPercent",
  "orderNote",
  "whatsappGreeting",
  "minLeadTime",
  "rccm",
];

export async function saveOperationalSettings(formData: FormData) {
  const user = await requirePermission("settings:write");
  const values: Record<string, string> = {};
  for (const key of OPERATIONAL_KEYS) {
    values[key] = String(formData.get(key) ?? "").trim();
  }
  const whatsapp = values.whatsapp.replace(/\D/g, "");
  if (whatsapp.length < 8) {
    redirect("/admin/parametres?error=Numéro%20WhatsApp%20invalide");
  }
  const deliveryFee = Number.parseInt(values.deliveryFee, 10);
  const threshold = Number.parseInt(values.quantityDiscountThreshold, 10);
  const percent = Number.parseInt(values.quantityDiscountPercent, 10);
  if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
    redirect("/admin/parametres?error=Frais%20de%20livraison%20invalides");
  }
  if (!Number.isFinite(threshold) || threshold < 1) {
    redirect("/admin/parametres?error=Seuil%20de%20remise%20quantité%20invalide");
  }
  if (!Number.isFinite(percent) || percent < 0 || percent > 50) {
    redirect("/admin/parametres?error=La%20remise%20quantité%20doit%20être%20entre%200%20et%2050%25");
  }
  values.deliveryFee = String(deliveryFee);
  values.quantityDiscountThreshold = String(threshold);
  values.quantityDiscountPercent = String(percent);

  await saveSettings(values);
  await logAudit({
    actor: user,
    action: "Paramètres opérationnels mis à jour",
    entity: "settings",
    entityId: "operations",
    details: { keys: OPERATIONAL_KEYS },
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/parametres");
  revalidatePath("/panier");
  revalidatePath("/menu");
  redirect("/admin/parametres?ok=Paramètres%20enregistrés");
}
