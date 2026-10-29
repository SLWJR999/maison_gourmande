import { describe, expect, it } from "vitest";
import type { CartOption } from "./cart";
import {
  calculatePricing,
  evaluatePromotion,
  getSiteClockParts,
  lineBaseTotal,
  linePieces,
  normalizePromoCode,
  type PriceLine,
  type PricingInput,
  type PricingSettings,
  type PromotionRule,
} from "./pricing";

const MONDAY_NOON = new Date("2026-01-05T12:00:00.000Z");

const SETTINGS: PricingSettings = {
  deliveryFee: 1_000,
  quantityDiscountThreshold: 50,
  quantityDiscountPercent: 5,
};

const NO_QUANTITY_DISCOUNT: PricingSettings = {
  deliveryFee: 1_000,
  quantityDiscountThreshold: 0,
  quantityDiscountPercent: 0,
};

function makeLine(overrides: Partial<PriceLine> = {}): PriceLine {
  return {
    lineKey: "fataya",
    productId: "product-fataya",
    categoryId: "category-fataya",
    variantId: "variant-fataya",
    productName: "Mini-fataya",
    variantName: "10 pièces",
    imageUrl: "/images/fataya.jpg",
    unitPrice: 1_000,
    costPrice: 400,
    pieceCount: 10,
    quantity: 1,
    options: [],
    ...overrides,
  };
}

function makeTacosLine(overrides: Partial<PriceLine> = {}): PriceLine {
  return makeLine({
    lineKey: "tacos",
    productId: "product-tacos",
    categoryId: "category-tacos",
    variantId: "variant-tacos",
    productName: "Tacos poulet",
    variantName: "XL",
    unitPrice: 3_000,
    costPrice: 1_200,
    pieceCount: 1,
    quantity: 2,
    ...overrides,
  });
}

function makePromotion(overrides: Partial<PromotionRule> = {}): PromotionRule {
  return {
    id: "promo-auto",
    name: "Offre automatique",
    code: null,
    type: "PERCENT",
    value: 10,
    minSubtotal: 0,
    minItems: 0,
    daysOfWeek: [],
    startTime: null,
    endTime: null,
    startsAt: null,
    endsAt: null,
    maxRedemptions: null,
    maxPerCustomer: null,
    scopeType: "ALL",
    scopeCategoryIds: [],
    scopeProductIds: [],
    redemptionCount: 0,
    loyaltyMinOrders: 0,
    isAutomatic: true,
    isActive: true,
    ...overrides,
  };
}

function makeInput(overrides: Partial<PricingInput> = {}): PricingInput {
  return {
    lines: [makeLine({ unitPrice: 10_000, quantity: 5 })],
    deliveryMode: "DELIVERY",
    promoCode: null,
    settings: SETTINGS,
    promotions: [],
    now: MONDAY_NOON,
    ...overrides,
  };
}

describe("base de calcul", () => {
  it("additionne les options et les pièces d'une ligne", () => {
    const options: CartOption[] = [
      { id: "sauce", name: "Sauce maison", price: 200 },
      { id: "fromage", name: "Fromage", price: 300 },
    ];
    const line = makeLine({ quantity: 3, pieceCount: 5, options });

    expect(lineBaseTotal(line)).toBe(4_500);
    expect(linePieces(line)).toBe(15);
  });

  it("lit l'heure de Dakar, y compris au passage de minuit UTC", () => {
    expect(getSiteClockParts(MONDAY_NOON)).toEqual({
      weekday: 1,
      minutes: 12 * 60,
      dateKey: "2026-01-05",
    });

    expect(getSiteClockParts(new Date("2026-01-05T00:30:00.000Z"))).toEqual({
      weekday: 1,
      minutes: 30,
      dateKey: "2026-01-05",
    });
  });

  it("normalise les codes promo", () => {
    expect(normalizePromoCode("  bienvenue 10 ")).toBe("BIENVENUE10");
    expect(normalizePromoCode("")).toBeNull();
    expect(normalizePromoCode(undefined)).toBeNull();
  });
});

