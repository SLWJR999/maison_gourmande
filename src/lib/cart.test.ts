import { describe, expect, it } from "vitest";
import {
  MAX_CART_QUANTITY,
  addCartItem,
  buildCartLineKey,
  cartItemTotal,
  cartLineCount,
  cartPieces,
  cartSubtotal,
  changeCartVariant,
  makeCartKey,
  parseStoredCart,
  removeCartItem,
  updateCartQuantity,
  type CartItem,
} from "./cart";

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    key: "variant-1",
    productId: "product-1",
    variantId: "variant-1",
    slug: "mini-fataya",
    name: "Mini-fataya",
    variantName: "10 pièces",
    imageUrl: "/images/fataya.jpg",
    unitPrice: 1_000,
    quantity: 1,
    pieceCount: 10,
    options: [],
    ...overrides,
  };
}

describe("clé et totaux du panier", () => {
  it("crée une clé stable à partir de la variante et des options triées", () => {
    expect(makeCartKey("variant-1", [])).toBe("variant-1");
    expect(makeCartKey("variant-1", ["option-b", "option-a", "option-a"])).toBe(
      "variant-1:option-a,option-b",
    );
    expect(
      buildCartLineKey({
        variantId: "variant-1",
        options: [{ id: "option-b" }, { id: "option-a" }],
      }),
    ).toBe("variant-1:option-a,option-b");
  });

  it("calcule le total d'une ligne avec ses options", () => {
    const item = makeItem({
      unitPrice: 2_000,
      quantity: 3,
      pieceCount: 5,
      options: [
        { id: "sauce", name: "Sauce maison", price: 200 },
        { id: "fromage", name: "Fromage", price: 300 },
      ],
    });

    expect(cartItemTotal(item)).toBe(7_500);
    expect(cartPieces([item])).toBe(15);
  });

  it("additionne les lignes, les pièces et les quantités", () => {
    const items = [
      makeItem({ quantity: 2, pieceCount: 10 }),
      makeItem({
        key: "variant-2",
        variantId: "variant-2",
        unitPrice: 3_000,
        quantity: 1,
        pieceCount: 1,
      }),
    ];

    expect(cartSubtotal(items)).toBe(5_000);
    expect(cartPieces(items)).toBe(21);
    expect(cartLineCount(items)).toBe(3);
  });
});

