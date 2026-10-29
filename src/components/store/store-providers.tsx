"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/components/store/cart-provider";
import { ToastProvider } from "@/components/ui/toast-provider";

export function StoreProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <CartProvider>{children}</CartProvider>
    </ToastProvider>
  );
}