describe("remise quantité", () => {
  it("applique 5 % dès 50 pièces et calcule la remise avant l'offre", () => {
    const result = calculatePricing(makeInput());

    expect(result.subtotal).toBe(50_000);
    expect(result.totalPieces).toBe(50);
    expect(result.quantityDiscount).toBe(2_500);
    expect(result.promotionDiscount).toBe(0);
    expect(result.deliveryFee).toBe(1_000);
    expect(result.discountTotal).toBe(2_500);
    expect(result.total).toBe(48_500);
  });

  it("n'applique pas la remise sous le seuil", () => {
    const result = calculatePricing(
      makeInput({ lines: [makeLine({ unitPrice: 10_000, quantity: 4 })] }),
    );

    expect(result.totalPieces).toBe(40);
    expect(result.quantityDiscount).toBe(0);
    expect(result.total).toBe(41_000);
  });

  it("cumule la remise quantité avec la meilleure promotion", () => {
    const result = calculatePricing(
      makeInput({
        promoCode: " gourmand 10 ",
        promotions: [
          makePromotion({
            id: "promo-code",
            name: "Gourmand 10",
            code: "GOURMAND10",
            isAutomatic: false,
          }),
        ],
      }),
    );

    expect(result.subtotal).toBe(50_000);
    expect(result.quantityDiscount).toBe(2_500);
    expect(result.promotionDiscount).toBe(5_000);
    expect(result.discountTotal).toBe(7_500);
    expect(result.deliveryFee).toBe(1_000);
    expect(result.total).toBe(43_500);
    expect(result.appliedPromotion).toMatchObject({
      id: "promo-code",
      code: "GOURMAND10",
      benefit: 5_000,
    });
    expect(result.promoCode).toBe("GOURMAND10");
    expect(result.warning).toBeNull();
  });

  it("ne remplace pas la remise quantité par la promotion", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [makePromotion({ minSubtotal: 60_000 })],
      }),
    );

    expect(result.quantityDiscount).toBe(0);
    expect(result.promotionDiscount).toBe(0);
    expect(result.total).toBe(51_000);
  });
});

describe("choix d'une seule meilleure offre", () => {
  it("retient le code saisi lorsqu'il est plus avantageux qu'une offre auto", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promoCode: "FIDELE10",
        promotions: [
          makePromotion({
            id: "auto-5",
            name: "Petite faim",
            type: "PERCENT",
            value: 5,
          }),
          makePromotion({
            id: "code-10",
            name: "Fidèle",
            code: "FIDELE10",
            type: "PERCENT",
            value: 10,
            isAutomatic: false,
          }),
        ],
      }),
    );

    expect(result.appliedPromotion?.id).toBe("code-10");
    expect(result.promotionDiscount).toBe(5_000);
    expect(result.total).toBe(46_000);
  });

  it("privilégie le code saisi en cas d'égalité", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promoCode: "EGAL",
        promotions: [
          makePromotion({
            id: "auto-egal",
            name: "Offre auto",
            type: "FIXED",
            value: 2_500,
          }),
          makePromotion({
            id: "code-egal",
            name: "Offre code",
            code: "EGAL",
            type: "FIXED",
            value: 2_500,
            isAutomatic: false,
          }),
        ],
      }),
    );

    expect(result.appliedPromotion?.id).toBe("code-egal");
    expect(result.promotionDiscount).toBe(2_500);
    expect(result.warning).toBeNull();
  });

  it("départage deux offres automatiques à égalité par ordre alphabétique", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [
          makePromotion({
            id: "z-offre",
            name: "Zêta",
            type: "FIXED",
            value: 2_500,
          }),
          makePromotion({
            id: "a-offre",
            name: "Alpha",
            type: "FIXED",
            value: 2_500,
          }),
        ],
      }),
    );

    expect(result.appliedPromotion?.id).toBe("a-offre");
    expect(result.promotionDiscount).toBe(2_500);
  });

  it("n'applique jamais deux promotions, même si les deux sont éligibles", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [
          makePromotion({ id: "auto-a", type: "FIXED", value: 2_000 }),
          makePromotion({ id: "auto-b", type: "FIXED", value: 3_000 }),
        ],
      }),
    );

    expect(result.appliedPromotion?.id).toBe("auto-b");
    expect(result.promotionDiscount).toBe(3_000);
    expect(result.discountTotal).toBe(3_000);
  });
});

