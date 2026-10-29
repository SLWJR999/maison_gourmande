import type { OrderStatus, PaymentStatus } from "@/db/schema";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "En attente de confirmation",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  READY: "Prête",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

export const ORDER_STATUS_SHORT: Record<OrderStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  READY: "Prête",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  CONFIRMED: "bg-sky-50 text-sky-800 ring-sky-200",
  PREPARING: "bg-mauve-100 text-mauve-800 ring-mauve-200",
  READY: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  COMPLETED: "bg-brown/10 text-brown ring-brown/20",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Non encaissé",
  PARTIAL: "Partiellement encaissé",
  PAID: "Encaissé",
};

export const PAYMENT_METHODS = [
  "Espèces",
  "Mobile Money",
  "Virement",
  "Carte",
  "Autre",
] as const;

export const ORDER_CHANNEL_LABELS = {
  WHATSAPP: "Site / WhatsApp",
  ADMIN: "Hors site",
} as const;

export const OFF_SITE_CHANNELS = [
  "Sur place",
  "Téléphone",
  "WhatsApp direct",
  "Événement",
  "Autre",
] as const;

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
];
