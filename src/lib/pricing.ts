import type { CartOption } from "@/lib/cart";
import { SITE_TIME_ZONE } from "@/lib/constants";

export type PriceLine = {
  lineKey: string;
  productId: string;
  categoryId: string;
  variantId: string;
  productName: string;
  variantName: string;
  imageUrl: string;
  unitPrice: number;
  costPrice: number;
  pieceCount: number;
  quantity: number;
  options: CartOption[];
};

export type PromotionType = "PERCENT" | "FIXED" | "FREE_DELIVERY";

export type PromotionRule = {
  id: string;
  name: string;
  code: string | null;
  type: PromotionType;
  value: number;
  minSubtotal: number;
  minItems: number;
  daysOfWeek: number[];
  startTime: string | null;
  endTime: string | null;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  maxRedemptions: number | null;
  maxPerCustomer: number | null;
  scopeType: "ALL" | "CATEGORIES" | "PRODUCTS";
  scopeCategoryIds: string[];
  scopeProductIds: string[];
  redemptionCount: number;
  loyaltyMinOrders: number;
  isAutomatic: boolean;
  isActive: boolean;
};

export type PricingSettings = {
  deliveryFee: number;
  quantityDiscountThreshold: number;
  quantityDiscountPercent: number;
};

export type PricingInput = {
  lines: PriceLine[];
  deliveryMode: "DELIVERY" | "PICKUP";
  promoCode?: string | null;
  settings: PricingSettings;
  promotions: PromotionRule[];
  now: Date;
  validatedOrders?: number;
  customerPromotionCounts?: Record<string, number>;
};

export type AppliedPromotion = {
  id: string;
  name: string;
  code: string | null;
  type: PromotionType;
  benefit: number;
};

export type PricingResult = {
  subtotal: number;
  totalPieces: number;
  quantityDiscount: number;
  promotionDiscount: number;
  deliveryFee: number;
  deliveryFeeBeforeDiscount: number;
  discountTotal: number;
  total: number;
  appliedPromotion: AppliedPromotion | null;
  promoCode: string | null;
  promoMessage: string | null;
  warning: string | null;
  lineTotals: Array<{ lineKey: string; total: number }>;
};

export function lineBaseTotal(line: PriceLine): number {
  const optionsTotal = line.options.reduce((sum, option) => sum + option.price, 0);
  return (line.unitPrice + optionsTotal) * line.quantity;
}

export function linePieces(line: PriceLine): number {
  return line.pieceCount * line.quantity;
}

export function getSiteClockParts(now: Date): {
  weekday: number;
  minutes: number;
  dateKey: string;
} {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: SITE_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const weekdayMap: Record<string, number> = {
    "dim.": 0,
    "lun.": 1,
    "mar.": 2,
    "mer.": 3,
    "jeu.": 4,
    "ven.": 5,
    "sam.": 6,
    dim: 0,
    lun: 1,
    mar: 2,
    mer: 3,
    jeu: 4,
    ven: 5,
    sam: 6,
  };
  const weekdayLabel = get("weekday").toLowerCase();
  const weekday = weekdayMap[weekdayLabel] ?? now.getUTCDay();
  const hours = Number.parseInt(get("hour"), 10) || 0;
  const minutes = hours * 60 + (Number.parseInt(get("minute"), 10) || 0);
  const dateKey = `${get("year")}-${get("month")}-${get("day")}`;

  return { weekday, minutes, dateKey };
}

function parseTimeToMinutes(value: string | null): number | null {
  if (!value) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10);
}

function isWithinTimeWindow(
  minutes: number,
  startTime: string | null,
  endTime: string | null,
): boolean {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null && end === null) return true;
  if (start !== null && end === null) return minutes >= start;
  if (start === null && end !== null) return minutes <= end;
  if (start === null || end === null) return true;
  if (start <= end) return minutes >= start && minutes <= end;
  return minutes >= start || minutes <= end;
}

