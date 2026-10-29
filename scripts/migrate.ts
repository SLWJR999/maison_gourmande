import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

config({ path: ".env.local" });
config({ path: ".env" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const migrationsFolder = path.resolve(__dirname, "..", "drizzle");

  if (databaseUrl) {
    const { getDb, closeDb } = await import("../src/db/index");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    console.log("Migration PostgreSQL distante…");
    await migrate(getDb(), { migrationsFolder });
    await closeDb();
  } else {
    console.log("Migration de la base PostgreSQL embarquée (PGlite)…");
    const { getDb, closeDb } = await import("../src/db/index");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(getDb() as never, { migrationsFolder });
    await closeDb();
  }
  console.log("Migrations appliquées.");
}

main().catch((error) => {
  console.error("Échec des migrations :", error);
  process.exit(1);
});
