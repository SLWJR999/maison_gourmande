import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb } from "@/db";
import { auditLogs, users, type UserRole } from "@/db/schema";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/session";

export type Permission =
  | "dashboard:view"
  | "orders:read"
  | "orders:write"
  | "products:read"
  | "products:write"
  | "promotions:read"
  | "promotions:write"
  | "customers:read"
  | "customers:write"
  | "events:read"
  | "events:write"
  | "reviews:read"
  | "reviews:write"
  | "content:write"
  | "expenses:read"
  | "expenses:write"
  | "reports:read"
  | "media:write"
  | "settings:write"
  | "team:manage"
  | "audit:read";

const ROLE_PERMISSIONS: Record<UserRole, Permission[] | "*"> = {
  SUPER_ADMIN: "*",
  MANAGER: [
    "dashboard:view",
    "orders:read",
    "orders:write",
    "products:read",
    "products:write",
    "promotions:read",
    "promotions:write",
    "customers:read",
    "customers:write",
    "events:read",
    "events:write",
    "reviews:read",
    "reviews:write",
    "content:write",
    "expenses:read",
    "expenses:write",
    "reports:read",
    "media:write",
    "settings:write",
  ],
  STAFF: [
    "dashboard:view",
    "orders:read",
    "orders:write",
    "customers:read",
    "events:read",
    "reviews:read",
  ],
};

export function can(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions === "*" || permissions.includes(permission);
}

export function getPermissions(role: UserRole): Permission[] {
  const permissions = ROLE_PERMISSIONS[role];
  if (permissions === "*") {
    return [
      "dashboard:view",
      "orders:read",
      "orders:write",
      "products:read",
      "products:write",
      "promotions:read",
      "promotions:write",
      "customers:read",
      "customers:write",
      "events:read",
      "events:write",
      "reviews:read",
      "reviews:write",
      "content:write",
      "expenses:read",
      "expenses:write",
      "reports:read",
      "media:write",
      "settings:write",
      "team:manage",
      "audit:read",
    ];
  }
  return permissions;
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) return null;

  try {
    const db = getDb();
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, session.sub))
      .limit(1);
    if (!user || !user.isActive) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.error("Erreur de vérification de session :", error);
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    redirect("/admin?acces=refuse");
  }
  return user;
}

export async function setSessionCookie(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}) {
  const token = await createSessionToken({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });
}

/* ------------------------- Connexion & limitation ------------------------- */

const attempts = new Map<string, { count: number; windowStart: number; blockedUntil?: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;

function getAttemptKey(email: string, ip: string) {
  return `${email.toLowerCase()}::${ip}`;
}

export function getRequestIp(requestHeaders: Headers): string {
  const forwarded = requestHeaders.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return requestHeaders.get("x-real-ip") || "local";
}

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string };

export async function loginWithCredentials(
  emailInput: string,
  password: string,
): Promise<LoginResult> {
  const email = emailInput.trim().toLowerCase();
  const requestHeaders = await headers();
  const ip = getRequestIp(requestHeaders);
  const key = getAttemptKey(email, ip);
  const now = Date.now();
  const entry = attempts.get(key);

  if (entry?.blockedUntil && entry.blockedUntil > now) {
    return {
      ok: false,
      error: "Trop de tentatives. Réessayez dans quelques minutes.",
    };
  }

  if (!email || !password) {
    return { ok: false, error: "Renseignez votre e-mail et votre mot de passe." };
  }

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const valid = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !valid || !user.isActive) {
    const current =
      entry && now - entry.windowStart < WINDOW_MS
        ? entry
        : { count: 0, windowStart: now };
    current.count += 1;
    if (current.count >= MAX_ATTEMPTS) {
      current.blockedUntil = now + BLOCK_MS;
    }
    attempts.set(key, current);
    await db.insert(auditLogs).values({
      actorName: email || "Inconnu",
      action: "Connexion refusée",
      entity: "auth",
      ip,
    });
    return {
      ok: false,
      error: "Identifiants incorrects ou compte désactivé.",
    };
  }

  attempts.delete(key);
  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));
  await db.insert(auditLogs).values({
    actorId: user.id,
    actorName: user.name,
    action: "Connexion réussie",
    entity: "auth",
    entityId: user.id,
    ip,
  });
  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  return { ok: true };
}

export async function logAudit(input: {
  actor: SessionUser | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
}) {
  try {
    const requestHeaders = await headers();
    const db = getDb();
    await db.insert(auditLogs).values({
      actorId: input.actor?.id ?? null,
      actorName: input.actor?.name ?? "Système",
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      details: input.details,
      ip: getRequestIp(requestHeaders),
    });
  } catch (error) {
    console.error("Journal d'audit indisponible :", error);
  }
}

export async function verifyAdminApi(): Promise<
  { ok: true; user: SessionUser } | { ok: false; status: number; error: string }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, status: 401, error: "Authentification requise." };
  }
  return { ok: true, user };
}
