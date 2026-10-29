import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Database,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
} from "lucide-react";
import { getCachedSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment Maison Gourmande collecte, utilise et protège vos données personnelles, et comment exercer vos droits.",
  alternates: { canonical: "/confidentialite" },
};

const SECTIONS = [
  { id: "responsable", label: "Responsable" },
  { id: "donnees", label: "Données collectées" },
  { id: "finalites", label: "Finalités" },
  { id: "partage", label: "Partage" },
  { id: "conservation", label: "Conservation" },
  { id: "droits", label: "Vos droits" },
  { id: "securite", label: "Sécurité" },
  { id: "cookies", label: "Cookies & stockage" },
];

export default async function PrivacyPage() {
  const settings = await getCachedSettings();
  const updated = formatDate(new Date());

  return (
    <div className="pb-20">
      <section className="hero-grain relative overflow-hidden py-12">
        <div className="container-page relative">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brown-light">
            <Link href="/" className="transition hover:text-mauve-800">Accueil</Link>
            <span aria-hidden="true">/</span>
            <span className="text-mauve-800">Confidentialité</span>
          </nav>
          <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_0.45fr] lg:items-end">
            <div>
              <p className="eyebrow"><span className="h-px w-6 bg-mauve" />Vos données, votre confiance</p>
              <h1 className="mt-4 max-w-3xl text-[42px] leading-[1] text-mauve-900 sm:text-[54px]">
                Politique de confidentialité
              </h1>
              <p className="mt-4 max-w-2xl text-[13px] leading-7 text-brown-soft">
                La maison collecte le strict nécessaire pour répondre à vos
                demandes, préparer vos commandes et améliorer le service.
                Aucune donnée n'est vendue. Aucun paiement bancaire n'est
                effectué en ligne sur ce site.
              </p>
            </div>
            <div className="rounded-2xl border border-brown/10 bg-white/80 p-4 text-[10px] leading-5 text-brown-light shadow-sm">
              <p className="flex items-center gap-2 font-bold text-brown">
                <ShieldCheck className="h-4 w-4 text-mauve" />
                Version en vigueur
              </p>
              <p className="mt-1">Dernière mise à jour : {updated}</p>
              <p className="mt-2">
                Cette page décrit le fonctionnement du site. Les pages légales
                doivent être relues selon votre situation avant mise en ligne.
              </p>
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
              <section id="responsable" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-[24px] text-mauve-900">
                  <UserRoundCheck className="h-5 w-5 text-mauve" />
                  Responsable du traitement
                </h2>
                <p className="mt-3 text-[12px] leading-6 text-brown-soft">
                  Le responsable du traitement est <strong className="text-brown">{settings.brandName}</strong>, joignable à l'adresse{" "}
                  <strong className="text-brown">{settings.address}</strong>, par e-mail à{" "}
                  <a href={`mailto:${settings.email}`} className="font-semibold text-mauve-700 underline underline-offset-2">{settings.email}</a>{" "}
                  ou par téléphone au{" "}
                  <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="font-semibold text-mauve-700 underline underline-offset-2">{settings.phone}</a>.
                </p>
              </section>

              <section id="donnees" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-[24px] text-mauve-900">
                  <Database className="h-5 w-5 text-mauve" />
                  Données que nous pouvons collecter
                </h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl bg-cream/70 p-3">
                    <p className="text-[10px] font-extrabold text-brown">Commandes</p>
                    <p className="mt-1 text-[10px] leading-5 text-brown-soft">Nom, téléphone, mode de retrait ou de livraison, adresse et repère, produits, options, notes, créneau souhaité, montant et statut.</p>
                  </div>
                  <div className="rounded-xl bg-cream/70 p-3">
                    <p className="text-[10px] font-extrabold text-brown">Événements & devis</p>
                    <p className="mt-1 text-[10px] leading-5 text-brown-soft">Coordonnées, date, lieu, nombre de personnes, budget, envies et échanges nécessaires au devis.</p>
                  </div>
                  <div className="rounded-xl bg-cream/70 p-3">
                    <p className="text-[10px] font-extrabold text-brown">Avis clients</p>
                    <p className="mt-1 text-[10px] leading-5 text-brown-soft">Prénom ou nom affiché, note, message, produit concerné et accord de publication. L'adresse e-mail n'est pas demandée par le formulaire d'avis.</p>
                  </div>
                  <div className="rounded-xl bg-cream/70 p-3">
                    <p className="text-[10px] font-extrabold text-brown">Technique & sécurité</p>
                    <p className="mt-1 text-[10px] leading-5 text-brown-soft">Adresse IP et données de connexion pour la limitation d'abus, la sécurité et le journal d'audit de l'administration.</p>
                  </div>
                </div>
                <p className="mt-3 text-[10px] leading-5 text-brown-light">
                  Les données de paiement bancaire ne sont jamais collectées sur
                  le site : aucun paiement en ligne n'y est proposé.
                </p>
              </section>

              <section id="finalites" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-[24px] text-mauve-900">Pourquoi nous les utilisons</h2>
                <ul className="mt-3 space-y-2 text-[12px] leading-6 text-brown-soft">
                  <li className="flex gap-2"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-mauve" />Traiter et suivre vos commandes, vous contacter au sujet de leur préparation ou de leur livraison.</li>
                  <li className="flex gap-2"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-mauve" />Répondre à vos demandes de devis, de contact ou d'information.</li>
                  <li className="flex gap-2"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-mauve" />Publier les avis que vous avez accepté de partager, après modération.</li>
                  <li className="flex gap-2"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-mauve" />Assurer la sécurité du site, prévenir les abus et conserver les preuves nécessaires.</li>
                  <li className="flex gap-2"><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-mauve" />Respecter les obligations légales, comptables et de conservation applicables.</li>
                </ul>
                <p className="mt-3 text-[10px] leading-5 text-brown-light">
                  Les traitements reposent selon le cas sur l'exécution de votre
                  commande ou de votre demande, votre consentement (avis), nos
                  obligations légales ou notre intérêt légitime à sécuriser le
                  service.
                </p>
              </section>

              <section id="partage" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-[24px] text-mauve-900">Qui peut y accéder</h2>
                <p className="mt-3 text-[12px] leading-6 text-brown-soft">
                  Les personnes habilitées de la maison (selon leur rôle et les
                  permissions), les prestataires techniques nécessaires à
                  l'hébergement et à la sauvegarde, et les services de
                  messagerie lorsque vous choisissez de nous contacter via
                  WhatsApp. Ces prestataires n'utilisent pas vos données pour
                  leur propre publicité.
                </p>
                <p className="mt-2 text-[12px] leading-6 text-brown-soft">
                  Les données ne sont pas vendues, louées ni cédées à des fins
                  commerciales. Elles peuvent être communiquées si la loi
                  l'exige ou pour protéger les droits de la maison.
                </p>
              </section>

              <section id="conservation" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-[24px] text-mauve-900">Durée de conservation</h2>
                <p className="mt-3 text-[12px] leading-6 text-brown-soft">
                  Les commandes et les échanges utiles sont conservés le temps
                  nécessaire au service, au suivi et aux obligations comptables
                  applicables. Les avis restent publiés jusqu'à leur retrait, ou
                  plus tôt à votre demande. Les demandes qui ne donnent pas lieu
                  à une commande sont conservées seulement le temps utile au
                  traitement de la relation, puis supprimées ou anonymisées.
                </p>
              </section>

              <section id="droits" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-[24px] text-mauve-900">Vos droits</h2>
                <p className="mt-3 text-[12px] leading-6 text-brown-soft">
                  Vous pouvez demander à consulter, corriger ou supprimer vos
                  données, vous opposer à certains usages ou retirer votre
                  consentement pour un avis. Écrivez à{" "}
                  <a href={`mailto:${settings.email}`} className="font-semibold text-mauve-700 underline underline-offset-2">{settings.email}</a>{" "}
                  avec le sujet « Mes données ». Une vérification d'identité
                  raisonnable peut être demandée pour éviter qu'un tiers accède à
                  vos informations.
                </p>
                <p className="mt-2 text-[12px] leading-6 text-brown-soft">
                  Si vous estimez, après notre réponse, que vos droits ne sont
                  pas respectés, vous pouvez saisir la Commission de protection
                  des données personnelles (CDP) du Sénégal, autorité
                  administrative indépendante compétente en matière de données
                  personnelles, via{" "}
                  <a href="https://www.cdp.sn" target="_blank" rel="noreferrer noopener" className="font-semibold text-mauve-700 underline underline-offset-2">
                    cdp.sn
                  </a>.
                </p>
              </section>

              <section id="securite" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-[24px] text-mauve-900">
                  <LockKeyhole className="h-5 w-5 text-mauve" />
                  Sécurité
                </h2>
                <p className="mt-3 text-[12px] leading-6 text-brown-soft">
                  L'accès à l'administration nécessite une authentification
                  individuelle, des mots de passe stockés sous forme hachée et
                  des permissions vérifiées côté serveur. Les échanges avec le
                  site doivent se faire en HTTPS en production. Les actions
                  sensibles sont journalisées et les sauvegardes sont prévues au
                  déploiement.
                </p>
                <p className="mt-2 text-[10px] leading-5 text-brown-light">
                  Aucun système n'est infaillible. En cas d'incident affectant
                  vos données, nous prendrons les mesures appropriées et vous
                  informerons si nécessaire.
                </p>
              </section>

              <section id="cookies" className="scroll-mt-24 rounded-[1.5rem] border border-brown/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-[24px] text-mauve-900">Cookies, stockage local & liens externes</h2>
                <p className="mt-3 text-[12px] leading-6 text-brown-soft">
                  Le site utilise le stockage local de votre navigateur pour
                  conserver votre panier et votre préférence de thème clair ou
                  sombre. Le site ne dépose pas de cookie publicitaire ni
                  d'outil d'analyse d'audience par défaut. La session
                  d'administration est protégée par un cookie strictement
                  nécessaire.
                </p>
                <p className="mt-2 text-[12px] leading-6 text-brown-soft">
                  Les liens vers WhatsApp, Instagram, Facebook, TikTok ou Google
                  Maps ouvrent des services externes soumis à leurs propres
                  règles de confidentialité. Nous vous invitons à les consulter
                  avant utilisation.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={`mailto:${settings.email}`} className="btn-secondary btn-sm">
                    <Mail className="h-3.5 w-3.5" />Poser une question
                  </a>
                  <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer noopener" className="btn-secondary btn-sm">
                    <MessageCircle className="h-3.5 w-3.5" />WhatsApp
                  </a>
                  <Link href="/conditions" className="btn-secondary btn-sm">
                    Conditions de commande
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </section>

              <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-800">
                <Trash2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  Pour toute demande de suppression, précisez le numéro de
                  téléphone utilisé lors de la commande et, si possible, la
                  référence de commande. Les données devant être conservées par
                  la loi ne peuvent pas être supprimées immédiatement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
