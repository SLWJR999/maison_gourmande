import { config } from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

config({ path: ".env.local" });
config({ path: ".env" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(
  __dirname,
  "..",
  process.env.PGLITE_DIR || ".data/pgdata",
);

async function main() {
  if (process.env.DATABASE_URL?.trim()) {
    console.error(
      "Refus : DATABASE_URL est définie. Cette commande ne supprime que la base locale PGlite.",
    );
    process.exit(1);
  }
  if (!dataDir.includes(".data")) {
    console.error("Refus : répertoire de données inattendu.", dataDir);
    process.exit(1);
  }
  try {
    await fs.rm(dataDir, { recursive: true, force: true });
    console.log("Base locale supprimée :", dataDir);
    console.log("Relancez npm run db:setup pour recréer et alimenter la base.");
  } catch (error) {
    console.error("Impossible de supprimer la base locale :", error);
    process.exit(1);
  }
}

main();
