import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser, can } from "@/lib/auth";
import { getDb } from "@/db";
import { mediaAssets } from "@/db/schema";
import { isSameOrigin } from "@/lib/security";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_SIZE = 6 * 1024 * 1024;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origine refusée." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentification requise." },
      { status: 401 },
    );
  }
  if (!can(user.role, "media:write")) {
    return NextResponse.json({ ok: false, error: "Accès refusé." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Aucun fichier reçu." },
        { status: 400 },
      );
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Format accepté : JPG, PNG, WebP ou AVIF." },
        { status: 400 },
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, error: "Image trop lourde (6 Mo maximum)." },
        { status: 400 },
      );
    }

    const input = Buffer.from(await file.arrayBuffer());
    const sharp = (await import("sharp")).default;
    const metadata = await sharp(input).metadata();
    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { ok: false, error: "Ce fichier n'est pas une image valide." },
        { status: 400 },
      );
    }

    const uploadDir = path.resolve(
      process.cwd(),
      process.env.MEDIA_DIR || "public/uploads",
    );
    await fs.mkdir(uploadDir, { recursive: true });
    const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`;
    await sharp(input)
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 84 })
      .toFile(path.join(uploadDir, filename));

    const relative = path
      .relative(path.resolve(process.cwd(), "public"), path.join(uploadDir, filename))
      .replaceAll("\\", "/");
    const url = relative.startsWith("uploads/") ? `/${relative}` : `/api/media/${filename}`;

    const db = getDb();
    const originalName = file.name.replace(/[^\w.\- ]/g, "").slice(0, 120) || filename;
    await db.insert(mediaAssets).values({
      name: originalName,
      url,
      type: "IMAGE",
      alt: originalName.replace(/\.[^.]+$/, ""),
    });

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error("Erreur d'upload média :", error);
    return NextResponse.json(
      { ok: false, error: "Téléversement impossible. Réessayez." },
      { status: 500 },
    );
  }
}
