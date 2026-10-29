import type { Metadata } from "next";
import { getAllVariantOptions } from "@/lib/catalog";
import { getCachedSettings, settingInt } from "@/lib/settings";
import { CartClient } from "@/components/cart/cart-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon panier",
  description:
    "Vérifiez votre panier Maison Gourmande, appliquez vos remises et préparez votre commande WhatsApp.",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const [variantOptions, settings] = await Promise.all([
    getAllVariantOptions(),
    getCachedSettings(),
  ]);

  return (
    <CartClient
      variantOptions={variantOptions}
      settings={{
        deliveryFee: settingInt(settings, "deliveryFee", 1000),
        orderNote: settings.orderNote,
      }}
    />
  );
}