describe("ajout et modification des lignes", () => {
  it("fusionne les lignes identiques et plafonne la quantité", () => {
    const first = makeItem({ quantity: 2 });
    const merged = addCartItem([first], {
      productId: first.productId,
      variantId: first.variantId,
      slug: first.slug,
      name: first.name,
      variantName: first.variantName,
      imageUrl: first.imageUrl,
      unitPrice: first.unitPrice,
      quantity: 3,
      pieceCount: first.pieceCount,
      options: [],
    });

    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(5);

    const capped = addCartItem([makeItem({ quantity: 95 })], {
      productId: "product-1",
      variantId: "variant-1",
      slug: "mini-fataya",
      name: "Mini-fataya",
      variantName: "10 pièces",
      imageUrl: "/images/fataya.jpg",
      unitPrice: 1_000,
      quantity: 20,
      pieceCount: 10,
      options: [],
    });
    expect(capped[0].quantity).toBe(MAX_CART_QUANTITY);
  });

  it("ne fusionne pas deux options différentes", () => {
    const first = makeItem({
      key: "variant-1:sauce",
      options: [{ id: "sauce", name: "Sauce", price: 100 }],
    });
    const items = addCartItem([first], {
      productId: "product-1",
      variantId: "variant-1",
      slug: "mini-fataya",
      name: "Mini-fataya",
      variantName: "10 pièces",
      imageUrl: "/images/fataya.jpg",
      unitPrice: 1_000,
      quantity: 1,
      pieceCount: 10,
      options: [{ id: "fromage", name: "Fromage", price: 200 }],
    });

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.key)).toEqual([
      "variant-1:sauce",
      "variant-1:fromage",
    ]);
  });

  it("met à jour, plafonne ou supprime une quantité", () => {
    const items = [makeItem({ quantity: 2 })];

    expect(updateCartQuantity(items, "variant-1", 4)[0].quantity).toBe(4);
    expect(updateCartQuantity(items, "variant-1", 500)[0].quantity).toBe(
      MAX_CART_QUANTITY,
    );
    expect(updateCartQuantity(items, "variant-1", 0)).toEqual([]);
    expect(updateCartQuantity(items, "variant-1", -2)).toEqual([]);
    expect(removeCartItem(items, "variant-1")).toEqual([]);
    expect(removeCartItem(items, "inconnue")).toEqual(items);
  });

  it("change de variante en conservant les options", () => {
    const item = makeItem({
      options: [{ id: "sauce", name: "Sauce", price: 100 }],
    });

    const changed = changeCartVariant([item], "variant-1", {
      variantId: "variant-2",
      variantName: "25 pièces",
      unitPrice: 2_500,
      pieceCount: 25,
      imageUrl: "/images/fataya-25.jpg",
    });

    expect(changed[0]).toMatchObject({
      key: "variant-2:sauce",
      variantId: "variant-2",
      variantName: "25 pièces",
      unitPrice: 2_500,
      pieceCount: 25,
      options: [{ id: "sauce", name: "Sauce", price: 100 }],
    });
  });

  it("fusionne les quantités lors d'un changement vers une ligne existante", () => {
    const items = [
      makeItem({ quantity: 2 }),
      makeItem({
        key: "variant-2",
        variantId: "variant-2",
        variantName: "25 pièces",
        unitPrice: 2_500,
        quantity: 3,
        pieceCount: 25,
      }),
    ];

    const changed = changeCartVariant(items, "variant-1", {
      variantId: "variant-2",
      variantName: "25 pièces",
      unitPrice: 2_500,
      pieceCount: 25,
      imageUrl: "/images/fataya-25.jpg",
    });

    expect(changed).toHaveLength(1);
    expect(changed[0]).toMatchObject({
      key: "variant-2",
      quantity: 5,
      unitPrice: 2_500,
    });
  });

  it("plafonne aussi la fusion lors d'un changement de variante", () => {
    const items = [
      makeItem({ quantity: 90 }),
      makeItem({
        key: "variant-2",
        variantId: "variant-2",
        variantName: "25 pièces",
        unitPrice: 2_500,
        quantity: 20,
        pieceCount: 25,
      }),
    ];

    const changed = changeCartVariant(items, "variant-1", {
      variantId: "variant-2",
      variantName: "25 pièces",
      unitPrice: 2_500,
      pieceCount: 25,
      imageUrl: "",
    });

    expect(changed[0].quantity).toBe(MAX_CART_QUANTITY);
  });
});

describe("lecture du panier stocké", () => {
  it("relit un panier valide et ignore les entrées corrompues", () => {
    const valid = makeItem();
    const raw = JSON.stringify([
      valid,
      { ...valid, key: "", variantId: "variant-2" },
      { ...valid, quantity: 0 },
      { ...valid, unitPrice: "gratuit" },
      null,
    ]);

    expect(parseStoredCart(raw)).toEqual([valid]);
  });

  it("refuse les valeurs invalides et un JSON cassé", () => {
    expect(parseStoredCart(null)).toEqual([]);
    expect(parseStoredCart("pas du json")).toEqual([]);
    expect(parseStoredCart("{}")).toEqual([]);
    expect(parseStoredCart(JSON.stringify([{ ...makeItem(), quantity: 1.5 }]))).toEqual([]);
  });

  it("limite le panier stocké à quarante lignes", () => {
    const items = Array.from({ length: 50 }, (_, index) =>
      makeItem({
        key: `variant-${index}`,
        variantId: `variant-${index}`,
      }),
    );

    expect(parseStoredCart(JSON.stringify(items))).toHaveLength(40);
  });
});
