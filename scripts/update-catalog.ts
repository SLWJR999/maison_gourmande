import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { and, asc, eq } from "drizzle-orm";
import { closeDb, getDb } from "../src/db";
import {
  auditLogs,
  productVariants,
  products,
} from "../src/db/schema";

/**
 * Ajoute le format « Box de 15 » aux produits de démonstration Mini-fataya et
 * Nems s'il est absent, puis remet les formats dans l'ordre 1/10/15/25/50.
 *
 * Idempotent : un format de 15 pièces déjà présent n'est jamais dupliqué ni
 * écrasé. À relancer après une mise à jour d'une base existante.
 */

const TARGETS = [
  {
    slug: "mini-fataya",
    name: "Box de 15",
    price: 1_400,
    compareAtPrice: 2_250,
    composition: "15 mini-fataya + 1 sauce au choix",
  },
  {
    slug: "nems",
    name: "Box de 15",
    price: 2_100,
    compareAtPrice: null,
    composition: "15 nems + 1 sauce",
  },
];

async function main() {
  const db = getDb();
  let inserted = 0;
  let reordered = 0;

  for (const target of TARGETS) {
    const [product] = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.slug, target.slug))
      .limit(1);

    if (!product) {
      console.log(`Produit absent, ignoré : ${target.slug}`);
      continue;
    }

    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id))
      .orderBy(asc(productVariants.sortOrder));

    const alreadyExists = variants.some((variant) => variant.quantity === 15);
    if (!alreadyExists) {
      await db.insert(productVariants).values({
        productId: product.id,
        name: target.name,
        quantity: 15,
        price: target.price,
        compareAtPrice: target.compareAtPrice,
        composition: target.composition,
        isActive: true,
        sortOrder: 2,
      });
      inserted += 1;
      console.log(`Format ajouté : ${product.name} — ${target.name}`);
    } else {
      console.log(`Format déjà présent : ${product.name} — 15 pièces`);
    }

    const refreshed = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id))
      .orderBy(asc(productVariants.quantity), asc(productVariants.sortOrder));

    for (const [index, variant] of refreshed.entries()) {
      if (variant.sortOrder !== index) {
        await db
          .update(productVariants)
          .set({ sortOrder: index, updatedAt: new Date() })
          .where(eq(productVariants.id, variant.id));
        reordered += 1;
      }
    }
  }

  if (inserted > 0 || reordered > 0) {
    await db.insert(auditLogs).values({
      actorName: "Système",
      action: "MISE_A_JOUR_CATALOGUE",
      entity: "product",
      details: { inserted, reordered, formats: "10/15/25/50" },
    });
  }

  console.log(
    inserted === 0 && reordered === 0
      ? "Catalogue déjà à jour."
      : `Catalogue mis à jour : ${inserted} format(s) ajouté(s), ${reordered} ordre(s) ajusté(s).`,
  );
  await closeDb();
}

main().catch(async (error) => {
  console.error("Échec de la mise à jour du catalogue :", error);
  await closeDb();
  process.exit(1);
});