function toDate(value: Date | string | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export type PromotionEvaluation =
  | { eligible: true; benefit: number; reason: null }
  | { eligible: false; benefit: 0; reason: string };

export function evaluatePromotion(
  promotion: PromotionRule,
  context: {
    subtotal: number;
    totalPieces: number;
    deliveryMode: "DELIVERY" | "PICKUP";
    deliveryFee: number;
    now: Date;
    validatedOrders: number;
    customerPromotionCount?: number;
  },
): PromotionEvaluation {
  if (!promotion.isActive) {
    return { eligible: false, benefit: 0, reason: "Promotion inactive" };
  }

  const { weekday, minutes } = getSiteClockParts(context.now);
  if (
    promotion.daysOfWeek.length > 0 &&
    !promotion.daysOfWeek.includes(weekday)
  ) {
    return {
      eligible: false,
      benefit: 0,
      reason: "Offre non disponible ce jour",
    };
  }

  if (!isWithinTimeWindow(minutes, promotion.startTime, promotion.endTime)) {
    return { eligible: false, benefit: 0, reason: "Hors des horaires de l'offre" };
  }

  const startsAt = toDate(promotion.startsAt);
  if (startsAt && context.now < startsAt) {
    return { eligible: false, benefit: 0, reason: "Offre pas encore commencée" };
  }
  const endsAt = toDate(promotion.endsAt);
  if (endsAt && context.now > endsAt) {
    return { eligible: false, benefit: 0, reason: "Offre expirée" };
  }

  if (promotion.scopeType !== "ALL" && context.subtotal <= 0) {
    return {
      eligible: false,
      benefit: 0,
      reason: "Aucun produit éligible dans le panier",
    };
  }
  if (context.subtotal < promotion.minSubtotal) {
    return {
      eligible: false,
      benefit: 0,
      reason: "Montant minimum non atteint",
    };
  }
  if (context.totalPieces < promotion.minItems) {
    return {
      eligible: false,
      benefit: 0,
      reason: "Nombre d'articles minimum non atteint",
    };
  }
  if (
    promotion.maxRedemptions !== null &&
    promotion.redemptionCount >= promotion.maxRedemptions
  ) {
    return {
      eligible: false,
      benefit: 0,
      reason: "Nombre maximum d'utilisations atteint",
    };
  }
  if (
    promotion.maxPerCustomer !== null &&
    (context.customerPromotionCount ?? 0) >= promotion.maxPerCustomer
  ) {
    return {
      eligible: false,
      benefit: 0,
      reason: "Nombre maximum d'utilisations atteint pour ce client",
    };
  }
  if (
    promotion.loyaltyMinOrders > 0 &&
    context.validatedOrders < promotion.loyaltyMinOrders
  ) {
    return {
      eligible: false,
      benefit: 0,
      reason: "Offre réservée aux clients fidèles",
    };
  }

  if (promotion.type === "FREE_DELIVERY") {
    if (context.deliveryMode !== "DELIVERY") {
      return {
        eligible: false,
        benefit: 0,
        reason: "Offre valable en livraison uniquement",
      };
    }
    if (context.deliveryFee <= 0) {
      return { eligible: false, benefit: 0, reason: "Livraison déjà offerte" };
    }
    return { eligible: true, benefit: context.deliveryFee, reason: null };
  }

  let benefit = 0;
  if (promotion.type === "PERCENT") {
    benefit = Math.round((context.subtotal * promotion.value) / 100);
  } else {
    benefit = promotion.value;
  }
  benefit = Math.max(0, Math.min(benefit, context.subtotal));
  if (benefit <= 0) {
    return { eligible: false, benefit: 0, reason: "Aucun avantage calculable" };
  }
  return { eligible: true, benefit, reason: null };
}

export function normalizePromoCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase().replace(/\s+/g, "");
  return normalized ? normalized : null;
}

