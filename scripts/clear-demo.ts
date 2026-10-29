import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../src/db";
import {
  auditLogs,
  customers,
  eventRequests,
  expenses,
  orders,
  reviews,
} from "../src/db/schema";

/**
 * Supprime uniquement les données de démonstration transactionnelles :
 * commandes, clients, événements, avis et dépenses marqués isDemo.
 *
 * Le catalogue, les promotions, les bannières, les médias, les paramètres et
 * les comptes administrateurs sont conservés. Utile après un seed de
 * démonstration avant la mise en production.
 */

async function main() {
  const db = getDb();

  const deletedOrders = await db
    .delete(orders)
    .where(eq(orders.isDemo, true))
    .returning({ id: orders.id });
  const deletedCustomers = await db
    .delete(customers)
    .where(eq(customers.isDemo, true))
    .returning({ id: customers.id });
  const deletedEvents = await db
    .delete(eventRequests)
    .where(eq(eventRequests.isDemo, true))
    .returning({ id: eventRequests.id });
  const deletedReviews = await db
    .delete(reviews)
    .where(eq(reviews.isDemo, true))
    .returning({ id: reviews.id });
  const deletedExpenses = await db
    .delete(expenses)
    .where(eq(expenses.isDemo, true))
    .returning({ id: expenses.id });

  const total =
    deletedOrders.length +
    deletedCustomers.length +
    deletedEvents.length +
    deletedReviews.length +
    deletedExpenses.length;

  if (total > 0) {
    await db.insert(auditLogs).values({
      actorName: "Système",
      action: "SUPPRESSION_DEMO",
      entity: "database",
      details: {
        orders: deletedOrders.length,
        customers: deletedCustomers.length,
        events: deletedEvents.length,
        reviews: deletedReviews.length,
        expenses: deletedExpenses.length,
      },
    });
  }

  console.log("──────────────────────────────────────────────────────────────");
  console.log("Données de démonstration supprimées.");
  console.log(`Commandes : ${deletedOrders.length}`);
  console.log(`Clients : ${deletedCustomers.length}`);
  console.log(`Événements : ${deletedEvents.length}`);
  console.log(`Avis : ${deletedReviews.length}`);
  console.log(`Dépenses : ${deletedExpenses.length}`);
  console.log("Le catalogue, les promotions et les paramètres sont conservés.");
  console.log("──────────────────────────────────────────────────────────────");

  await closeDb();
}

main().catch(async (error) => {
  console.error("Échec de la suppression des données de démonstration :", error);
  await closeDb();
  process.exit(1);
});
