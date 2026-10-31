import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../src/db";
import {
  auditLogs,
  categories,
  productVariants,
  products,
} from "../src/db/schema";

/**
 * Ajoute à la catégorie « Pâtisserie » :
 *  - Gâteau d'anniversaire (8 parts : 8 000 FCFA, 10 parts : 10 000 FCFA)
 *  - Khérou Touba (sachet de 10 : 500 FCFA)
 * et active la catégorie si elle était masquée.
 *
 * Idempotent : un produit dont le slug existe déjà n'est jamais recréé ni écrasé.
 * Usage : npx tsx scripts/add-patisserie.ts
 */

const NEW_PRODUCTS = [
  {
    name: "Gâteau d'anniversaire",
    slug: "gateau-anniversaire",
    shortDescription: "Le gâteau fait maison qui rend la fête encore plus belle.",
    description:
      "Un gâteau moelleux, préparé à la commande et décoré avec soin pour célébrer vos anniversaires et vos moments de partage. Choisissez le format selon le nombre d'invités. Pensez à commander au moins 24 h à l'avance.",
    imageUrl: "/images/pastry.jpg",
    images: ["/images/pastry.jpg"],
    badge: "Sur commande",
    isFeatured: false,
    sortOrder: 1,
    // quantity = 1 : un gâteau entier = 1 pièce (évite de déclencher la remise « 50 pièces »)
    variants: [
      { name: "8 parts", quantity: 1, price: 8_000, composition: "1 gâteau d'anniversaire · 8 parts" },
      { name: "10 parts", quantity: 1, price: 10_000, composition: "1 gâteau d'anniversaire · 10 parts" },
    ],
  },
  {
    name: "Khérou Touba",
    slug: "kherou-touba",
    shortDescription: "La douceur traditionnelle de Touba, en sachet à partager.",
    description:
      "Le Khérou Touba, petite gourmandise sénégalaise croquante et parfumée, vendu en sachet de 10 pièces. À grignoter à tout moment ou à offrir.",
    imageUrl: "/images/pastry.jpg",
    images: ["/images/pastry.jpg"],
    badge: null as string | null,
    isFeatured: false,
    sortOrder: 2,
    variants: [
      { name: "Sachet de 10", quantity: 10, price: 500, composition: "1 sachet de 10 pièces" },
    ],
  },
];

async function main() {
  const db = getDb();

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, "patisserie"))
    .limit(1);
  if (!category) {
    throw new Error(
      'Catégorie « patisserie » introuvable. Créez-la dans l\'admin (slug : patisserie) puis relancez.',
    );
  }

  if (!category.isActive || category.isArchived) {
    await db
      .update(categories)
      .set({
        isActive: true,
        isArchived: false,
        description: "Gâteaux d'anniversaire et douceurs maison.",
        updatedAt: new Date(),
      })
      .where(eq(categories.id, category.id));
    console.log("Catégorie Pâtisserie activée.");
  }

  let created = 0;
  for (const item of NEW_PRODUCTS) {
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, item.slug))
      .limit(1);
    if (existing) {
      console.log(`Déjà présent, ignoré : ${item.name}`);
      continue;
    }

    const [product] = await db
      .insert(products)
      .values({
        categoryId: category.id,
        name: item.name,
        slug: item.slug,
        shortDescription: item.shortDescription,
        description: item.description,
        basePrice: Math.min(...item.variants.map((v) => v.price)),
        costPrice: 0, // à renseigner dans l'admin pour les rapports de marge
        imageUrl: item.imageUrl,
        images: item.images,
        badge: item.badge,
        isFeatured: item.isFeatured,
        isActive: true,
        isArchived: false,
        sortOrder: item.sortOrder,
      })
      .returning();

    await db.insert(productVariants).values(
      item.variants.map((variant, index) => ({
        productId: product.id,
        name: variant.name,
        quantity: variant.quantity,
        price: variant.price,
        composition: variant.composition,
        isActive: true,
        sortOrder: index,
      })),
    );
    created += 1;
    console.log(`Produit ajouté : ${item.name}`);
  }

  if (created > 0) {
    await db.insert(auditLogs).values({
      actorName: "Système",
      action: "MISE_A_JOUR_CATALOGUE",
      entity: "product",
      details: { ajoutes: created, categorie: "patisserie" },
    });
  }
  console.log(created ? `${created} produit(s) ajouté(s).` : "Rien à ajouter.");
  await closeDb();
}

main().catch(async (error) => {
  console.error("Échec de l'ajout des produits :", error);
  await closeDb().catch(() => undefined);
  process.exit(1);
});