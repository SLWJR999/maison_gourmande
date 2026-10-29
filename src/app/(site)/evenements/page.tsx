import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChefHat,
  Clock3,
  HeartHandshake,
  MessageCircle,
  Sparkles,
  Truck,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { getActiveBanners, getMenuData } from "@/lib/catalog";
import { getCachedSettings } from "@/lib/settings";
import { EventRequestForm } from "@/components/events/event-request-form";
import { MediaImage } from "@/components/ui/media-image";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { formatFCFA } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Anniversaires & événements",
  description:
    "Devis pour anniversaires, baptêmes, événements d'entreprise et commandes en gros à Keur Massar et Dakar. Composez votre offre avec Maison Gourmande.",
  alternates: { canonical: "/evenements" },
};

const OCCASIONS = [
  {
    title: "Anniversaires",
    text: "Des box à partager, des plateaux généreux et une présentation qui fait plaisir.",
    icon: Sparkles,
  },
  {
    title: "Baptêmes & famille",
    text: "Des quantités adaptées, des saveurs qui rassemblent et un service soigné.",
    icon: HeartHandshake,
  },
  {
    title: "Entreprises",
    text: "Petits-déjeuners, pauses gourmandes, déjeuners d'équipe et séminaires.",
    icon: Users,
  },
  {
    title: "Grandes tablées",
    text: "Commandes en gros, buffets et assortiments sur devis selon vos envies.",
    icon: UtensilsCrossed,
  },
];

const PROCESS = [
  { step: "01", title: "Vous racontez", text: "Date, nombre de personnes, lieu, budget et envies." },
  { step: "02", title: "On compose", text: "La maison propose une sélection et un devis adapté." },
  { step: "03", title: "On confirme", text: "Vous validez le devis et les modalités de livraison." },
  { step: "04", title: "On régale", text: "Tout est préparé pour le jour J, prêt à être partagé." },
];

const FAQ = [
  {
    question: "Combien de temps à l'avance faut-il commander ?",
    answer:
      "Pour les événements, comptez idéalement 24 à 48 h. Les grandes tablées et les compositions sur mesure sont à confirmer le plus tôt possible, surtout le week-end.",
  },
  {
    question: "Le formulaire réserve-t-il automatiquement la date ?",
    answer:
      "Non. Il s'agit d'une demande de devis. La réservation devient ferme après échange avec la maison et validation des produits, du prix et du créneau.",
  },
  {
    question: "Peut-on adapter les quantités et les produits ?",
    answer:
      "Oui. Les box, plateaux et assortiments se composent selon le nombre de personnes, le budget et les goûts. Indiquez vos contraintes dans le formulaire.",
  },
  {
    question: "Livrez-vous sur le lieu de l'événement ?",
    answer:
      "La livraison est possible à Keur Massar et Dakar selon la zone. Le tarif et le créneau sont précisés dans le devis pour éviter toute mauvaise surprise.",
  },
  {
    question: "Comment se passe le paiement ?",
    answer:
      "Aucun paiement en ligne n'est demandé. Les modalités sont convenues directement avec la boutique lors de la confirmation du devis.",
  },
];

