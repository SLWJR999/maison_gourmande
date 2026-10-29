"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import type { PublicVariantOption } from "@/lib/catalog";
import { formatFCFA } from "@/lib/utils";

type PreviewPricing = {
  subtotal: number;
  totalPieces: number;
  quantityDiscount: number;
  promotionDiscount: number;
  deliveryFee: number;
  deliveryFeeBeforeDiscount: number;
  discountTotal: number;
  total: number;
  appliedPromotion: {
    id: string;
    name: string;
    code: string | null;
    type: "PERCENT" | "FIXED" | "FREE_DELIVERY";
    benefit: number;
  } | null;
  promoCode: string | null;
  promoMessage: string | null;
  warning: string | null;
};

type PreviewSettings = {
  quantityDiscountThreshold: number;
  quantityDiscountPercent: number;
};

type SuccessData = {
  reference: string;
  whatsappUrl: string;
  total: number;
};

type FieldErrors = Record<string, string>;

export function CartClient({
  variantOptions,
  settings,
}: {
  variantOptions: PublicVariantOption[];
  settings: { deliveryFee: number; orderNote: string };
}) {
  const { items, ready, subtotal, pieces, updateQuantity, changeVariant, remove, clear, totalFor } =
    useCart();

  const [deliveryMode, setDeliveryMode] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [pricing, setPricing] = useState<PreviewPricing | null>(null);
  const [previewSettings, setPreviewSettings] = useState<PreviewSettings>({
    quantityDiscountThreshold: 50,
    quantityDiscountPercent: 5,
  });
  const [previewError, setPreviewError] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [requestedFor, setRequestedFor] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const previewAbort = useRef<AbortController | null>(null);

  const itemSignature = useMemo(
    () =>
      JSON.stringify(
        items.map((item) => ({
          v: item.variantId,
          q: item.quantity,
          o: item.options.map((option) => option.id).sort(),
        })),
      ),
    [items],
  );

  const runPreview = useCallback(
    async (code: string) => {
      if (!items.length) {
        setPricing(null);
        return;
      }
      previewAbort.current?.abort();
      const controller = new AbortController();
      previewAbort.current = controller;
      setLoadingPreview(true);
      setPreviewError("");
      try {
        const response = await fetch("/api/checkout/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            items: items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              optionIds: item.options.map((option) => option.id),
            })),
            promoCode: code,
            deliveryMode,
            phone: customerPhone,
          }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          pricing?: PreviewPricing;
          settings?: PreviewSettings;
          error?: string;
        };
        if (!response.ok || !data.ok || !data.pricing) {
          setPreviewError(data.error || "Impossible de recalculer le panier.");
          setPricing(null);
          return;
        }
        setPricing(data.pricing);
        if (data.settings) setPreviewSettings(data.settings);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setPreviewError("Connexion impossible. Vérifiez votre réseau et réessayez.");
      } finally {
        if (!controller.signal.aborted) setLoadingPreview(false);
      }
    },
    [items, deliveryMode, customerPhone],
  );

  useEffect(() => {
    if (!ready || !items.length) {
      setPricing(null);
      return;
    }
    const timer = window.setTimeout(() => {
      void runPreview(appliedPromo);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [ready, itemSignature, deliveryMode, appliedPromo, customerPhone, items.length, runPreview]);

  const effectivePricing = pricing;
  const displaySubtotal = effectivePricing?.subtotal ?? subtotal;
  const total = effectivePricing?.total ?? subtotal;
  const belowThreshold =
    previewSettings.quantityDiscountThreshold > 0 &&
    pieces < previewSettings.quantityDiscountThreshold;
  const piecesLeft = Math.max(0, previewSettings.quantityDiscountThreshold - pieces);

  const groupedVariants = useMemo(() => {
    const map = new Map<string, PublicVariantOption[]>();
    for (const option of variantOptions) {
      if (!map.has(option.productId)) map.set(option.productId, []);
      map.get(option.productId)!.push(option);
    }
    return map;
  }, [variantOptions]);

  const submit = async () => {
    setSubmitError("");
    setFieldErrors({});
    const errors: FieldErrors = {};
    if (customerName.trim().length < 2) errors.customerName = "Indiquez votre nom.";
    if (customerPhone.replace(/\D/g, "").length < 8)
      errors.customerPhone = "Indiquez un numéro joignable.";
    if (deliveryMode === "DELIVERY" && address.trim().length < 5)
      errors.address = "Indiquez l'adresse de livraison.";
    if (!consent) errors.consent = "Merci d'accepter la politique de confidentialité.";
    if (!items.length) errors.items = "Votre panier est vide.";
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setSubmitError("Quelques informations sont à compléter.");
      return;
    }

    setSubmitting(true);
    try {
      const fullAddress =
        deliveryMode === "DELIVERY"
          ? [address.trim(), landmark.trim() ? `Repère : ${landmark.trim()}` : ""]
              .filter(Boolean)
              .join(" · ")
              .slice(0, 300)
          : "";
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          deliveryMode,
          address: fullAddress,
          requestedFor: requestedFor.trim(),
          notes: notes.trim(),
          promoCode: appliedPromo,
          consent: true,
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            optionIds: item.options.map((option) => option.id),
          })),
        }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        reference?: string;
        whatsappUrl?: string;
        total?: number;
        error?: string;
        field?: string | null;
      };
      if (!response.ok || !data.ok || !data.reference || !data.whatsappUrl) {
        setSubmitError(data.error || "La commande n'a pas pu être enregistrée.");
        if (data.field) setFieldErrors({ [data.field]: data.error || "Champ invalide." });
        return;
      }
      setSuccess({
        reference: data.reference,
        whatsappUrl: data.whatsappUrl,
        total: data.total ?? total,
      });
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError("Connexion impossible. Réessayez dans quelques instants.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="container-page flex min-h-[50vh] items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-mauve" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-[2.25rem] border border-brown/10 bg-white shadow-float">
          <div className="bg-mauve-900 px-6 py-9 text-center text-white sm:px-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-ochre-light">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.22em] text-mauve-200">
              Commande enregistrée sur le site
            </p>
            <h1 className="mt-2 text-[34px] leading-tight text-white sm:text-[42px]">
              Dernière étape :<br />
              <em className="text-mauve-200">envoyez le message.</em>
            </h1>
            <p className="mt-3 text-[13px] leading-6 text-mauve-200/80">
              Votre panier est sauvegardé sous la référence{" "}
              <span className="font-extrabold text-white">{success.reference}</span>.
              La commande ne sera confirmée qu'après réponse de la boutique.
            </p>
          </div>

          <div className="px-6 py-7 sm:px-10">
            <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brown-light">
                Total estimé
              </span>
              <span className="font-display text-2xl text-mauve-900">
                {formatFCFA(success.total)}
              </span>
            </div>

            <a
              href={success.whatsappUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-primary mt-4 w-full py-3.5"
            >
              <MessageCircle className="h-4 w-4" />
              Envoyer ma commande sur WhatsApp
            </a>
            <p className="mt-2 text-center text-[11px] leading-5 text-brown-light">
              Le message est prêt. Envoyez-le dans WhatsApp pour transmettre votre
              commande. La boutique confirmera la disponibilité, le prix final et le
              délai.
            </p>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link href={`/commande/${success.reference}`} className="btn-secondary">
                Voir ma commande
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/menu" className="btn-ghost">
                Continuer mes achats
              </Link>
            </div>

            <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-[11px] leading-5 text-amber-800">
                Aucun paiement n'a été effectué en ligne. La commande enregistrée sur
                le site n'est pas encore une vente confirmée : elle le devient quand la
                maison la valide dans son espace de gestion.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container-page py-16 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-mauve-100 text-mauve-700">
            <ShoppingBag className="h-9 w-9" />
          </span>
          <h1 className="mt-5 text-[38px] leading-tight text-mauve-900">
            Votre panier attend <em className="text-mauve">son premier plaisir</em>.
          </h1>
          <p className="mt-3 text-sm leading-7 text-brown-soft">
            Mini-fataya croustillants, tacos généreux, crêpe fondante… La carte est
            pleine de bonnes idées.
          </p>
          <Link href="/menu" className="btn-primary mt-6">
            Découvrir le menu
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-5 text-[11px] text-brown-light">
            Votre panier est conservé sur cet appareil, même si vous quittez le site.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page pb-20 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            <span className="h-px w-6 bg-mauve" />
            Votre panier
          </p>
          <h1 className="mt-2 text-[38px] leading-none text-mauve-900 sm:text-[46px]">
            On finalise <em className="text-mauve">tout ça</em>.
          </h1>
          <p className="mt-2 text-[12px] text-brown-soft">
            {items.length} ligne{items.length > 1 ? "s" : ""} · {pieces} pièce
            {pieces > 1 ? "s" : ""} · sans paiement en ligne
          </p>
        </div>
        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-mauve-700 transition hover:text-mauve-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Continuer mes achats
        </Link>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-brown/10 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-brown/10 px-5 py-4">
              <h2 className="font-display text-xl text-mauve-900">Mes articles</h2>
              <span className="rounded-full bg-cream px-2.5 py-1 text-[10px] font-extrabold text-brown-soft">
                {items.length}
              </span>
            </div>

            <ul className="divide-y divide-brown/10">
              {items.map((item) => {
                const variants = groupedVariants.get(item.productId) ?? [];
                return (
                  <li key={item.key} className="p-4 sm:p-5">
                    <div className="flex gap-3.5">
                      <Link
                        href={`/menu/${item.slug}`}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-cream sm:h-24 sm:w-24"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl || "/images/spread.jpg"}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={`/menu/${item.slug}`}
                              className="font-display text-[18px] leading-tight text-brown transition hover:text-mauve-800"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-0.5 text-[11px] font-semibold text-brown-soft">
                              {item.variantName}
                              {item.pieceCount > 1
                                ? ` · ${item.pieceCount} pièces / ${item.variantName.toLowerCase()}`
                                : ""}
                            </p>
                            {item.options.length ? (
                              <p className="mt-1 text-[10px] leading-4 text-brown-light">
                                {item.options
                                  .map((option) =>
                                    option.price > 0
                                      ? `${option.name} (+${formatFCFA(option.price)})`
                                      : option.name,
                                  )
                                  .join(" · ")}
                              </p>
                            ) : null}
                            {item.notes ? (
                              <p className="mt-1 rounded-lg bg-cream px-2 py-1 text-[10px] italic text-brown-soft">
                                « {item.notes} »
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(item.key)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brown-light transition hover:bg-red-50 hover:text-red-600"
                            aria-label={`Retirer ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center rounded-full border border-brown/15 bg-white">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.key, item.quantity - 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-brown transition hover:bg-cream"
                                aria-label="Diminuer la quantité"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-7 text-center text-[12px] font-extrabold text-brown">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.key, item.quantity + 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-brown transition hover:bg-cream"
                                aria-label="Augmenter la quantité"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {variants.length > 1 ? (
                              <label className="relative">
                                <span className="sr-only">Changer le format</span>
                                <select
                                  value={item.variantId}
                                  onChange={(event) => {
                                    const next = variants.find(
                                      (variant) => variant.variantId === event.target.value,
                                    );
                                    if (!next) return;
                                    changeVariant(item.key, {
                                      variantId: next.variantId,
                                      variantName: next.variantName,
                                      unitPrice: next.unitPrice,
                                      pieceCount: next.pieceCount,
                                      imageUrl: next.imageUrl,
                                    });
                                  }}
                                  className="h-8 cursor-pointer rounded-full border border-brown/15 bg-white pl-3 pr-7 text-[10px] font-bold text-brown-soft outline-none transition focus:border-mauve/40"
                                >
                                  {variants.map((variant) => (
                                    <option key={variant.variantId} value={variant.variantId}>
                                      {variant.variantName} · {formatFCFA(variant.unitPrice)}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            ) : null}
                          </div>
                          <p className="font-display text-[18px] text-mauve-900">
                            {formatFCFA(totalFor(item))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-col gap-2 border-t border-brown/10 bg-cream/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-brown-soft">
                {belowThreshold ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-mauve" />
                    Encore <strong>{piecesLeft}</strong> pièce{piecesLeft > 1 ? "s" : ""} pour{" "}
                    <strong>−{previewSettings.quantityDiscountPercent}%</strong> de remise
                    quantité.
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-mauve-800">
                    <Check className="h-3.5 w-3.5" />
                    Remise quantité de {previewSettings.quantityDiscountPercent}% appliquée
                    dès {previewSettings.quantityDiscountThreshold} pièces.
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={clear}
                className="self-start text-[10px] font-bold text-brown-light underline-offset-4 transition hover:text-red-600 hover:underline"
              >
                Vider le panier
              </button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-brown/10 bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mauve-100 text-mauve-700">
                <Truck className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-xl text-mauve-900">Réception</h2>
                <p className="text-[10px] text-brown-light">
                  Frais et créneau confirmés par la boutique.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {(
                [
                  {
                    value: "DELIVERY" as const,
                    title: "Livraison",
                    text: `Dès ${formatFCFA(settings.deliveryFee)} · Dakar`,
                    Icon: Truck,
                  },
                  {
                    value: "PICKUP" as const,
                    title: "Retrait",
                    text: "Sur place, sans frais",
                    Icon: MapPin,
                  },
                ]
              ).map((option) => {
                const active = deliveryMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDeliveryMode(option.value)}
                    aria-pressed={active}
                    className={`rounded-2xl border p-3.5 text-left transition ${
                      active
                        ? "border-mauve bg-mauve-100/60"
                        : "border-brown/15 bg-white hover:border-mauve/30"
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <option.Icon className="h-4 w-4 text-mauve-700" />
                      {active ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-mauve text-white">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-2 block text-[12px] font-extrabold text-brown">
                      {option.title}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-brown-light">
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-brown/10 bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mauve-100 text-mauve-700">
                <MessageCircle className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-xl text-mauve-900">Vos coordonnées</h2>
                <p className="text-[10px] text-brown-light">
                  Uniquement pour traiter votre commande.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="customer-name" className="label-field">
                  Nom & prénom *
                </label>
                <input
                  id="customer-name"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  autoComplete="name"
                  className="input-field"
                  placeholder="Aïcha Koné"
                />
                {fieldErrors.customerName ? (
                  <p className="mt-1 text-[10px] font-semibold text-red-600">
                    {fieldErrors.customerName}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="customer-phone" className="label-field">
                  Téléphone / WhatsApp *
                </label>
                <input
                  id="customer-phone"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  className="input-field"
                  placeholder="07 00 00 00 00"
                />
                {fieldErrors.customerPhone ? (
                  <p className="mt-1 text-[10px] font-semibold text-red-600">
                    {fieldErrors.customerPhone}
                  </p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="customer-email" className="label-field">
                  E-mail <span className="font-normal normal-case">(facultatif)</span>
                </label>
                <input
                  id="customer-email"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  className="input-field"
                  placeholder="vous@exemple.com"
                />
              </div>

              {deliveryMode === "DELIVERY" ? (
                <>
                  <div className="sm:col-span-2">
                    <label htmlFor="customer-address" className="label-field">
                      Adresse de livraison *
                    </label>
                    <input
                      id="customer-address"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      autoComplete="street-address"
                      className="input-field"
                      placeholder="Quartier, rue, immeuble, appartement…"
                    />
                    {fieldErrors.address ? (
                      <p className="mt-1 text-[10px] font-semibold text-red-600">
                        {fieldErrors.address}
                      </p>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="customer-landmark" className="label-field">
                      Repère <span className="font-normal normal-case">(facultatif)</span>
                    </label>
                    <input
                      id="customer-landmark"
                      value={landmark}
                      onChange={(event) => setLandmark(event.target.value)}
                      className="input-field"
                      placeholder="En face de la pharmacie, portail vert…"
                    />
                  </div>
                </>
              ) : null}

              <div>
                <label htmlFor="requested-for" className="label-field">
                  Créneau souhaité
                </label>
                <input
                  id="requested-for"
                  value={requestedFor}
                  onChange={(event) => setRequestedFor(event.target.value)}
                  className="input-field"
                  placeholder="Aujourd'hui vers 19h30"
                />
              </div>
              <div>
                <label htmlFor="order-notes" className="label-field">
                  Note générale
                </label>
                <input
                  id="order-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={500}
                  className="input-field"
                  placeholder="Appeler à l'arrivée…"
                />
              </div>
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-2xl bg-cream/70 p-3.5">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brown/30 text-mauve focus:ring-mauve"
              />
              <span className="text-[11px] leading-5 text-brown-soft">
                J'accepte que mes coordonnées soient utilisées pour traiter ma
                commande et me contacter. Voir la{" "}
                <Link href="/confidentialite" className="font-bold text-mauve-700 underline">
                  politique de confidentialité
                </Link>
                . *
              </span>
            </label>
            {fieldErrors.consent ? (
              <p className="mt-1 text-[10px] font-semibold text-red-600">
                {fieldErrors.consent}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-[1.75rem] border border-brown/10 bg-white p-5 shadow-float sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-mauve-900">Récapitulatif</h2>
              {loadingPreview ? (
                <Loader2 className="h-4 w-4 animate-spin text-mauve" />
              ) : (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-emerald-700">
                  Calcul serveur
                </span>
              )}
            </div>

            <div className="mt-4 space-y-2.5 text-[12px]">
              <div className="flex items-center justify-between text-brown-soft">
                <span>Sous-total</span>
                <span className="font-bold text-brown">{formatFCFA(displaySubtotal)}</span>
              </div>
              {effectivePricing && effectivePricing.quantityDiscount > 0 ? (
                <div className="flex items-center justify-between text-mauve-700">
                  <span>Remise quantité ({effectivePricing.totalPieces} pièces)</span>
                  <span className="font-bold">
                    −{formatFCFA(effectivePricing.quantityDiscount)}
                  </span>
                </div>
              ) : null}
              {effectivePricing && effectivePricing.promotionDiscount > 0 ? (
                <div className="flex items-center justify-between text-mauve-700">
                  <span className="max-w-[75%]">
                    {effectivePricing.appliedPromotion?.name ?? "Offre appliquée"}
                  </span>
                  <span className="font-bold">
                    −{formatFCFA(effectivePricing.promotionDiscount)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-brown-soft">
                <span>Livraison</span>
                <span className="font-bold text-brown">
                  {deliveryMode === "PICKUP" ? (
                    "Retrait — 0 FCFA"
                  ) : effectivePricing?.deliveryFee === 0 ? (
                    <span className="text-emerald-600">Offerte</span>
                  ) : (
                    formatFCFA(effectivePricing?.deliveryFee ?? settings.deliveryFee)
                  )}
                </span>
              </div>
              {effectivePricing &&
              effectivePricing.deliveryFeeBeforeDiscount > 0 &&
              effectivePricing.deliveryFee === 0 ? (
                <p className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700">
                  Livraison offerte par une promotion active.
                </p>
              ) : null}
            </div>

            <div className="mt-4 border-t border-brown/10 pt-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-brown-light">
                    Total estimé
                  </p>
                  <p className="text-[10px] text-brown-light">à confirmer par la boutique</p>
                </div>
                <p className="font-display text-[30px] leading-none text-mauve-900">
                  {formatFCFA(total)}
                </p>
              </div>
              {effectivePricing && effectivePricing.discountTotal > 0 ? (
                <p className="mt-2 text-right text-[10px] font-bold text-mauve-700">
                  Vous économisez {formatFCFA(effectivePricing.discountTotal)}
                </p>
              ) : null}
            </div>

            <div className="mt-4">
              <label htmlFor="promo-code" className="label-field">
                Code promo
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brown-light" />
                  <input
                    id="promo-code"
                    value={promoInput}
                    onChange={(event) => setPromoInput(event.target.value.toUpperCase())}
                    className="input-field pl-9 text-[12px] uppercase"
                    placeholder="EX. BIENVENUE10"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAppliedPromo(promoInput.trim())}
                  className="btn-secondary min-h-[46px] shrink-0 px-4 text-xs"
                >
                  Appliquer
                </button>
              </div>
              {effectivePricing?.promoMessage ? (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-2 text-[10px] font-semibold text-emerald-700">
                  <Check className="mt-0.5 h-3 w-3 shrink-0" />
                  {effectivePricing.promoMessage}
                </p>
              ) : null}
              {effectivePricing?.warning ? (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] font-semibold leading-4 text-amber-800">
                  <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                  {effectivePricing.warning}
                </p>
              ) : null}
              {previewError ? (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50 px-2.5 py-2 text-[10px] font-semibold leading-4 text-red-700">
                  <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                  {previewError}
                </p>
              ) : null}
            </div>

            {submitError ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] leading-5 text-red-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {submitError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={submit}
              disabled={submitting || loadingPreview}
              className="btn-primary mt-4 w-full py-3.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  Préparer ma commande
                </>
              )}
            </button>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-cream p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mauve" />
              <p className="text-[10px] leading-4 text-brown-soft">{settings.orderNote}</p>
            </div>

            <div className="mt-3 space-y-2 text-[10px] text-brown-light">
              <p className="flex items-start gap-1.5">
                <Clock3 className="mt-0.5 h-3 w-3 shrink-0" />
                La boutique confirme la disponibilité et le délai après réception du
                message WhatsApp.
              </p>
              <p className="flex items-start gap-1.5">
                <Package className="mt-0.5 h-3 w-3 shrink-0" />
                Les prix et remises sont recalculés côté serveur avant
                l'enregistrement.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
