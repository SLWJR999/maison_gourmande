import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  MessageCircle,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Truck,
  WheatOff,
} from "lucide-react";
import { getCachedSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conditions de commande",
  description:
    "Conditions de commande Maison Gourmande : prix, confirmation WhatsApp, livraison, promotions, allergènes, événements et droit applicable.",
  alternates: { canonical: "/conditions" },
};

const SECTIONS = [
  { id: "maison", label: "La maison" },
  { id: "commande", label: "Commande" },
  { id: "prix", label: "Prix & paiement" },
  { id: "livraison", label: "Livraison" },
  { id: "promotions", label: "Promotions" },
  { id: "allergenes", label: "Allergènes" },
  { id: "annulation", label: "Annulation" },
  { id: "avis", label: "Avis" },
  { id: "droit", label: "Droit applicable" },
];

export default async function TermsPage() {
  const settings = await getCachedSettings();
  const updated = formatDate(new Date());

  return (
    <div className="pb-20">
      <section className="hero-grain relative overflow-hidden py-12">
        <div className="container-page relative">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brown-light">
            <Link href="/" className="transition hover:text-mauve-800">Accueil</Link>
            <span aria-hidden="true">/</span>
            <span className="text-mauve-800">Conditions de commande</span>
          </nav>
          <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_0.4fr] lg:items-end">
            <div>
              <p className="eyebrow"><span className="h-px w-6 bg-mauve" />Commander en toute clarté</p>
              <h1 className="mt-4 max-w-3xl text-[42px] leading-[1] text-mauve-900 sm:text-[54px]">
                Conditions de commande
              </h1>
              <p className="mt-4 max-w-2xl text-[13px] leading-7 text-brown-soft">
                Les règles simples qui encadrent une commande, une livraison,
                une promotion ou un devis événement. En validant votre panier,
                vous prenez connaissance de ces conditions.
              </p>
            </div>
            <div className="rounded-2xl border border-brown/10 bg-white/80 p-4 text-[10px] leading-5 text-brown-light shadow-sm">
              <p className="flex items-center gap-2 font-bold text-brown">
                <BadgeCheck className="h-4 w-4 text-mauve" />
                Version en vigueur
              </p>
              <p className="mt-1">Dernière mise à jour : {updated}</p>
              <p className="mt-2">Aucun paiement en ligne — confirmation par la boutique.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-2">
        <div className="container-page">
          <div className="grid gap-5 lg:grid-cols-[220px_1fr] lg:items-start">
            <nav className="no-scrollbar sticky top-24 hidden rounded-2xl border border-brown/10 bg-white p-3 shadow-sm lg:block" aria-label="Sommaire">
              <p className="px-2 pb-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-brown-light">Sommaire</p>
              <ul className="space-y-0.5">
                {SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="block rounded-lg px-2 py-1.5 text-[10px] font-bold text-brown-soft transition hover:bg-cream hover:text-mauve-800">
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-mauve-900 p-4 text-white">
                  <ShoppingBag className="h-4 w-4 text-ochre-light" />
                  <p className="mt-2 text-[11px] font-extrabold">Panier</p>
                  <p className="mt-0.5 text-[9px] leading-4 text-mauve-200/70">Vous choisissez produits, formats et options.</p>
                </div>
                <div className="rounded-2xl border border-brown/10 bg-white p-4 shadow-sm">
                  <MessageCircle className="h-4 w-4 text-mauve" />
                  <p className="mt-2 text-[11px] font-extrabold text-brown">WhatsApp</p>
                  <p className="mt-0.5 text-[9px] leading-4 text-brown-light">Le message part avec votre référence.</p>
                </div>
                <div className="rounded-2xl border border-brown/10 bg-white p-4 shadow-sm">
                  <BadgeCheck className="h-4 w-4 text-emerald-600" />
                  <p className="mt-2 text-[11px] font-extrabold text-brown">Confirmation</p>
                  <p className="mt-0.5 text-[9px] leading-4 text-brown-light">La boutique valide le total et le créneau.</p>
                </div>
              </div>

              <section id="maison" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-[24px] text-mauve-900">
                  <Scale className="h-5 w-5 text-mauve" />
                  La maison
                </h2>
                <p className="mt-3 text-[12px] leading-6 text-brown-soft">
                  Le site est édité par <strong className="text-brown">{settings.brandName}</strong>, {settings.address}. Contact :{" "}
                  <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="font-semibold text-mauve-700 underline underline-offset-2">{settings.phone}</a>{" "}
                  ·{" "}
                  <a href={`mailto:${settings.email}`} className="font-semibold text-mauve-700 underline underline-offset-2">{settings.email}</a>.
                  Informations d'identification : {settings.rccm}.
                </p>
              </section>

              <section id="commande" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-[24px] text-mauve-900">
                  <ShoppingBag className="h-5 w-5 text-mauve" />
                  Comment une commande devient ferme
                </h2>
                <p className="mt-3 text-[12px] leading-6 text-brown-soft">
                  Le panier permet de préparer la commande. Lorsque vous validez,
                  celle-ci est <strong className="text-brown">enregistrée avec un statut en attente</strong> et
                  un message WhatsApp est préparé pour la boutique. Le simple fait
                  d'ouvrir WhatsApp, d'envoyer le message ou de cliquer sur un
                  bouton ne confirme pas automatiquement la commande.
                </p>
                <p className="mt-2 text-[12px] leading-6 text-brown-soft">
                  La commande devient ferme après réponse de la maison, vérification
                  des disponibilités, du total, du mode de remise et du créneau.
                  La maison peut proposer une substitution ou annuler une ligne
                  devenue indisponible ; vous restez libre de refuser avant la
                  confirmation.
                </p>
                <div className="mt-3 rounded-xl border border-mauve/20 bg-mauve-100/40 p-3 text-[10px] leading-5 text-mauve-800">
                  Conservez votre référence de commande : elle permet de suivre le
                  statut et de retrouver l'échange avec la boutique.
                </div>
              </section>

              <section id="prix" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-[24px] text-mauve-900">
                  <CreditCard className="h-5 w-5 text-mauve" />
                  Prix & paiement
                </h2>
                <ul className="mt-3 space-y-2 text-[12px] leading-6 text-brown-soft">
                  <li className="flex gap-2"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-mauve" />Les prix sont indiqués en francs CFA (FCFA), toutes taxes comprises lorsque applicable. Ils peuvent évoluer ; le prix applicable est celui recalculé côté serveur au moment de la validation, puis confirmé par la boutique.</li>
                  <li className="flex gap-2"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-mauve" />Les suppléments d'options et les frais de livraison sont ajoutés au total affiché avant confirmation.</li>
                  <li className="flex gap-2"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-mauve" />Aucun paiement en ligne n'est demandé ni traité par le site. Aucune donnée de carte bancaire n'est collectée.</li>
                  <li className="flex gap-2"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-mauve" />Les modalités de règlement sont convenues directement avec la boutique lors de la confirmation.</li>
                </ul>
                <p className="mt-3 text-[10px] leading-5 text-brown-light">
                  Les photographies sont illustratives et peuvent être remplacées.
                  La composition exacte et les allergènes sont indiqués sur la
                  fiche produit lorsqu'ils sont renseignés.
                </p>
              </section>

              <section id="livraison" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-[24px] text-mauve-900">
                  <Truck className="h-5 w-5 text-mauve" />
                  Retrait, livraison & créneau
                </h2>
                <p className="mt-3 text-[12px] leading-6 text-brown-soft">
                  La livraison est disponible dans la zone indiquée par la maison
                  : {settings.cuisineZone}. Le tarif dépend du mode choisi et de
                  la zone ; il est affiché ou confirmé avant la validation. Une
                  adresse précise et un repère facilitent la livraison.
                </p>
                <p className="mt-2 text-[12px] leading-6 text-brown-soft">
                  Le créneau souhaité est une préférence, pas une réservation
                  automatique. Il devient ferme après confirmation par la boutique.
                  En cas de retard ou d'imprévu, la maison vous contacte au numéro
                  indiqué. Pour le retrait, présentez votre référence.
                </p>
              </section>

              <section id="promotions" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-[24px] text-mauve-900">
                  <CalendarDays className="h-5 w-5 text-mauve" />
                  Promotions & remise quantité
                </h2>
                <ul className="mt-3 space-y-2 text-[12px] leading-6 text-brown-soft">
                  <li className="flex gap-2"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-mauve" />La remise quantité est calculée en premier. Ensuite, une seule meilleure offre est appliquée à la commande ; les offres ne s'empilent pas.</li>
                  <li className="flex gap-2"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-mauve" />En cas d'égalité de valeur, le code saisi par le client est prioritaire, puis l'offre dont le nom vient alphabétiquement en premier.</li>
                  <li className="flex gap-2"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-mauve" />Les offres limitées comptent les commandes enregistrées et non annulées. Un clic WhatsApp seul ne crée pas une commande éligible et ne consomme pas une utilisation.</li>
                  <li className="flex gap-2"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-mauve" />Les conditions de date, jour, horaire, montant, catégories, produits, fidélité et limites sont vérifiées côté serveur. Une offre expirée ou épuisée peut être refusée même si elle apparaît encore dans un ancien message.</li>
                  <li className="flex gap-2"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-mauve" />Les promotions ne sont pas rétroactives, sauf indication contraire de la maison, et ne peuvent pas être échangées contre de l'espèce.</li>
                </ul>
              </section>

              <section id="allergenes" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-[24px] text-mauve-900">
                  <WheatOff className="h-5 w-5 text-mauve" />
                  Allergènes & composition
                </h2>
                <p className="mt-3 text-[12px] leading-6 text-brown-soft">
                  Les produits peuvent contenir ou être en contact avec du gluten,
                  du lait, des œufs, des arachides, des fruits à coque, du soja,
                  du poisson, des crustacés ou d'autres allergènes selon les
                  recettes et les options. Les informations disponibles figurent
                  sur les fiches produits.
                </p>
                <p className="mt-2 text-[12px] leading-6 text-brown-soft">
                  La cuisine manipule plusieurs ingrédients dans un même espace :
                  une absence totale de contamination croisée ne peut pas être
                  garantie. En cas d'allergie sévère, contactez la maison{" "}
                  <strong className="text-brown">avant</strong> de commander pour
                  vérifier la faisabilité.
                </p>
              </section>

              <section id="annulation" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-[24px] text-mauve-900">Modification & annulation</h2>
                <p className="mt-3 text-[12px] leading-6 text-brown-soft">
                  Contactez la maison le plus tôt possible avec votre référence.
                  Une commande peut être modifiée ou annulée tant que la
                  préparation n'a pas commencé. Une fois les produits préparés ou
                  remis, l'annulation peut ne plus être possible. Les commandes
                  événementielles suivent les modalités indiquées dans le devis
                  accepté.
                </p>
                <p className="mt-2 text-[10px] leading-5 text-brown-light">
                  La maison peut annuler une commande en cas d'indisponibilité
                  majeure, d'information inexacte, d'usage abusif d'une promotion
                  ou de suspicion de fraude, en vous informant lorsque possible.
                </p>
              </section>

              <section id="avis" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-[24px] text-mauve-900">Avis clients</h2>
                <p className="mt-3 text-[12px] leading-6 text-brown-soft">
                  Les avis sont publiés après modération et avec votre accord sur
                  l'affichage de votre prénom ou nom. La maison peut refuser ou
                  retirer un contenu injurieux, diffamatoire, trompeur, hors sujet
                  ou comportant des données personnelles de tiers. Un avis n'est
                  pas un canal de réclamation urgente : pour une commande en
                  cours, contactez directement la boutique.
                </p>
              </section>

              <section id="droit" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-[24px] text-mauve-900">
                  <ShieldCheck className="h-5 w-5 text-mauve" />
                  Responsabilité & droit applicable
                </h2>
                <p className="mt-3 text-[12px] leading-6 text-brown-soft">
                  La maison met en œuvre les moyens raisonnables pour assurer
                  l'exactitude des informations et la disponibilité du site. Les
                  services externes (WhatsApp, réseaux sociaux, cartes) disposent
                  de leurs propres conditions. La responsabilité de la maison ne
                  peut être engagée pour un dommage résultant d'un usage
                  frauduleux, d'une interruption indépendante de sa volonté ou
                  d'informations transmises de manière inexacte par le client.
                </p>
                <p className="mt-2 text-[12px] leading-6 text-brown-soft">
                  Les présentes conditions sont soumises au droit sénégalais. En cas
                  de désaccord, une solution amiable sera recherchée en priorité.
                  À défaut, les juridictions compétentes de Dakar pourront être
                  saisies, sous réserve des règles protectrices applicables aux
                  consommateurs.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/confidentialite" className="btn-secondary btn-sm">
                    Données personnelles
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer noopener" className="btn-primary btn-sm">
                    <MessageCircle className="h-3.5 w-3.5" />Contacter la maison
                  </a>
                </div>
              </section>

              <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  Ces conditions constituent un modèle adapté au fonctionnement
                  du site et doivent être vérifiées selon votre statut juridique,
                  vos assurances et la réglementation applicable avant la mise en
                  production.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
