export type CartOption = {
  id: string;
  name: string;
  price: number;
};

export type CartItem = {
  key: string;
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  variantName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  pieceCount: number;
  options: CartOption[];
  notes?: string;
};

export const MAX_CART_QUANTITY = 99;

export type NewCartItem = Omit<CartItem, "key">;

export function makeCartKey(variantId: string, optionIds: string[]): string {
  const sorted = [...new Set(optionIds)].sort();
  return sorted.length ? `${variantId}:${sorted.join(",")}` : variantId;
}

export function optionTotal(item: Pick<CartItem, "options">): number {
  return item.options.reduce((total, option) => total + option.price, 0);
}

export function cartUnitTotal(item: Pick<CartItem, "unitPrice" | "options">): number {
  return item.unitPrice + optionTotal(item);
}

export function cartItemTotal(item: CartItem): number {
  return cartUnitTotal(item) * item.quantity;
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + cartItemTotal(item), 0);
}

export function cartPieces(items: CartItem[]): number {
  return items.reduce(
    (total, item) => total + item.pieceCount * item.quantity,
    0,
  );
}

export function cartLineCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function addCartItem(items: CartItem[], input: NewCartItem): CartItem[] {
  const optionIds = input.options.map((option) => option.id);
  const key = makeCartKey(input.variantId, optionIds);
  const existing = items.find((item) => item.key === key);
  if (existing) {
    return items.map((item) =>
      item.key === key
        ? {
            ...item,
            quantity: Math.min(MAX_CART_QUANTITY, item.quantity + input.quantity),
          }
        : item,
    );
  }
  return [
    ...items,
    { ...input, key, quantity: Math.min(MAX_CART_QUANTITY, input.quantity) },
  ];
}

export function updateCartQuantity(
  items: CartItem[],
  key: string,
  quantity: number,
): CartItem[] {
  if (quantity <= 0) return removeCartItem(items, key);
  const safeQuantity = Math.min(MAX_CART_QUANTITY, Math.floor(quantity));
  return items.map((item) =>
    item.key === key ? { ...item, quantity: safeQuantity } : item,
  );
}

export function removeCartItem(items: CartItem[], key: string): CartItem[] {
  return items.filter((item) => item.key !== key);
}

export type CartVariantReplacement = {
  variantId: string;
  variantName: string;
  unitPrice: number;
  pieceCount: number;
  imageUrl: string;
};

export function changeCartVariant(
  items: CartItem[],
  key: string,
  replacement: CartVariantReplacement,
): CartItem[] {
  const item = items.find((candidate) => candidate.key === key);
  if (!item) return items;
  const newKey = makeCartKey(
    replacement.variantId,
    item.options.map((option) => option.id),
  );
  if (newKey === key) {
    return items.map((candidate) =>
      candidate.key === key
        ? {
            ...candidate,
            variantName: replacement.variantName,
            unitPrice: replacement.unitPrice,
            pieceCount: replacement.pieceCount,
            imageUrl: replacement.imageUrl || candidate.imageUrl,
          }
        : candidate,
    );
  }
  const collision = items.find((candidate) => candidate.key === newKey);
  if (collision) {
    return items
      .filter((candidate) => candidate.key !== key && candidate.key !== newKey)
      .concat({
        ...collision,
        quantity: Math.min(MAX_CART_QUANTITY, collision.quantity + item.quantity),
      });
  }
  return items.map((candidate) =>
    candidate.key === key
      ? {
          ...candidate,
          key: newKey,
          variantId: replacement.variantId,
          variantName: replacement.variantName,
          unitPrice: replacement.unitPrice,
          pieceCount: replacement.pieceCount,
          imageUrl: replacement.imageUrl || candidate.imageUrl,
        }
      : candidate,
  );
}

export function clearCart(): CartItem[] {
  return [];
}

function isSafeString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length < 500;
}

function isSafeNumber(value: unknown, min = 0, max = 1_000_000): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}

function isSafeInteger(value: unknown, min = 0, max = 1_000_000): value is number {
  return isSafeNumber(value, min, max) && Number.isInteger(value);
}

export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is CartItem => {
        if (!item || typeof item !== "object") return false;
        const candidate = item as Record<string, unknown>;
        return (
          isSafeString(candidate.key) &&
          isSafeString(candidate.productId) &&
          isSafeString(candidate.variantId) &&
          isSafeString(candidate.slug) &&
          isSafeString(candidate.name) &&
          isSafeString(candidate.variantName) &&
          typeof candidate.imageUrl === "string" &&
          isSafeInteger(candidate.unitPrice) &&
          isSafeInteger(candidate.quantity, 1, MAX_CART_QUANTITY) &&
          isSafeInteger(candidate.pieceCount, 1, 1000) &&
          Array.isArray(candidate.options) &&
          candidate.options.every(
            (option) =>
              option &&
              typeof option === "object" &&
              isSafeString((option as CartOption).id) &&
              isSafeString((option as CartOption).name) &&
              isSafeInteger((option as CartOption).price),
          )
        );
      })
      .slice(0, 40);
  } catch {
    return [];
  }
}

export function buildCartLineKey(item: {
  variantId: string;
  options: { id: string }[];
}): string {
  return makeCartKey(item.variantId, item.options.map((option) => option.id));
}

export function cartItemLabel(item: CartItem): string {
  const options = item.options.map((option) => option.name);
  return [item.name, item.variantName, ...options].filter(Boolean).join(" · ");
}
