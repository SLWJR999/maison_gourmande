import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ChefHat,
  Heart,
  Leaf,
  MessageCircle,
  PackageOpen,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { getCachedSettings } from "@/lib/settings";
import { MediaImage } from "@/components/ui/media-image";
import { Reveal } from "@/components/ui/reveal";
import { VideoSection } from "@/components/site/video-section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "L'histoire, les valeurs et la cuisine de Maison Gourmande à Keur Massar, Dakar : des recettes généreuses préparées chaque jour, à partager.",
  alternates: { canonical: "/a-propos" },
};

const VALUES = [
  {
    title: "Fait maison, chaque jour",
    text: "Les recettes sont préparées en petites quantités, avec des produits choisis et une attention réelle au goût.",
    Icon: ChefHat,
  },
  {
    title: "Généreux par nature",
    text: "Une garniture qui se voit, une pâte qui croustille, une boîte qui donne envie d'ouvrir : la générosité n'est pas une option.",
    Icon: Heart,
  },
  {
    title: "Proche de vous",
    text: "Un numéro direct, WhatsApp, des horaires clairs et une équipe qui connaît ses habitués. La maison reste accessible.",
    Icon: MessageCircle,
  },
  {
    title: "Emballé avec soin",
    text: "Des contenants pratiques pour les livraisons et les grandes tablées, pensés pour que tout arrive en bel état.",
    Icon: PackageOpen,
  },
];

export default async function AboutPage() {
  const settings = await getCachedSettings();
  const whatsappHref = `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `${settings.whatsappGreeting} J'aimerais en savoir plus sur la maison.`,
  )}`;

  return (
    <div className="pb-20">
      <section className="hero-grain relative overflow-hidden py-12 sm:py-16">
        <div className="pointer-events-none absolute -right-32 top-12 h-[420px] w-[420px] rounded-full bg-blob" aria-hidden="true" />
        <div className="container-page relative">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brown-light">
            <Link href="/" className="transition hover:text-mauve-800">Accueil</Link>
            <span aria-hidden="true">/</span>
            <span className="text-mauve-800">À propos</span>
          </nav>

          <div className="mt-7 grid items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div className="animate-fade-up">
              <p className="eyebrow"><span className="h-px w-6 bg-mauve" />Notre histoire</p>
              <h1 className="mt-4 max-w-2xl text-[44px] leading-[0.98] text-mauve-900 sm:text-[56px] lg:text-[64px]">
                {settings.aboutTitle}
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-brown-soft sm:text-[15px]">
                {settings.aboutText}
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <Link href="/menu" className="btn-primary">
                  Découvrir la carte
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href={whatsappHref} target="_blank" rel="noreferrer noopener" className="btn-secondary">
                  <MessageCircle className="h-4 w-4" />
                  Nous écrire
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[480px]">
              <div className="relative overflow-hidden rounded-[2.25rem] bg-mauve-100 shadow-float">
                <MediaImage src="/images/chef.jpg" alt="La cuisine Maison Gourmande" sizes="(max-width: 1024px) 92vw, 42vw" className="aspect-[4/4.5] w-full" priority />
                <span className="absolute inset-0 bg-gradient-to-t from-mauve-900/60 via-transparent to-transparent" />
                <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/15 bg-white/10 p-3.5 text-white backdrop-blur-md">
                  <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-ochre-light">
                    <Sparkles className="h-3 w-3" />
                    La maison
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-white/90">
                    Une cuisine de quartier, généreuse et sans artifice, à
                    savourer sur place, à emporter ou en livraison.
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 hidden items-center gap-2 rounded-2xl border border-brown/10 bg-white px-4 py-3 shadow-card sm:flex">
                <Star className="h-4 w-4 fill-ochre text-ochre" />
                <p className="text-[10px] font-extrabold uppercase leading-4 tracking-wider text-brown-soft">
                  Recettes maison
                  <span className="block text-[9px] font-semibold normal-case tracking-normal text-brown-light">
                    Préparées à la commande
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-10">
        <div className="container-page">
          <div className="rounded-[2rem] border border-brown/10 bg-white p-6 shadow-card sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="eyebrow"><span className="h-px w-5 bg-mauve" />Ce qui nous guide</p>
                <h2 className="mt-2 text-[32px] leading-tight text-mauve-900 sm:text-[38px]">
                  Une maison avant tout <em className="text-mauve">humaine</em>.
                </h2>
                <p className="mt-3 max-w-md text-[12px] leading-6 text-brown-soft">
                  Nous croyons aux recettes simples qui font plaisir, aux
                  échanges directs et aux détails qui changent une commande.
                  Chaque boîte part avec un peu de la maison.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {VALUES.map(({ title, text, Icon }) => (
                  <div key={title} className="rounded-2xl bg-cream/70 p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mauve-100 text-mauve-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="mt-3 text-[12px] font-extrabold text-brown">{title}</h3>
                    <p className="mt-1 text-[10px] leading-5 text-brown-soft">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-10">
        <div className="container-page">
          <Reveal>
            <VideoSection
              videoUrl={settings.videoUrl}
              poster={settings.videoPoster}
              title={settings.videoTitle}
              text={settings.videoText}
            />
          </Reveal>
        </div>
      </section>

      <section className="pt-12">
        <div className="container-page">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.75rem] bg-mauve-900 p-5 text-white">
              <Leaf className="h-5 w-5 text-ochre-light" />
              <h2 className="mt-3 text-[20px] leading-tight text-white">Des choix simples</h2>
              <p className="mt-1 text-[10px] leading-5 text-mauve-200/75">
                Des ingrédients sélectionnés avec soin et des préparations
                réalisées au fil de la journée.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-brown/10 bg-white p-5 shadow-sm">
              <Users className="h-5 w-5 text-mauve" />
              <h2 className="mt-3 text-[20px] leading-tight text-mauve-900">Pour toutes les tablées</h2>
              <p className="mt-1 text-[10px] leading-5 text-brown-soft">
                Une petite faim, un goûter, un anniversaire ou un déjeuner
                d'équipe : les formats s'adaptent.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-brown/10 bg-white p-5 shadow-sm">
              <Star className="h-5 w-5 text-mauve" />
              <h2 className="mt-3 text-[20px] leading-tight text-mauve-900">Votre retour compte</h2>
              <p className="mt-1 text-[10px] leading-5 text-brown-soft">
                Vos avis sont lus après chaque service pour faire évoluer la
                carte et le quotidien de la maison.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-10">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-4 rounded-[2rem] bg-mauve-100/50 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-mauve-700">À bientôt</p>
              <h2 className="mt-2 text-[28px] leading-tight text-mauve-900 sm:text-[34px]">
                La prochaine bouchée vous attend.
              </h2>
              <p className="mt-1 text-[12px] leading-6 text-brown-soft">
                Parcourez la carte ou venez simplement dire bonjour.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/menu" className="btn-primary">
                Voir le menu
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="btn-secondary">Nous contacter</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
