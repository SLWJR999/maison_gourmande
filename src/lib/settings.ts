import { cache } from "react";
import { getDb } from "@/db";
import { settings } from "@/db/schema";

export const DEFAULT_SETTINGS: Record<string, string> = {
  brandName: "Maison Gourmande",
  brandTagline: "La gourmandise, faite maison.",
  phone: "+221 70 98 15 201",
  whatsapp: "221709815201",
  email: "bonjour@maisongourmande.sn",
  address: "Keur Massar, Rond-point Gouye Gui · Dakar, Sénégal",
  hours: "Lundi – samedi : 11h30 – 22h\nDimanche : 15h – 22h",
  instagram: "https://www.instagram.com/",
  facebook: "https://www.facebook.com/",
  tiktok: "https://www.tiktok.com/",
  heroKicker: "Cuisine maison · Keur Massar",
  heroTitle: "Le goût de la maison, à chaque bouchée.",
  heroText:
    "Fataya croustillants, tacos généreux, crêpes fondantes… Des recettes préparées chaque jour avec des produits choisis, pour les petites faims et les grands moments.",
  heroImage: "/images/hero-fataya.jpg",
  announcement: "Livraison offerte dès 15 000 FCFA dans notre zone de livraison",
  videoUrl: "/videos/maison-gourmande.mp4",
  videoPoster: "/images/video-poster.jpg",
  videoTitle: "Dans les coulisses de la maison",
  videoText:
    "Chaque commande démarre par une sélection d'ingrédients frais et se termine dans une boîte qui sent bon la maison.",
  aboutTitle: "Une maison, des recettes, du cœur.",
  aboutText:
    "Maison Gourmande est née à Keur Massar d'une envie simple : réunir autour d'une table ce qui fait plaisir. Nos fataya sont pliés à la main, nos tacos préparés à la commande, nos crêpes garnies avec générosité. Une cuisine de quartier, joyeuse et sans artifice, au cœur de Dakar.",
  eventIntro:
    "Un anniversaire, un baptême, un déjeuner d'équipe ? Nous composons une offre gourmande à votre image, du format cocktail aux grandes tablées.",
  deliveryFee: "1000",
  quantityDiscountThreshold: "50",
  quantityDiscountPercent: "5",
  orderNote:
    "Votre commande est enregistrée dès maintenant. Elle ne sera confirmée qu'après réponse de la boutique sur WhatsApp. Aucun paiement en ligne n'est demandé.",
  whatsappGreeting: "Bonjour Maison Gourmande !",
  footerText:
    "Des recettes généreuses, préparées avec soin à Keur Massar, Dakar. À partager, à savourer, à recommander.",
  cuisineZone:
    "Keur Massar, Gouye Gui, Malika, Yeumbeul, Pikine, Guédiawaye, Thiaroye et environs de Dakar.",
  minLeadTime: "24h pour les événements",
  rccm: "RCCM / NINEA — informations à compléter",
};

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);

export type SiteSettings = typeof DEFAULT_SETTINGS;

export async function getSettings(): Promise<SiteSettings> {
  try {
    const db = getDb();
    const rows = await db.select().from(settings);
    const values = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      values[row.key] = row.value;
    }
    return values;
  } catch (error) {
    console.error("Impossible de charger les paramètres :", error);
    return { ...DEFAULT_SETTINGS };
  }
}

export const getCachedSettings = cache(getSettings);

export async function saveSettings(values: Record<string, string>) {
  const db = getDb();
  const entries = Object.entries(values).filter(
    ([key]) => SETTING_KEYS.includes(key) || key.startsWith("custom_"),
  );
  for (const [key, value] of entries) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() },
      });
  }
}

export function settingInt(settings: SiteSettings, key: string, fallback = 0): number {
  const raw = settings[key];
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getWhatsAppNumber(settings: SiteSettings): string {
  const raw = settings.whatsapp || process.env.WHATSAPP_FALLBACK || "";
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("221")) return digits;
  if (digits.length === 9) return `221${digits}`;
  return digits;
}