describe("portée des promotions", () => {
  it("calcule une offre limitée à une catégorie sur les lignes concernées", () => {
    const result = calculatePricing(
      makeInput({
        lines: [makeLine({ unitPrice: 10_000, quantity: 5 }), makeTacosLine()],
        settings: NO_QUANTITY_DISCOUNT,
        promoCode: "TACOS20",
        promotions: [
          makePromotion({
            id: "tacos",
            name: "Tacos du lundi",
            code: "TACOS20",
            type: "PERCENT",
            value: 20,
            scopeType: "CATEGORIES",
            scopeCategoryIds: ["category-tacos"],
            isAutomatic: false,
          }),
        ],
      }),
    );

    expect(result.subtotal).toBe(56_000);
    expect(result.appliedPromotion?.benefit).toBe(1_200);
    expect(result.total).toBe(55_800);
  });

  it("calcule une offre limitée à un produit sur les lignes concernées", () => {
    const result = calculatePricing(
      makeInput({
        lines: [makeLine({ unitPrice: 10_000, quantity: 5 }), makeTacosLine()],
        settings: NO_QUANTITY_DISCOUNT,
        promoCode: "FATAYA20",
        promotions: [
          makePromotion({
            id: "fataya",
            name: "Fataya du jour",
            code: "FATAYA20",
            type: "PERCENT",
            value: 20,
            scopeType: "PRODUCTS",
            scopeProductIds: ["product-fataya"],
            isAutomatic: false,
          }),
        ],
      }),
    );

    expect(result.appliedPromotion?.benefit).toBe(10_000);
    expect(result.total).toBe(47_000);
  });

  it("refuse une livraison offerte si aucun produit de la portée n'est présent", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [
          makePromotion({
            id: "livraison-produit",
            name: "Livraison tacos",
            type: "FREE_DELIVERY",
            value: 0,
            scopeType: "PRODUCTS",
            scopeProductIds: ["product-tacos"],
          }),
        ],
      }),
    );

    expect(result.appliedPromotion).toBeNull();
    expect(result.deliveryFee).toBe(1_000);
    expect(result.deliveryFeeBeforeDiscount).toBe(1_000);
    expect(result.total).toBe(51_000);
  });

  it("respecte un montant minimum calculé sur la portée", () => {
    const result = calculatePricing(
      makeInput({
        lines: [makeLine({ quantity: 1 }), makeTacosLine()],
        settings: NO_QUANTITY_DISCOUNT,
        promoCode: "TACOSMIN",
        promotions: [
          makePromotion({
            id: "tacos-min",
            name: "Tacos minimum",
            code: "TACOSMIN",
            type: "PERCENT",
            value: 10,
            minSubtotal: 5_000,
            scopeType: "PRODUCTS",
            scopeProductIds: ["product-tacos"],
            isAutomatic: false,
          }),
        ],
      }),
    );

    expect(result.appliedPromotion?.benefit).toBe(600);
    expect(result.total).toBe(7_400);
  });
});

