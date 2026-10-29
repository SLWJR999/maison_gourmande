"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addCartItem,
  cartItemTotal,
  cartLineCount,
  cartPieces,
  cartSubtotal,
  changeCartVariant,
  clearCart as clearCartItems,
  parseStoredCart,
  removeCartItem,
  updateCartQuantity,
  type CartItem,
  type CartVariantReplacement,
  type NewCartItem,
} from "@/lib/cart";
import { useToast } from "@/components/ui/toast-provider";

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  lineCount: number;
  pieces: number;
  subtotal: number;
  addItem: (item: NewCartItem) => void;
  updateQuantity: (key: string, quantity: number) => void;
  changeVariant: (key: string, replacement: CartVariantReplacement) => void;
  remove: (key: string) => void;
  clear: () => void;
  totalFor: (item: CartItem) => number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "maison-gourmande-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const { toast } = useToast();
  const initialized = useRef(false);

  useEffect(() => {
    setItems(parseStoredCart(window.localStorage.getItem(STORAGE_KEY)));
    setReady(true);
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!ready || !initialized.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("maison-gourmande-cart-update"));
  }, [items, ready]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setItems(parseStoredCart(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addItem = useCallback(
    (item: NewCartItem) => {
      setItems((current) => addCartItem(current, item));
      toast("Ajouté au panier", {
        description: [item.name, item.variantName].filter(Boolean).join(" · "),
        tone: "success",
      });
    },
    [toast],
  );

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) => updateCartQuantity(current, key, quantity));
  }, []);

  const changeVariant = useCallback(
    (key: string, replacement: CartVariantReplacement) => {
      setItems((current) => changeCartVariant(current, key, replacement));
      toast("Format mis à jour", { tone: "info" });
    },
    [toast],
  );

  const remove = useCallback((key: string) => {
    setItems((current) => removeCartItem(current, key));
  }, []);

  const clear = useCallback(() => {
    setItems(clearCartItems());
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      lineCount: cartLineCount(items),
      pieces: cartPieces(items),
      subtotal: cartSubtotal(items),
      addItem,
      updateQuantity,
      changeVariant,
      remove,
      clear,
      totalFor: cartItemTotal,
    }),
    [items, ready, addItem, updateQuantity, changeVariant, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart doit être utilisé dans CartProvider");
  return context;
}
