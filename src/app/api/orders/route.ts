import { NextResponse } from "next/server";
import { z } from "zod";
import {
  CheckoutError,
  checkoutPayloadSchema,
  createOrder,
} from "@/lib/checkout";
import { getIp, rateLimit, tooManyRequests } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getIp(request);
  const limited = rateLimit(`order:${ip}`, 6, 15 * 60 * 1000);
  if (!limited.allowed) return tooManyRequests(limited.retryAfter);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Requête invalide." },
      { status: 400 },
    );
  }

  const parsed = checkoutPayloadSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      {
        ok: false,
        error: firstError?.message || "Vérifiez les informations de la commande.",
        field: firstError?.path?.[0] ?? null,
      },
      { status: 400 },
    );
  }

  try {
    const result = await createOrder(parsed.data);
    return NextResponse.json(
      { ok: true, ...result },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: error.status },
      );
    }
    console.error("Erreur de création de commande :", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "La commande n'a pas pu être enregistrée. Réessayez dans quelques instants.",
      },
      { status: 500 },
    );
  }
}
