import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { eventRequests } from "@/db/schema";
import { logAudit } from "@/lib/auth";
import { getSettings, getWhatsAppNumber } from "@/lib/settings";
import { getIp, rateLimit, tooManyRequests } from "@/lib/security";
import { buildWhatsAppLink } from "@/lib/checkout";
import { formatDate, formatFCFA, normalizeWhatsApp } from "@/lib/utils";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom.").max(80),
  phone: z.string().trim().min(8, "Indiquez un téléphone.").max(30),
  email: z
    .union([z.literal(""), z.string().trim().email("E-mail invalide.")])
    .optional()
    .default(""),
  eventType: z.string().trim().min(2).max(60),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choisissez une date.")
    .refine((value) => {
      const date = new Date(`${value}T12:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return !Number.isNaN(date.getTime()) && date >= today;
    }, "La date doit être à venir."),
  eventTime: z.string().trim().max(10).optional().default(""),
  peopleCount: z.number().int().min(1).max(5000),
  location: z.string().trim().min(3, "Indiquez le lieu.").max(200),
  budget: z.number().int().min(0).max(50_000_000),
  products: z
    .array(
      z.object({
        productId: z.string().uuid().nullable().optional(),
        name: z.string().trim().min(1).max(120),
        quantity: z.number().int().min(1).max(2000),
      }),
    )
    .max(25)
    .optional()
    .default([]),
  notes: z.string().trim().max(1500).optional().default(""),
});

function eventReference(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let suffix = "";
  for (let i = 0; i < 7; i++) suffix += alphabet[crypto.randomInt(alphabet.length)];
  return `EVT-${suffix}`;
}

export async function POST(request: Request) {
  const ip = getIp(request);
  const limited = rateLimit(`event:${ip}`, 3, 60 * 60 * 1000);
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

  const data = parsed.data;
  const db = getDb();
  const reference = eventReference();
  const phone = normalizeWhatsApp(data.phone) ? `+${normalizeWhatsApp(data.phone)}` : data.phone;

  const [created] = await db
    .insert(eventRequests)
    .values({
      reference,
      name: data.name,
      phone,
      email: data.email,
      eventType: data.eventType,
      eventDate: data.eventDate,
      eventTime: data.eventTime,
      peopleCount: data.peopleCount,
      location: data.location,
      budget: data.budget,
      products: data.products.map((product) => ({
        productId: product.productId ?? null,
        name: product.name,
        quantity: product.quantity,
      })),
      notes: data.notes,
      status: "NEW",
      isDemo: false,
    })
    .returning();

  await logAudit({
    actor: null,
    action: "Nouvelle demande de devis événement",
    entity: "event_request",
    entityId: created.id,
    details: {
      reference,
      evenement: data.eventType,
      personnes: data.peopleCount,
      budget: data.budget,
    },
  });

  const settings = await getSettings();
  const productsText = data.products.length
    ? data.products
        .map((product) => `• ${product.quantity} × ${product.name}`)
        .join("\n")
    : "À définir avec la boutique";
  const message = [
    `${settings.whatsappGreeting} 👋`,
    "",
    `Nouvelle demande de devis *${reference}* depuis le site.`,
    "",
    `Type d'événement : ${data.eventType}`,
    `Date : ${formatDate(`${data.eventDate}T12:00:00`)}${data.eventTime ? ` à ${data.eventTime}` : ""}`,
    `Nombre de personnes : ${data.peopleCount}`,
    `Lieu : ${data.location}`,
    `Budget envisagé : ${data.budget > 0 ? formatFCFA(data.budget) : "À discuter"}`,
    "",
    "*Produits souhaités*",
    productsText,
    "",
    data.notes ? `Notes : ${data.notes}` : "",
    "",
    `Nom : ${data.name}`,
    `Téléphone : ${data.phone}`,
    data.email ? `E-mail : ${data.email}` : "",
    "",
    "Merci de me recontacter pour finaliser le devis. À bientôt !",
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappUrl = buildWhatsAppLink(getWhatsAppNumber(settings), message);

  return NextResponse.json(
    {
      ok: true,
      reference,
      whatsappUrl,
      message:
        "Votre demande est enregistrée. La maison vous recontacte sous 24 h ouvrées.",
    },
    { status: 201 },
  );
}
