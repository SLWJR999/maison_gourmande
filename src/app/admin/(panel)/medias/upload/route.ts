import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getDb } from "@/db";
import { mediaAssets } from "@/db/schema";
import { can, getCurrentUser, logAudit } from "@/lib/auth";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_BYTES = 8 * 1024 * 1024;

function back(request: Request, message: string, error = false) {
  const url = new URL("/admin/medias", request.url);
  url.searchParams.set(error ? "error" : "ok", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "media:write")) {
    return new NextResponse("Non autorisé", { status: 401 });
  }
  const formData = await request.formData();
  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "").trim().slice(0, 180);
  if (!(file instanceof File)) return back(request, "Aucun fichier reçu.", true);
  if (!ALLOWED.has(file.type)) {
    return back(request, "Format accepté : JPEG, PNG, WebP ou AVIF.", true);
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return back(request, "Le fichier doit peser moins de 8 Mo.", true);
  }

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(input).metadata();
    if (!metadata.width || !metadata.height) {
      return back(request, "Image illisible.", true);
    }
    const base = path
      .parse(file.name)
      .name.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "image";
    const filename = `${base}-${crypto.randomUUID().slice(0, 8)}.webp`;
    const directory = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(directory, { recursive: true });
    await sharp(input)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(path.join(directory, filename));

    await getDb().insert(mediaAssets).values({
      name: file.name.slice(0, 160),
      url: `/uploads/${filename}`,
      type: "IMAGE",
      alt,
    });
    await logAudit({
      actor: user,
      action: "Média téléversé",
      entity: "media",
      entityId: filename,
      details: { original: file.name, optimized: `/uploads/${filename}` },
    });
    return back(request, "Image optimisée en WebP et ajoutée à la médiathèque.");
  } catch (error) {
    console.error("Upload média impossible :", error);
    return back(request, "Impossible de traiter cette image.", true);
  }
}
