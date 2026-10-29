"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { formatFCFA } from "@/lib/utils";

type ProductChoice = {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
};

type SuccessData = {
  reference: string;
  whatsappUrl: string;
};

const EVENT_TYPES = [
  "Anniversaire",
  "Baptême",
  "Mariage",
  "Événement d'entreprise",
  "Réunion de famille",
  "École / association",
  "Autre",
];

export function EventRequestForm({
  products,
  minLeadTime,
}: {
  products: ProductChoice[];
  minLeadTime: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [peopleCount, setPeopleCount] = useState(30);
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<SuccessData | null>(null);

  const toggleProduct = (product: ProductChoice) => {
    setSelection((current) => {
      if (current[product.id]) {
        const next = { ...current };
        delete next[product.id];
        return next;
      }
      return { ...current, [product.id]: 10 };
    });
  };

  const setQuantity = (id: string, value: number) => {
    setSelection((current) => ({
      ...current,
      [id]: Math.max(1, Math.min(2000, Math.floor(value) || 1)),
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Indiquez votre nom.");
    if (phone.replace(/\D/g, "").length < 8)
      return setError("Indiquez un numéro de téléphone joignable.");
    if (!eventDate) return setError("Choisissez la date de l'événement.");
    if (location.trim().length < 3) return setError("Indiquez le lieu de l'événement.");

    const chosenProducts = products
      .filter((product) => selection[product.id])
      .map((product) => ({
        productId: product.id,
        name: product.name,
        quantity: selection[product.id],
      }));

    setSubmitting(true);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          eventType,
          eventDate,
          eventTime,
          peopleCount,
          location: location.trim(),
          budget: Math.max(0, Number.parseInt(budget.replace(/\D/g, ""), 10) || 0),
          products: chosenProducts,
          notes: notes.trim(),
        }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        reference?: string;
        whatsappUrl?: string;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.reference || !data.whatsappUrl) {
        setError(data.error || "La demande n'a pas pu être envoyée.");
        return;
      }
      setSuccess({ reference: data.reference, whatsappUrl: data.whatsappUrl });
    } catch {
      setError("Connexion impossible. Réessayez dans quelques instants.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-[2rem] border border-brown/10 bg-white p-6 shadow-float sm:p-8">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="mt-4 font-display text-3xl text-mauve-900">
          Votre demande est enregistrée.
        </h3>
        <p className="mt-2 text-sm leading-7 text-brown-soft">
          Référence <span className="font-extrabold text-brown">{success.reference}</span>.
          La maison vous recontacte sous 24 h ouvrées pour préparer le devis. Aucune
          réservation n'est confirmée à ce stade.
        </p>
        <div className="mt-5 rounded-2xl bg-cream p-4">
          <p className="text-[11px] leading-5 text-brown-soft">
            Pour accélérer les échanges, envoyez aussi votre demande sur WhatsApp.
            Vous pourrez y ajouter vos questions ou vos photos d'inspiration.
          </p>
          <a
            href={success.whatsappUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-primary mt-3 w-full"
          >
            <MessageCircle className="h-4 w-4" />
            Continuer sur WhatsApp
          </a>
        </div>
        <button
          type="button"
          onClick={() => setSuccess(null)}
          className="btn-ghost mt-2 w-full text-xs"
        >
          Nouvelle demande
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[2rem] border border-brown/10 bg-white p-5 shadow-float sm:p-7"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-mauve-100 text-mauve-700">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-2xl text-mauve-900">Parlons de votre événement</h2>
          <p className="mt-1 text-[11px] leading-5 text-brown-light">
            {minLeadTime} · demande gratuite et sans engagement
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="event-name" className="label-field">
            Nom & prénom *
          </label>
          <input
            id="event-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="input-field"
            autoComplete="name"
            placeholder="Aïcha Koné"
          />
        </div>
        <div>
          <label htmlFor="event-phone" className="label-field">
            Téléphone / WhatsApp *
          </label>
          <input
            id="event-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="input-field"
            inputMode="tel"
            autoComplete="tel"
            placeholder="07 00 00 00 00"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="event-email" className="label-field">
            E-mail <span className="font-normal normal-case">(facultatif)</span>
          </label>
          <input
            id="event-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            className="input-field"
            autoComplete="email"
            placeholder="vous@exemple.com"
          />
        </div>
        <div>
          <label htmlFor="event-type" className="label-field">
            Type d'événement *
          </label>
          <select
            id="event-type"
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
            className="select-field"
          >
            {EVENT_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="event-people" className="label-field">
            Nombre de personnes *
          </label>
          <div className="relative">
            <Users className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-light" />
            <input
              id="event-people"
              value={peopleCount}
              onChange={(event) =>
                setPeopleCount(Math.max(1, Number.parseInt(event.target.value, 10) || 1))
              }
              type="number"
              min={1}
              max={5000}
              className="input-field pl-10"
            />
          </div>
        </div>
        <div>
          <label htmlFor="event-date" className="label-field">
            Date souhaitée *
          </label>
          <input
            id="event-date"
            type="date"
            min={today}
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="event-time" className="label-field">
            Heure souhaitée
          </label>
          <input
            id="event-time"
            type="time"
            value={eventTime}
            onChange={(event) => setEventTime(event.target.value)}
            className="input-field"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="event-location" className="label-field">
            Lieu de l'événement *
          </label>
          <input
            id="event-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="input-field"
            placeholder="Quartier, salle, domicile…"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="event-budget" className="label-field">
            Budget indicatif <span className="font-normal normal-case">(facultatif)</span>
          </label>
          <div className="relative">
            <input
              id="event-budget"
              value={budget}
              onChange={(event) => setBudget(event.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              className="input-field pr-16"
              placeholder="150000"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-brown-light">
              FCFA
            </span>
          </div>
          {budget ? (
            <p className="mt-1 text-[10px] font-semibold text-mauve-700">
              {formatFCFA(Number(budget))}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <p className="label-field">Produits souhaités <span className="font-normal normal-case">(facultatif)</span></p>
        <div className="grid gap-2 sm:grid-cols-2">
          {products.map((product) => {
            const active = Boolean(selection[product.id]);
            return (
              <div
                key={product.id}
                className={`flex items-center gap-2 rounded-xl border p-2 transition ${
                  active ? "border-mauve bg-mauve-100/50" : "border-brown/10 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleProduct(product)}
                  aria-pressed={active}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      active ? "bg-mauve text-white" : "bg-cream text-brown-light"
                    }`}
                  >
                    {active ? <Check className="h-3 w-3" strokeWidth={3} /> : <Plus className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-extrabold text-brown">
                      {product.name}
                    </span>
                    <span className="block text-[9px] text-brown-light">
                      Dès {formatFCFA(product.price)}
                    </span>
                  </span>
                </button>
                {active ? (
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    value={selection[product.id]}
                    onChange={(event) => setQuantity(product.id, Number(event.target.value))}
                    aria-label={`Quantité de ${product.name}`}
                    className="w-16 rounded-lg border border-brown/15 bg-white px-2 py-1.5 text-center text-[11px] font-bold text-brown outline-none focus:border-mauve/40"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="mt-1.5 text-[10px] text-brown-light">
          Indiquez des quantités estimées : la composition finale sera ajustée sur
          devis.
        </p>
      </div>

      <div className="mt-5">
        <label htmlFor="event-notes" className="label-field">
          Contraintes, inspirations, précisions
        </label>
        <textarea
          id="event-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          maxLength={1500}
          className="textarea-field"
          placeholder="Thème de l'anniversaire, allergies, livraison sur place, dressage…"
        />
      </div>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] leading-5 text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      ) : null}

      <button type="submit" disabled={submitting} className="btn-primary mt-5 w-full py-3.5">
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Envoi de la demande…
          </>
        ) : (
          <>
            Demander mon devis
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="mt-2 text-center text-[10px] leading-4 text-brown-light">
        Cette demande n'est pas une réservation. La maison vous répond sous 24 h
        ouvrées pour confirmer les disponibilités, le prix et les modalités.{" "}
        <Link href="/confidentialite" className="underline">
          Confidentialité
        </Link>
      </p>
    </form>
  );
}
