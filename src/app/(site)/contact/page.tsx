import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  Sparkles,
  Truck,
} from "lucide-react";
import { getCachedSettings } from "@/lib/settings";
import { ContactComposer } from "@/components/site/contact-composer";
import { MediaImage } from "@/components/ui/media-image";
import { formatPhone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contacter Maison Gourmande à Keur Massar, Dakar : téléphone, WhatsApp, e-mail, adresse, horaires et zone de livraison.",
  alternates: { canonical: "/contact" },
};

const FAQ = [
  {
    question: "Comment passer commande ?",
    answer:
      "Composez votre panier sur le site puis validez pour préparer le message WhatsApp. La maison confirme la disponibilité, le total et le créneau avant préparation.",
  },
  {
    question: "Faut-il payer en ligne ?",
    answer:
      "Non. Aucun paiement n'est demandé sur le site. Les modalités sont convenues directement avec la boutique au moment de la confirmation.",
  },
  {
    question: "Livrez-vous partout à Dakar ?",
    answer:
      "La livraison dépend de la zone et du volume. Indiquez votre quartier et un repère : la maison confirme le tarif et le créneau sur WhatsApp.",
  },
  {
    question: "Comment demander un devis événement ?",
    answer:
      "Utilisez la page Événements pour décrire la date, le nombre de personnes, le budget et le lieu. Une demande de devis ne réserve pas automatiquement la date.",
  },
];

