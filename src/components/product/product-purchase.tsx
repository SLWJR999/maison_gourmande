"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Clock3,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import type { Option, Product, ProductVariant } from "@/db/schema";
import { useCart } from "@/components/store/cart-provider";
import { cn, formatFCFA } from "@/lib/utils";

type OptionGroup = {
  name: string;
  options: Option[];
};

export function ProductPurchase({
  product,
  variants,
  options,
  availability,
}: {
  product: Pick<Product, "id" | "slug" | "name" | "imageUrl" | "preparationMinutes">;
  variants: ProductVariant[];
  options: Option[];
  availability: Product["availability"];
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const selectedVariant =
    variants.find((variant) => variant.id === variantId) ?? variants[0];

  const groups = useMemo<OptionGroup[]>(() => {
    const map = new Map<string, Option[]>();
    for (const option of options) {
      if (!map.has(option.groupName)) map.set(option.groupName, []);
      map.get(option.groupName)!.push(option);
    }
    return Array.from(map, ([name, groupOptions]) => ({
      name,
      options: groupOptions,
    }));
  }, [options]);

  const chosenOptions = options.filter((option) =>
    selectedOptions.includes(option.id),
  );
  const optionsTotal = chosenOptions.reduce((sum, option) => sum + option.price, 0);
  const unitPrice = (selectedVariant?.price ?? 0) + optionsTotal;
  const lineTotal = unitPrice * quantity;
  const soldOut =
    availability === "SOLD_OUT" ||
    (selectedVariant?.stock !== null &&
      selectedVariant?.stock !== undefined &&
      selectedVariant.stock <= 0);
  const comingSoon = availability === "COMING_SOON";
  const canAdd = Boolean(selectedVariant) && !soldOut && !comingSoon;
  const maxQuantity = Math.min(
    99,
    selectedVariant?.stock && selectedVariant.stock > 0
      ? selectedVariant.stock
      : 99,
  );

  const toggleOption = (id: string) => {
    setSelectedOptions((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const add = () => {
    if (!selectedVariant || !canAdd) return false;
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      slug: product.slug,
      name: product.name,
      variantName: selectedVariant.name,
      imageUrl: selectedVariant.imageUrl || product.imageUrl,
      unitPrice: selectedVariant.price,
      quantity,
      pieceCount: Math.max(1, selectedVariant.quantity),
      options: chosenOptions.map((option) => ({
        id: option.id,
        name: option.name,
        price: option.price,
      })),
      notes: notes.trim() || undefined,
    });
    return true;
  };

  const addAndGo = () => {
    if (add()) router.push("/panier");
  };

  const compare = selectedVariant?.compareAtPrice;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-mauve">
          Format
        </p>
        <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {variants.map((variant) => {
            const active = variant.id === variantId;
            const unavailable =
              variant.stock !== null && variant.stock !== undefined && variant.stock <= 0;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  setVariantId(variant.id);
                  setQuantity(1);
                }}
                className={cn(
                  "relative rounded-2xl border p-3 text-left transition",
                  active
                    ? "border-mauve bg-mauve-100/70 shadow-sm"
                    : "border-brown/15 bg-white hover:border-mauve/30",
                  unavailable && "opacity-55",
                )}
                aria-pressed={active}
              >
                <span className="block text-[11px] font-extrabold leading-tight text-brown">
                  {variant.name}
                </span>
                <span className="mt-1 block font-display text-[16px] text-mauve-900">
                  {formatFCFA(variant.price)}
                </span>
                {variant.quantity > 1 ? (
                  <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wide text-brown-light">
                    {variant.quantity} pièces
                  </span>
                ) : null}
                {active ? (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-mauve text-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {selectedVariant?.composition ? (
          <p className="mt-2.5 rounded-xl bg-cream px-3.5 py-2.5 text-[12px] leading-5 text-brown-soft">
            <span className="font-extrabold text-brown">Composition :</span>{" "}
            {selectedVariant.composition}
          </p>
        ) : null}
      </div>

      {groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <fieldset key={group.name}>
              <legend className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-mauve">
                {group.name}
              </legend>
              <p className="mt-0.5 text-[10px] text-brown-light">
                Facultatif · plusieurs choix possibles
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {group.options.map((option) => {
                  const checked = selectedOptions.includes(option.id);
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-[12px] transition",
                        checked
                          ? "border-mauve bg-mauve-100/60"
                          : "border-brown/10 bg-white hover:border-mauve/25",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border transition",
                            checked
                              ? "border-mauve bg-mauve text-white"
                              : "border-brown/25 bg-white",
                          )}
                        >
                          {checked ? (
                            <Check className="h-3 w-3" strokeWidth={3} />
                          ) : null}
                        </span>
                        <span className="font-semibold text-brown">{option.name}</span>
                      </span>
                      <span className="font-bold text-mauve-800">
                        {option.price > 0 ? `+${formatFCFA(option.price)}` : "Offert"}
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleOption(option.id)}
                      />
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      ) : null}

      <div>
        <label htmlFor="product-note" className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-mauve">
          Une précision ?
        </label>
        <textarea
          id="product-note"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={300}
          rows={2}
          placeholder="Sans piment, sauce à part, bien cuit…"
          className="textarea-field mt-2 text-[13px]"
        />
        <p className="mt-1 text-[10px] leading-4 text-brown-light">
          Les options structurées restent prioritaires. La note accompagne la
          préparation mais ne remplace pas un choix de format.
        </p>
      </div>

      <div className="rounded-2xl border border-brown/10 bg-cream/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-brown-light">
              Quantité
            </p>
            <p className="mt-0.5 text-[11px] text-brown-soft">
              {selectedVariant?.quantity && selectedVariant.quantity > 1
                ? `${selectedVariant.quantity * quantity} pièces au total`
                : "Préparé à la commande"}
            </p>
          </div>
          <div className="flex items-center rounded-full border border-brown/15 bg-white">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full text-brown transition hover:bg-cream disabled:opacity-40"
              aria-label="Diminuer la quantité"
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-9 text-center text-sm font-extrabold text-brown">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full text-brown transition hover:bg-cream disabled:opacity-40"
              aria-label="Augmenter la quantité"
              disabled={quantity >= maxQuantity}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-brown/10 pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-brown-light">
              Total de la ligne
            </p>
            <p className="font-display text-[26px] leading-none text-mauve-900">
              {formatFCFA(lineTotal)}
            </p>
            {compare && compare > (selectedVariant?.price ?? 0) ? (
              <p className="mt-1 text-[11px] text-brown-light">
                <span className="line-through">{formatFCFA(compare * quantity)}</span>{" "}
                <span className="font-bold text-mauve-700">
                  économisez {formatFCFA((compare - (selectedVariant?.price ?? 0)) * quantity)}
                </span>
              </p>
            ) : null}
          </div>
          <p className="text-right text-[10px] leading-4 text-brown-soft">
            {formatFCFA(unitPrice)} / unité
            {chosenOptions.length > 0 ? (
              <span className="block text-brown-light">
                dont {formatFCFA(optionsTotal)} d'options
              </span>
            ) : null}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={add}
            disabled={!canAdd}
            className="btn-primary w-full"
          >
            <ShoppingBag className="h-4 w-4" />
            {comingSoon
              ? "Bientôt disponible"
              : soldOut
                ? "Temporairement épuisé"
                : "Ajouter au panier"}
          </button>
          <button
            type="button"
            onClick={addAndGo}
            disabled={!canAdd}
            className="btn-secondary w-full"
          >
            <Sparkles className="h-4 w-4" />
            Ajouter et voir le panier
          </button>
        </div>

        {!canAdd ? (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {comingSoon
              ? "Ce produit rejoint bientôt la carte. Revenez très vite."
              : "Ce format est momentanément indisponible. Choisissez un autre format ou contactez la maison sur WhatsApp."}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-brown-soft">
        <span className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm">
          <Truck className="h-3.5 w-3.5 text-mauve" />
          Livraison ou retrait
        </span>
        <span className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm">
          <Clock3 className="h-3.5 w-3.5 text-mauve" />
          {product.preparationMinutes
            ? `Prêt en ±${product.preparationMinutes} min`
            : "Préparé minute"}
        </span>
      </div>
    </div>
  );
}
