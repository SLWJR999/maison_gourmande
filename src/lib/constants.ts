import type {
  EventStatus,
  OrderStatus,
  PaymentStatus,
  PromotionType,
  ReviewStatus,
  UserRole,
} from "@/db/schema";

export const SITE_TIME_ZONE = "Africa/Dakar";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  READY: "Prête",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  PENDING: "Commande enregistrée, en attente de validation par la boutique.",
  CONFIRMED: "Commande validée après échange avec la boutique.",
  PREPARING: "La cuisine prépare votre commande.",
  READY: "Commande prête pour retrait ou livraison.",
  COMPLETED: "Commande remise au client.",
  CANCELLED: "Commande annulée. Elle n'entre pas dans les statistiques.",
};

export const ORDER_STATUS_TONES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  CONFIRMED: "bg-mauve-100 text-mauve-800 ring-mauve-200",
  PREPARING: "bg-sky-50 text-sky-800 ring-sky-200",
  READY: "bg-teal-50 text-teal-800 ring-teal-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Non encaissé",
  PARTIAL: "Partiellement encaissé",
  PAID: "Encaissé",
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, string> = {
  UNPAID: "bg-stone-100 text-stone-700 ring-stone-200",
  PARTIAL: "bg-amber-50 text-amber-800 ring-amber-200",
  PAID: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

export const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  PERCENT: "Pourcentage",
  FIXED: "Montant fixe",
  FREE_DELIVERY: "Livraison offerte",
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  QUOTED: "Devis envoyé",
  CONFIRMED: "Confirmé",
  DECLINED: "Décliné",
  ARCHIVED: "Archivé",
};

export const EVENT_STATUS_TONES: Record<EventStatus, string> = {
  NEW: "bg-amber-50 text-amber-800 ring-amber-200",
  CONTACTED: "bg-sky-50 text-sky-800 ring-sky-200",
  QUOTED: "bg-mauve-100 text-mauve-800 ring-mauve-200",
  CONFIRMED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  DECLINED: "bg-red-50 text-red-700 ring-red-200",
  ARCHIVED: "bg-stone-100 text-stone-600 ring-stone-200",
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  PENDING: "En attente",
  APPROVED: "Publié",
  REJECTED: "Refusé",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super administratrice",
  MANAGER: "Gérante",
  STAFF: "Équipe",
};

export const REVENUE_ORDER_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
];

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
];

export const WEEKDAY_LABELS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export const EXPENSE_CATEGORIES = [
  "Ingrédients",
  "Emballages",
  "Livraison",
  "Équipement",
  "Marketing",
  "Salaires",
  "Charges",
  "Autre",
];

export const EVENT_TYPES = [
  "Anniversaire",
  "Mariage",
  "Baptême",
  "Événement d'entreprise",
  "Remise de diplôme",
  "Réception familiale",
  "Autre",
];
