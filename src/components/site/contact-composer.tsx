"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";

const TOPICS = [
  "Une commande",
  "Un événement ou un devis",
  "Une question sur la carte",
  "Une collaboration / presse",
  "Autre",
];

export function ContactComposer({
  whatsapp,
  greeting,
}: {
  whatsapp: string;
  greeting: string;
}) {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [orderRef, setOrderRef] = useState("");

  const text = [
    greeting,
    "",
    `Je m'appelle ${name.trim() || "…"}.`,
    `Sujet : ${topic}.`,
    orderRef.trim() ? `Référence commande : ${orderRef.trim()}.` : null,
    "",
    message.trim() || "J'aimerais avoir quelques informations.",
  ]
    .filter((line) => line !== null)
    .join("\n");
  const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;

  return (
    <div className="rounded-[1.75rem] border border-brown/10 bg-white p-5 shadow-card sm:p-6">
      <p className="eyebrow">
        <span className="h-px w-5 bg-mauve" />
        Écrire à la maison
      </p>
      <h2 className="mt-2 text-[27px] leading-tight text-mauve-900">
        Préparons votre message.
      </h2>
      <p className="mt-1 text-[11px] leading-5 text-brown-light">
        Ce formulaire prépare un message WhatsApp. Il n'enregistre rien sur le
        site et ne crée aucune commande.
      </p>

      <div className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="admin-label">Votre nom</label>
            <input
              id="contact-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="admin-input"
              autoComplete="name"
              placeholder="Aïcha"
            />
          </div>
          <div>
            <label htmlFor="contact-topic" className="admin-label">Sujet</label>
            <select
              id="contact-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="admin-select"
            >
              {TOPICS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="contact-ref" className="admin-label">Référence de commande (facultatif)</label>
          <input
            id="contact-ref"
            value={orderRef}
            onChange={(event) => setOrderRef(event.target.value)}
            className="admin-input"
            placeholder="MG-2026-0001"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="admin-label">Votre message</label>
          <textarea
            id="contact-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            className="admin-textarea"
            placeholder="Dites-nous tout…"
          />
        </div>
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="btn-primary w-full"
        >
          <Send className="h-4 w-4" />
          Ouvrir WhatsApp
        </a>
        <p className="flex items-start gap-1.5 text-[9px] leading-4 text-brown-light">
          <MessageCircle className="mt-0.5 h-3 w-3 shrink-0 text-mauve" />
          Une commande n'est confirmée qu'après échange et validation avec la
          boutique. Aucun paiement en ligne n'est demandé.
        </p>
      </div>
    </div>
  );
}