export function calculatePricing(input: PricingInput): PricingResult {
  const subtotal = input.lines.reduce((sum, line) => sum + lineBaseTotal(line), 0);
  const totalPieces = input.lines.reduce((sum, line) => sum + linePieces(line), 0);
  const quantityDiscountThreshold = Math.max(
    0,
    input.settings.quantityDiscountThreshold,
  );
  const quantityDiscountPercent = Math.max(
    0,
    Math.min(100, input.settings.quantityDiscountPercent),
  );
  const quantityDiscount =
    quantityDiscountThreshold > 0 &&
    totalPieces >= quantityDiscountThreshold &&
    quantityDiscountPercent > 0
      ? Math.round((subtotal * quantityDiscountPercent) / 100)
      : 0;

  const configuredDeliveryFee =
    input.deliveryMode === "DELIVERY" ? Math.max(0, input.settings.deliveryFee) : 0;
  const requestedCode = normalizePromoCode(input.promoCode);
  const validatedOrders = Math.max(0, input.validatedOrders ?? 0);

  const promotionContext = (promotion: PromotionRule) => {
    let scopedLines = input.lines;
    if (promotion.scopeType === "CATEGORIES") {
      const allowed = new Set(promotion.scopeCategoryIds);
      scopedLines = input.lines.filter((line) => allowed.has(line.categoryId));
    } else if (promotion.scopeType === "PRODUCTS") {
      const allowed = new Set(promotion.scopeProductIds);
      scopedLines = input.lines.filter((line) => allowed.has(line.productId));
    }
    const scopedSubtotal = scopedLines.reduce(
      (sum, line) => sum + lineBaseTotal(line),
      0,
    );
    const scopedPieces = scopedLines.reduce(
      (sum, line) => sum + linePieces(line),
      0,
    );
    return {
      subtotal: scopedSubtotal,
      totalPieces: scopedPieces,
      deliveryMode: input.deliveryMode,
      deliveryFee: configuredDeliveryFee,
      now: input.now,
      validatedOrders,
      customerPromotionCount:
        input.customerPromotionCounts?.[promotion.id] ?? 0,
    };
  };

  const autoPromotions = input.promotions.filter(
    (promotion) => promotion.isAutomatic && !promotion.code,
  );
  const codePromotions = requestedCode
    ? input.promotions.filter(
        (promotion) => promotion.code && normalizePromoCode(promotion.code) === requestedCode,
      )
    : [];

  const evaluated: Array<{
    promotion: PromotionRule;
    benefit: number;
    fromCode: boolean;
  }> = [];

  const consider = (promotion: PromotionRule, fromCode: boolean) => {
    const result = evaluatePromotion(promotion, promotionContext(promotion));
    if (result.eligible) {
      evaluated.push({ promotion, benefit: result.benefit, fromCode });
    }
  };

  autoPromotions.forEach((promotion) => consider(promotion, false));
  codePromotions.forEach((promotion) => consider(promotion, true));

  evaluated.sort((a, b) => {
    if (b.benefit !== a.benefit) return b.benefit - a.benefit;
    if (a.fromCode !== b.fromCode) return a.fromCode ? -1 : 1;
    return a.promotion.name.localeCompare(b.promotion.name);
  });

  const best = evaluated[0] ?? null;
  const appliedPromotion: AppliedPromotion | null = best
    ? {
        id: best.promotion.id,
        name: best.promotion.name,
        code: best.promotion.code,
        type: best.promotion.type,
        benefit: best.benefit,
      }
    : null;

  const isFreeDelivery = best?.promotion.type === "FREE_DELIVERY";
  const promotionDiscount = best && !isFreeDelivery ? best.benefit : 0;
  const deliveryFee = isFreeDelivery ? 0 : configuredDeliveryFee;
  const discountTotal = quantityDiscount + promotionDiscount;
  const total = Math.max(0, subtotal - discountTotal + deliveryFee);

  let warning: string | null = null;
  if (requestedCode) {
    const knownCode = input.promotions.find(
      (promotion) =>
        promotion.code &&
        normalizePromoCode(promotion.code) === requestedCode,
    );
    if (!knownCode) {
      warning = "Ce code promo n'existe pas ou n'est plus actif.";
    } else {
      const result = evaluatePromotion(knownCode, promotionContext(knownCode));
      if (!result.eligible) {
        warning = `Code « ${requestedCode} » non appliqué : ${result.reason.toLowerCase()}.`;
      } else if (best && best.promotion.id !== knownCode.id) {
        warning = `Le code « ${requestedCode} » est valide, mais une offre plus avantageuse a été appliquée.`;
      }
    }
  }

  const promoMessage = appliedPromotion
    ? appliedPromotion.type === "FREE_DELIVERY"
      ? `Livraison offerte grâce à « ${appliedPromotion.name} »`
      : `« ${appliedPromotion.name} » appliquée`
    : null;

  return {
    subtotal,
    totalPieces,
    quantityDiscount,
    promotionDiscount,
    deliveryFee,
    deliveryFeeBeforeDiscount: configuredDeliveryFee,
    discountTotal,
    total,
    appliedPromotion,
    promoCode: requestedCode,
    promoMessage,
    warning,
    lineTotals: input.lines.map((line) => ({
      lineKey: line.lineKey,
      total: lineBaseTotal(line),
    })),
  };
}
