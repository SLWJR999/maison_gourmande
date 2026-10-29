import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { reviews } from "@/db/schema";
import { getIp, rateLimit, tooManyRequests } from "@/lib/security";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2, "Indiquez votre prénom.").max(60),
  rating: z.number().int().min(1).max(5),
  message: z
    .string()
    .trim()
    .min(10, "Votre message est un peu court.")
    .max(800, "Message trop long."),
  productId: z.string().uuid().optional().nullable(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Merci d'accepter la publication de votre avis." }),
  }),
});

export async function POST(request: Request) {
  const ip = getIp(request);
  const limited = rateLimit(`review:${ip}`, 3, 60 * 60 * 1000);
  if (!limited.allowed) return tooManyRequests(limited.retryAfter);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Formulaire invalide." },
      { status: 400 },
    );
  }

  const db = getDb();
  await db.insert(reviews).values({
    customerName: parsed.data.name,
    rating: parsed.data.rating,
    message: parsed.data.message,
    productId: parsed.data.productId || null,
    status: "PENDING",
    isDemo: false,
  });

  return NextResponse.json({
    ok: true,
    message:
      "Merci ! Votre avis sera publié après validation par la maison.",
  });
}
