import { NextResponse } from "next/server";
import { z } from "zod";
import { priceCheckout } from "@/lib/checkout";
import { getIp, rateLimit, tooManyRequests } from "@/lib/security";

export const runtime = "nodejs";

const schema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
        optionIds: z.array(z.string().uuid()).max(8).default([]),
      }),
    )
    .min(1)
    .max(30),
  promoCode: z.string().max(50).optional().default(""),
  deliveryMode: z.enum(["DELIVERY", "PICKUP"]),
  phone: z.string().max(30).optional().default(""),
});

export async function POST(request: Request) {
  const ip = getIp(request);
  const limited = rateLimit(`preview:${ip}`, 80, 10 * 60 * 1000);
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Le panier contient des données invalides." },
      { status: 400 },
    );
  }

  try {
    const result = await priceCheckout({
      items: parsed.data.items,
      promoCode: parsed.data.promoCode,
      deliveryMode: parsed.data.deliveryMode,
      phone: parsed.data.phone,
    });
    return NextResponse.json({
      ok: true,
      pricing: {
        subtotal: result.pricing.subtotal,
        totalPieces: result.pricing.totalPieces,
        quantityDiscount: result.pricing.quantityDiscount,
        promotionDiscount: result.pricing.promotionDiscount,
        deliveryFee: result.pricing.deliveryFee,
        deliveryFeeBeforeDiscount: result.pricing.deliveryFeeBeforeDiscount,
        discountTotal: result.pricing.discountTotal,
        total: result.pricing.total,
        appliedPromotion: result.pricing.appliedPromotion,
        promoCode: result.pricing.promoCode,
        promoMessage: result.pricing.promoMessage,
        warning: result.pricing.warning,
      },
      settings: {
        quantityDiscountThreshold: Number(
          result.settings.quantityDiscountThreshold || "50",
        ),
        quantityDiscountPercent: Number(
          result.settings.quantityDiscountPercent || "5",
        ),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de calculer le panier.";
    const status =
      typeof (error as { status?: unknown })?.status === "number"
        ? (error as { status: number }).status
        : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
