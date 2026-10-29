"use client";

import { Plus } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { cn } from "@/lib/utils";

export type QuickAddData = {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  variantName: string;
  imageUrl: string;
  unitPrice: number;
  pieceCount: number;
};

export function QuickAddButton({
  data,
  className,
  label = "Ajouter",
}: {
  data: QuickAddData;
  className?: string;
  label?: string;
}) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      onClick={() =>
        addItem({
          productId: data.productId,
          variantId: data.variantId,
          slug: data.slug,
          name: data.name,
          variantName: data.variantName,
          imageUrl: data.imageUrl,
          unitPrice: data.unitPrice,
          quantity: 1,
          pieceCount: data.pieceCount,
          options: [],
        })
      }
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full bg-mauve-100 px-3.5 py-2 text-xs font-extrabold text-mauve-800 transition hover:bg-mauve hover:text-white active:scale-95",
        className,
      )}
      aria-label={`Ajouter ${data.name} ${data.variantName} au panier`}
    >
      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      {label}
    </button>
  );
}
