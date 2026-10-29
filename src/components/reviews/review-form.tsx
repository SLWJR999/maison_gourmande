"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewForm({
  products,
}: {
  products: Array<{ id: string; name: string }>;
}) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  const [productId, setProductId] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");
  const [error, setError] = useState("");

  if (status === "success") {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-[1.75rem] border border-emerald-200 bg-emerald-50/80 p-7 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="mt-3 font-display text-2xl text-emerald-900">
          Merci pour votre mot doux
        </h3>
        <p className="mt-1 text-[12px] leading-6 text-emerald-800/80">
          Votre avis a bien été reçu. Il sera publié après validation par la
          maison. Aucune promesse de publication immédiate, promis.
        </p>
      </div>
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!consent) {
      setError("Merci de cocher l'accord de publication.");
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rating,
          message,
          consent,
          productId: productId || null,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!response.ok || !payload?.ok) {
        setError(payload?.error || "Impossible d'envoyer votre avis pour le moment.");
        setStatus("idle");
        return;
      }
      setStatus("success");
    } catch {
      setError("Connexion impossible. Réessayez dans un instant.");
      setStatus("idle");
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[1.75rem] border border-brown/10 bg-white p-5 shadow-card sm:p-6"
    >
      <p className="eyebrow">
        <span className="h-px w-5 bg-mauve" />
        Votre expérience
      </p>
      <h2 className="mt-2 text-[27px] leading-tight text-mauve-900">
        Racontez-nous votre gourmandise.
      </h2>
      <p className="mt-1 text-[11px] leading-5 text-brown-light">
        Les avis sont modérés avant publication. Votre nom ou prénom sera
        affiché, jamais votre numéro.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="review-name" className="admin-label">
            Prénom ou nom *
          </label>
          <input
            id="review-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={60}
            autoComplete="name"
            className="w-full rounded-xl border border-brown/15 bg-cream/60 px-3.5 py-3 text-sm text-brown outline-none transition placeholder:text-brown-light/70 focus:border-mauve/40 focus:bg-white focus:ring-4 focus:ring-mauve/10"
            placeholder="Aïcha K."
          />
        </div>

        <div>
          <span className="admin-label">Votre note *</span>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Note sur 5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(0)}
                className="rounded-md p-1 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve/40"
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition",
                    value <= (hovered || rating)
                      ? "fill-ochre text-ochre"
                      : "fill-transparent text-brown/20",
                  )}
                />
              </button>
            ))}
            <span className="ml-1 text-[10px] font-bold text-brown-light">
              {rating}/5
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="review-message" className="admin-label">
            Votre avis *
          </label>
          <textarea
            id="review-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
            minLength={10}
            maxLength={800}
            rows={4}
            className="admin-textarea"
            placeholder="Ce que vous avez aimé, la commande, l'accueil…"
          />
          <p className="mt-1 text-right text-[9px] text-brown-light">
            {message.length}/800
          </p>
        </div>

        {products.length > 0 ? (
          <div>
            <label htmlFor="review-product" className="admin-label">
              Produit concerné (facultatif)
            </label>
            <select
              id="review-product"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className="admin-select"
            >
              <option value="">Toute la maison</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <label className="flex items-start gap-2 rounded-xl bg-cream/70 p-3 text-[10px] leading-5 text-brown-soft">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            required
            className="mt-0.5 h-4 w-4 accent-mauve"
          />
          <span>
            J'accepte que mon prénom et mon avis soient publiés sur le site
            après validation. Ce n'est pas une commande.
          </span>
        </label>

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status === "sending"}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {status === "sending" ? "Envoi…" : "Envoyer mon avis"}
        </button>
      </div>
    </form>
  );
}