export default async function EventsPage() {
  const [menu, banners, settings] = await Promise.all([
    getMenuData(),
    getActiveBanners("EVENTS"),
    getCachedSettings(),
  ]);

  const products = menu.products
    .filter((row) => row.product.availability === "AVAILABLE")
    .slice(0, 14)
    .map((row) => ({
      id: row.product.id,
      name: row.product.name,
      category: row.category.name,
      price: Math.min(...row.variants.map((variant) => variant.price)),
      imageUrl: row.product.imageUrl,
    }));

  const banner = banners[0];
  const whatsappHref = `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `${settings.whatsappGreeting} Je souhaite organiser un événement et obtenir un devis.`,
  )}`;

  return (
    <div className="pb-20">
      <section className="hero-grain relative overflow-hidden pb-12 pt-8 sm:pt-12">
        <div
          className="pointer-events-none absolute -right-44 -top-20 h-[520px] w-[520px] rounded-full bg-blob"
          aria-hidden="true"
        />
        <div className="container-page relative">
          <nav
            aria-label="Fil d'Ariane"
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brown-light"
          >
            <Link href="/" className="transition hover:text-mauve-800">
              Accueil
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-mauve-800">Événements</span>
          </nav>

          <div className="mt-6 grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
            <div className="animate-fade-up">
              <p className="eyebrow">
                <span className="h-px w-6 bg-mauve" />
                Anniversaires & événements
              </p>
              <h1 className="mt-4 max-w-2xl text-[44px] leading-[0.98] text-mauve-900 sm:text-[58px] lg:text-[64px]">
                Vos grands moments méritent une{" "}
                <em className="text-mauve">belle table</em>.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-brown-soft sm:text-[15px]">
                {settings.eventIntro}
              </p>
              <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                <a href="#devis" className="btn-primary">
                  Demander un devis
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn-secondary"
                >
                  <MessageCircle className="h-4 w-4" />
                  En parler sur WhatsApp
                </a>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-bold text-brown-soft">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-mauve" />
                  {settings.minLeadTime}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-mauve" />
                  Livraison sur le lieu
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ChefHat className="h-4 w-4 text-mauve" />
                  Sur mesure
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 overflow-hidden rounded-[2rem] shadow-float">
                <MediaImage
                  src={banner?.imageUrl || "/images/event.jpg"}
                  alt={banner?.title || "Table d'événement Maison Gourmande"}
                  sizes="(max-width: 1024px) 92vw, 44vw"
                  className="aspect-[16/9] w-full"
                  priority
                />
              </div>
              <MediaImage
                src="/images/event-2.jpg"
                alt="Plateaux gourmands pour événement"
                sizes="(max-width: 1024px) 45vw, 22vw"
                className="aspect-[4/3] w-full rounded-[1.5rem]"
              />
              <div className="flex flex-col justify-center rounded-[1.5rem] bg-mauve-900 p-4 text-center text-white">
                <span className="font-display text-[34px] leading-none">24h</span>
                <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.15em] text-mauve-200/70">
                  pour vous répondre
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-10">
        <div className="container-page">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {OCCASIONS.map((item, index) => (
              <Reveal key={item.title} delay={(index % 4) as 0 | 1 | 2 | 3}>
                <div className="flex h-full gap-3 rounded-[1.5rem] border border-brown/10 bg-white p-4 shadow-card">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-mauve-100 text-mauve-700">
                    <item.icon className="h-4.5 w-4.5" size={18} />
                  </span>
                  <div>
                    <h2 className="font-display text-[19px] text-brown">{item.title}</h2>
                    <p className="mt-1 text-[11.5px] leading-5 text-brown-soft">{item.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="container-page">
          <SectionHeading
            eyebrow="Comment ça se passe"
            title={
              <>
                Une demande simple, un devis <em className="text-mauve">sur mesure</em>.
              </>
            }
            description="Pas de paiement en ligne, pas de réservation automatique : on échange d'abord pour construire exactement ce qu'il vous faut."
          />
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((item, index) => (
              <Reveal key={item.step} delay={(index % 4) as 0 | 1 | 2 | 3}>
                <div className="relative h-full rounded-[1.5rem] bg-cream-deep p-5">
                  <span className="font-display text-[30px] leading-none text-mauve/25">
                    {item.step}
                  </span>
                  <h3 className="mt-3 font-display text-xl text-mauve-900">{item.title}</h3>
                  <p className="mt-1.5 text-[12px] leading-6 text-brown-soft">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="devis" className="scroll-mt-24 pt-14">
        <div className="container-page">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <SectionHeading
                eyebrow="Le devis"
                title={
                  <>
                    Racontez-nous votre <em className="text-mauve">événement</em>.
                  </>
                }
                description="Quelques informations suffisent pour recevoir une proposition claire : produits, quantités, prix et modalités."
              />
              <div className="mt-6 space-y-3">
                {[
                  { icon: CalendarDays, text: "Date et heure souhaitées, sous réserve de disponibilité." },
                  { icon: Users, text: "Nombre de personnes et budget indicatif." },
                  { icon: MapPinText, text: "Lieu, livraison ou retrait sur place." },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-2.5 text-[12px] leading-5 text-brown-soft">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-mauve">
                      <item.icon className="h-3.5 w-3.5" />
                    </span>
                    {item.text}
                  </div>
                ))}
              </div>

              <div className="mt-6 overflow-hidden rounded-[1.75rem] bg-mauve-900 p-5 text-white">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-mauve-200">
                  Bon à savoir
                </p>
                <p className="mt-2 text-[12px] leading-6 text-mauve-200/80">
                  Les prix des exemples ci-dessous sont indicatifs. La composition,
                  les quantités et le tarif final sont confirmés dans le devis.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {products.slice(0, 2).map((product) => (
                    <div key={product.id} className="rounded-xl bg-white/10 p-3">
                      <p className="text-[10px] font-bold leading-4 text-white">{product.name}</p>
                      <p className="mt-1 font-display text-lg text-mauve-100">
                        dès {formatFCFA(product.price)}
                      </p>
                    </div>
                  ))}
                </div>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white/80 transition hover:text-white"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Discuter d'abord sur WhatsApp
                </a>
              </div>
            </div>

            <Reveal delay={1}>
              <EventRequestForm products={products} minLeadTime={settings.minLeadTime} />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="container-page">
          <div className="grid gap-4 sm:grid-cols-3">
            {["/images/event-3.jpg", "/images/spread.jpg", "/images/event.jpg"].map((src, index) => (
              <Reveal key={src} delay={(index % 3) as 0 | 1 | 2}>
                <MediaImage
                  src={src}
                  alt="Exemple de table gourmande pour événement"
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="aspect-[4/3] w-full rounded-[1.5rem] shadow-card"
                  imageClassName="transition duration-700 hover:scale-105"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-14">
        <div className="container-page">
          <SectionHeading
            eyebrow="Questions fréquentes"
            title={
              <>
                Tout ce qu'il faut savoir <em className="text-mauve">avant de réserver</em>.
              </>
            }
          />
          <div className="mt-6 divide-y divide-brown/10 rounded-[1.5rem] border border-brown/10 bg-white px-5">
            {FAQ.map((item) => (
              <details key={item.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-extrabold text-brown">
                  {item.question}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mauve-100 text-mauve-700 transition group-open:rotate-45">
                    <span className="text-lg leading-none">+</span>
                  </span>
                </summary>
                <p className="mt-2 pr-9 text-[12px] leading-6 text-brown-soft">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MapPinText({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