export default async function ContactPage() {
  const settings = await getCachedSettings();
  const whatsappDigits = settings.whatsapp.replace(/\D/g, "");
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
    `${settings.whatsappGreeting} J'aimerais vous contacter.`,
  )}`;
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`;
  const socials = [
    { href: settings.instagram, label: "Instagram", Icon: Instagram },
    { href: settings.facebook, label: "Facebook", Icon: Facebook },
    { href: settings.tiktok, label: "TikTok", Icon: Music2 },
  ].filter(
    (social) =>
      social.href &&
      !social.href.endsWith("instagram.com/") &&
      !social.href.endsWith("facebook.com/") &&
      !social.href.endsWith("tiktok.com/"),
  );

  return (
    <div className="pb-20">
      <section className="hero-grain relative overflow-hidden py-12 sm:py-16">
        <div className="pointer-events-none absolute -right-40 top-0 h-[420px] w-[420px] rounded-full bg-blob" aria-hidden="true" />
        <div className="container-page relative">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brown-light">
            <Link href="/" className="transition hover:text-mauve-800">Accueil</Link>
            <span aria-hidden="true">/</span>
            <span className="text-mauve-800">Contact</span>
          </nav>
          <div className="mt-7 max-w-3xl animate-fade-up">
            <p className="eyebrow"><span className="h-px w-6 bg-mauve" />On vous répond avec plaisir</p>
            <h1 className="mt-4 text-[44px] leading-[0.98] text-mauve-900 sm:text-[58px] lg:text-[66px]">
              Parlons de votre prochaine <em className="text-mauve">envie</em>.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-brown-soft sm:text-[15px]">
              Une commande, une question, un événement ou simplement l'envie de
              dire bonjour : la maison est joignable sur WhatsApp, par téléphone
              et par e-mail.
            </p>
          </div>
        </div>
      </section>

      <section className="pt-2">
        <div className="container-page">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="group rounded-[1.5rem] border border-brown/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mauve-100 text-mauve-700"><Phone className="h-4 w-4" /></span>
              <p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-brown-light">Téléphone</p>
              <p className="mt-1 text-[13px] font-extrabold text-brown group-hover:text-mauve-800">{formatPhone(settings.phone)}</p>
              <p className="mt-1 text-[9px] text-brown-light">Appel direct</p>
            </a>
            <a href={whatsappHref} target="_blank" rel="noreferrer noopener" className="group rounded-[1.5rem] border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><MessageCircle className="h-4 w-4" /></span>
              <p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-emerald-700/70">WhatsApp</p>
              <p className="mt-1 text-[13px] font-extrabold text-emerald-900">{formatPhone(settings.phone)}</p>
              <p className="mt-1 text-[9px] text-emerald-800/60">Le plus rapide</p>
            </a>
            <a href={`mailto:${settings.email}`} className="group rounded-[1.5rem] border border-brown/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mauve-100 text-mauve-700"><Mail className="h-4 w-4" /></span>
              <p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-brown-light">E-mail</p>
              <p className="mt-1 break-all text-[12px] font-extrabold text-brown group-hover:text-mauve-800">{settings.email}</p>
              <p className="mt-1 text-[9px] text-brown-light">Pour les demandes détaillées</p>
            </a>
            <a href={mapHref} target="_blank" rel="noreferrer noopener" className="group rounded-[1.5rem] border border-brown/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mauve-100 text-mauve-700"><MapPin className="h-4 w-4" /></span>
              <p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-brown-light">Nous trouver</p>
              <p className="mt-1 text-[12px] font-extrabold leading-5 text-brown group-hover:text-mauve-800">{settings.address}</p>
              <p className="mt-1 text-[9px] text-brown-light">Ouvrir dans Maps</p>
            </a>
          </div>
        </div>
      </section>

      <section className="pt-8">
        <div className="container-page">
          <div className="grid gap-5 xl:grid-cols-[1fr_390px] xl:items-start">
            <div className="space-y-5">
              <div className="overflow-hidden rounded-[2rem] border border-brown/10 bg-white shadow-card">
                <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="relative min-h-[220px] overflow-hidden bg-mauve-900">
                    <MediaImage src="/images/spread.jpg" alt="La table Maison Gourmande" sizes="(max-width: 1024px) 100vw, 40vw" className="absolute inset-0 h-full w-full" />
                    <span className="absolute inset-0 bg-gradient-to-t from-mauve-900/90 via-mauve-900/20 to-transparent" />
                    <div className="absolute inset-x-4 bottom-4">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-ochre-light">Maison Gourmande</p>
                      <p className="mt-1 font-display text-2xl text-white">La gourmandise, faite maison.</p>
                    </div>
                  </div>
                  <div className="p-5 sm:p-6">
                    <p className="eyebrow"><span className="h-px w-5 bg-mauve" />Horaires & livraison</p>
                    <div className="mt-3 flex gap-2.5 text-[12px] leading-6 text-brown-soft">
                      <Clock3 className="mt-1 h-4 w-4 shrink-0 text-mauve" />
                      <p className="whitespace-pre-line font-semibold">{settings.hours}</p>
                    </div>
                    <div className="mt-4 flex gap-2.5 rounded-xl bg-cream/70 p-3 text-[11px] leading-5 text-brown-soft">
                      <Truck className="mt-0.5 h-4 w-4 shrink-0 text-mauve" />
                      <div>
                        <p className="font-extrabold text-brown">Zone de livraison</p>
                        <p className="mt-0.5">{settings.cuisineZone}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {socials.map(({ href, label, Icon }) => (
                        <a key={label} href={href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 rounded-full border border-brown/10 bg-white px-3 py-1.5 text-[9px] font-bold text-brown-soft transition hover:border-mauve/30 hover:text-mauve-800">
                          <Icon className="h-3 w-3" />
                          {label}
                        </a>
                      ))}
                      <a href={mapHref} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 rounded-full bg-mauve-900 px-3 py-1.5 text-[9px] font-bold text-white transition hover:bg-mauve-800">
                        <MapPin className="h-3 w-3" />
                        Itinéraire
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-brown/10 bg-white p-5 shadow-card sm:p-6">
                <p className="eyebrow"><span className="h-px w-5 bg-mauve" />Questions fréquentes</p>
                <h2 className="mt-2 text-[28px] text-mauve-900">Avant de nous écrire</h2>
                <div className="mt-4 divide-y divide-brown/10">
                  {FAQ.map((item) => (
                    <details key={item.question} className="group py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[12px] font-extrabold text-brown [&::-webkit-details-marker]:hidden">
                        {item.question}
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream text-mauve-700 transition group-open:rotate-45">+</span>
                      </summary>
                      <p className="mt-2 pr-8 text-[11px] leading-6 text-brown-soft">{item.answer}</p>
                    </details>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-2 rounded-xl bg-mauve-100/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-[10px] font-bold text-mauve-800">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Un événement à organiser ?
                  </p>
                  <Link href="/evenements" className="inline-flex items-center gap-1 text-[10px] font-extrabold text-mauve-700 hover:text-mauve-900">
                    Demander un devis
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="xl:sticky xl:top-24">
              <ContactComposer whatsapp={whatsappDigits} greeting={settings.whatsappGreeting} />
              <div className="mt-3 flex items-start gap-2 rounded-2xl bg-mauve-900 p-3.5 text-[9px] leading-5 text-mauve-200/75">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ochre-light" />
                Pour une commande urgente, le téléphone ou WhatsApp reste le
                moyen le plus direct. Pensez à indiquer votre référence si vous
                en avez déjà une.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
