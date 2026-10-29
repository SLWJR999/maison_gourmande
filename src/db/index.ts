import fs from "node:fs";
import path from "node:path";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

type DbGlobals = {
  __maisonGourmandeDb?: Database;
  __maisonGourmandePglite?: PGlite;
  __maisonGourmandePool?: Pool;
};

const globals = globalThis as unknown as DbGlobals;

/**
 * En production, DATABASE_URL pointe vers PostgreSQL.
 * En développement, si DATABASE_URL est vide, PGlite démarre une base
 * PostgreSQL embarquée dans .data/pgdata (aucun service à installer).
 */
export function getDb(): Database {
  if (globals.__maisonGourmandeDb) return globals.__maisonGourmandeDb;

  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    const pool = new Pool({
      connectionString: databaseUrl,
      max: Number.parseInt(process.env.DATABASE_POOL_MAX || "10", 10),
    });
    globals.__maisonGourmandePool = pool;
    const db = drizzleNode(pool, { schema });
    globals.__maisonGourmandeDb = db;
    return db;
  }

  const dataDir = path.resolve(
    process.cwd(),
    process.env.PGLITE_DIR || ".data/pgdata",
  );
  fs.mkdirSync(path.dirname(dataDir), { recursive: true });
  const pglite = new PGlite(dataDir);
  globals.__maisonGourmandePglite = pglite;
  const db = drizzlePglite(pglite, { schema }) as unknown as Database;
  globals.__maisonGourmandeDb = db;
  return db;
}

export async function closeDb() {
  if (globals.__maisonGourmandePool) {
    await globals.__maisonGourmandePool.end();
    globals.__maisonGourmandePool = undefined;
  }
  if (globals.__maisonGourmandePglite) {
    await globals.__maisonGourmandePglite.close();
    globals.__maisonGourmandePglite = undefined;
  }
  globals.__maisonGourmandeDb = undefined;
}

export function isEmbeddedDatabase() {
  return !process.env.DATABASE_URL?.trim();
}

export { schema };