describe("conditions de date, jour et horaire", () => {
  it("accepte une offre dans sa période de validité", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [
          makePromotion({
            startsAt: "2026-01-04T00:00:00.000Z",
            endsAt: "2026-01-06T00:00:00.000Z",
          }),
        ],
      }),
    );

    expect(result.appliedPromotion).not.toBeNull();
  });

  it("refuse une offre pas encore commencée ou expirée", () => {
    const notStarted = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [
          makePromotion({ startsAt: "2026-01-06T00:00:00.000Z" }),
        ],
      }),
    );
    const expired = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [
          makePromotion({ endsAt: "2026-01-04T23:59:59.000Z" }),
        ],
      }),
    );

    expect(notStarted.appliedPromotion).toBeNull();
    expect(expired.appliedPromotion).toBeNull();
  });

  it("compare le jour de la semaine à Dakar", () => {
    const monday = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [makePromotion({ daysOfWeek: [1] })],
      }),
    );
    const tuesday = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [makePromotion({ daysOfWeek: [2] })],
      }),
    );

    expect(monday.appliedPromotion).not.toBeNull();
    expect(tuesday.appliedPromotion).toBeNull();
  });

  it("accepte une plage horaire classique et en refuse les bords", () => {
    const during = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [
          makePromotion({ startTime: "11:30", endTime: "14:00" }),
        ],
      }),
    );
    const boundary = calculatePricing(
      makeInput({
        now: new Date("2026-01-05T14:00:00.000Z"),
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [
          makePromotion({ startTime: "11:30", endTime: "14:00" }),
        ],
      }),
    );
    const after = calculatePricing(
      makeInput({
        now: new Date("2026-01-05T14:01:00.000Z"),
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [
          makePromotion({ startTime: "11:30", endTime: "14:00" }),
        ],
      }),
    );

    expect(during.appliedPromotion).not.toBeNull();
    expect(boundary.appliedPromotion).not.toBeNull();
    expect(after.appliedPromotion).toBeNull();
  });

  it("gère une plage horaire qui passe minuit", () => {
    const late = calculatePricing(
      makeInput({
        now: new Date("2026-01-05T23:00:00.000Z"),
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [makePromotion({ startTime: "22:00", endTime: "02:00" })],
      }),
    );
    const early = calculatePricing(
      makeInput({
        now: new Date("2026-01-06T01:00:00.000Z"),
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [makePromotion({ startTime: "22:00", endTime: "02:00" })],
      }),
    );
    const midday = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [makePromotion({ startTime: "22:00", endTime: "02:00" })],
      }),
    );

    expect(late.appliedPromotion).not.toBeNull();
    expect(early.appliedPromotion).not.toBeNull();
    expect(midday.appliedPromotion).toBeNull();
  });
});

describe("conditions de quantité, fidélité et plafonds", () => {
  it("respecte le nombre minimum de pièces", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [makePromotion({ minItems: 51 })],
      }),
    );

    expect(result.appliedPromotion).toBeNull();
  });

  it("respecte le montant minimum", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [makePromotion({ minSubtotal: 50_001 })],
      }),
    );

    expect(result.appliedPromotion).toBeNull();
  });

  it("refuse une offre dont le plafond global est atteint", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [
          makePromotion({
            maxRedemptions: 2,
            redemptionCount: 2,
            isAutomatic: false,
            code: "PLAFOND",
          }),
        ],
        promoCode: "PLAFOND",
      }),
    );

    expect(result.appliedPromotion).toBeNull();
    expect(result.warning).toContain("maximum");
  });

  it("refuse une offre dont le plafond client est atteint", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [makePromotion({ id: "promo-client", maxPerCustomer: 1 })],
        customerPromotionCounts: { "promo-client": 1 },
      }),
    );

    expect(result.appliedPromotion).toBeNull();
  });

  it("réserve une offre fidélité aux clients ayant assez de commandes validées", () => {
    const refused = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [
          makePromotion({ loyaltyMinOrders: 3, code: "FIDELE" }),
        ],
        promoCode: "FIDELE",
        validatedOrders: 2,
      }),
    );
    const accepted = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [
          makePromotion({ loyaltyMinOrders: 3, code: "FIDELE" }),
        ],
        promoCode: "FIDELE",
        validatedOrders: 3,
      }),
    );

    expect(refused.appliedPromotion).toBeNull();
    expect(refused.warning).toContain("fidèles");
    expect(accepted.appliedPromotion).not.toBeNull();
  });
});

