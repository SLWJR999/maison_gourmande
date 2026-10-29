import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../src/db";
import { auditLogs, users, type UserRole } from "../src/db/schema";

/**
 * Crée le premier compte SUPER_ADMIN, ou réinitialise son mot de passe si le
 * compte existe déjà. Aucune donnée de démonstration n'est créée.
 *
 * Utilisation :
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:create-admin
 *
 * Si ADMIN_PASSWORD est omis, un mot de passe aléatoire est généré et affiché
 * une seule fois. Le mot de passe n'est jamais écrit dans le code ni en base
 * en clair.
 */

function readRole(value: string | undefined): UserRole {
  if (value === "MANAGER" || value === "STAFF") return value;
  return "SUPER_ADMIN";
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const name = (process.env.ADMIN_NAME || "Administrateur Maison Gourmande").trim();
  const role = readRole(process.env.ADMIN_ROLE);

  if (!validEmail(email)) {
    throw new Error(
      "ADMIN_EMAIL manquant ou invalide. Exemple : ADMIN_EMAIL=gerante@maison-gourmande.sn",
    );
  }
  if (name.length < 2) {
    throw new Error("ADMIN_NAME doit contenir au moins 2 caractères.");
  }

  let password = process.env.ADMIN_PASSWORD;
  let generated = false;
  if (!password) {
    password = crypto.randomBytes(18).toString("base64url");
    generated = true;
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD doit contenir au moins 12 caractères.");
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    await db
      .update(users)
      .set({
        name,
        passwordHash,
        role,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
  } else {
    await db.insert(users).values({
      name,
      email,
      passwordHash,
      role,
      isActive: true,
    });
  }

  await db.insert(auditLogs).values({
    actorName: "Système",
    action: existing ? "ROTATION_ADMIN" : "CREATION_ADMIN",
    entity: "user",
    entityId: existing?.id ?? null,
    details: { email, role, via: "scripts/create-admin.ts" },
  });

  console.log("──────────────────────────────────────────────────────────────");
  console.log(existing ? "Compte administrateur mis à jour." : "Compte administrateur créé.");
  console.log(`E-mail : ${email}`);
  console.log(`Rôle   : ${role}`);
  if (generated) {
    console.log("Mot de passe généré (à conserver maintenant, il ne sera plus affiché) :");
    console.log(password);
  } else {
    console.log("Mot de passe : celui fourni dans ADMIN_PASSWORD.");
  }
  console.log("Connectez-vous sur /admin puis changez le mot de passe dans Équipe.");
  console.log("──────────────────────────────────────────────────────────────");

  await closeDb();
}

main().catch(async (error) => {
  console.error("Échec de la création du compte administrateur :", error);
  await closeDb();
  process.exit(1);
});