describe("livraison offerte", () => {
  it("annule les frais de livraison sans créer de remise produit", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [
          makePromotion({
            id: "livraison",
            name: "Livraison offerte",
            type: "FREE_DELIVERY",
            value: 0,
          }),
        ],
      }),
    );

    expect(result.appliedPromotion).toMatchObject({
      id: "livraison",
      type: "FREE_DELIVERY",
      benefit: 1_000,
    });
    expect(result.promotionDiscount).toBe(0);
    expect(result.deliveryFee).toBe(0);
    expect(result.deliveryFeeBeforeDiscount).toBe(1_000);
    expect(result.total).toBe(50_000);
  });

  it("ne s'applique pas au retrait sur place", () => {
    const result = calculatePricing(
      makeInput({
        deliveryMode: "PICKUP",
        settings: NO_QUANTITY_DISCOUNT,
        promoCode: "LIVRAISON",
        promotions: [
          makePromotion({
            id: "livraison",
            name: "Livraison offerte",
            code: "LIVRAISON",
            type: "FREE_DELIVERY",
            value: 0,
            isAutomatic: false,
          }),
        ],
      }),
    );

    expect(result.appliedPromotion).toBeNull();
    expect(result.deliveryFee).toBe(0);
    expect(result.warning).toContain("livraison");
  });
});

describe("messages et avertissements", () => {
  it("avertit lorsqu'un code est inconnu", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promoCode: "INCONNU",
      }),
    );

    expect(result.appliedPromotion).toBeNull();
    expect(result.warning).toContain("n'existe pas");
  });

  it("avertit lorsqu'un code valide est moins avantageux qu'une offre auto", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promoCode: "PETIT",
        promotions: [
          makePromotion({
            id: "auto-20",
            name: "Grande offre",
            type: "PERCENT",
            value: 20,
          }),
          makePromotion({
            id: "code-5",
            name: "Petite offre",
            code: "PETIT",
            type: "PERCENT",
            value: 5,
            isAutomatic: false,
          }),
        ],
      }),
    );

    expect(result.appliedPromotion?.id).toBe("auto-20");
    expect(result.warning).toContain("plus avantageuse");
  });

  it("avertit lorsqu'un code existe mais n'est pas éligible", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promoCode: "MINIMUM",
        promotions: [
          makePromotion({
            id: "minimum",
            name: "Minimum",
            code: "MINIMUM",
            minSubtotal: 90_000,
            isAutomatic: false,
          }),
        ],
      }),
    );

    expect(result.appliedPromotion).toBeNull();
    expect(result.warning).toContain("non appliqué");
  });

  it("indique le message de l'offre retenue", () => {
    const result = calculatePricing(
      makeInput({
        settings: NO_QUANTITY_DISCOUNT,
        promotions: [
          makePromotion({
            id: "livraison",
            name: "Livraison offerte",
            type: "FREE_DELIVERY",
            value: 0,
          }),
        ],
      }),
    );

    expect(result.promoMessage).toBe(
      "Livraison offerte grâce à « Livraison offerte »",
    );
  });
});

describe("évaluation directe d'une offre", () => {
  it("refuse une promotion inactive ou une livraison déjà offerte", () => {
    const inactive = evaluatePromotion(
      makePromotion({ isActive: false }),
      {
        subtotal: 50_000,
        totalPieces: 50,
        deliveryMode: "DELIVERY",
        deliveryFee: 1_000,
        now: MONDAY_NOON,
        validatedOrders: 0,
      },
    );
    const alreadyFree = evaluatePromotion(
      makePromotion({ type: "FREE_DELIVERY", value: 0 }),
      {
        subtotal: 50_000,
        totalPieces: 50,
        deliveryMode: "DELIVERY",
        deliveryFee: 0,
        now: MONDAY_NOON,
        validatedOrders: 0,
      },
    );

    expect(inactive).toMatchObject({ eligible: false, benefit: 0 });
    expect(alreadyFree).toMatchObject({ eligible: false, benefit: 0 });
  });

  it("plafonne une remise fixe au sous-total", () => {
    const result = evaluatePromotion(
      makePromotion({ type: "FIXED", value: 90_000 }),
      {
        subtotal: 50_000,
        totalPieces: 50,
        deliveryMode: "DELIVERY",
        deliveryFee: 1_000,
        now: MONDAY_NOON,
        validatedOrders: 0,
      },
    );

    expect(result).toEqual({ eligible: true, benefit: 50_000, reason: null });
  });
});
