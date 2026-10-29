import Link from "next/link";
import { ArrowLeft, ChefHat, MessageCircle, Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export const metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-cream">
      <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-mauve-100/70 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full bg-ochre/10 blur-3xl" aria-hidden="true" />
      <header className="container-page relative flex h-20 items-center justify-between">
        <Logo />
        <Link href="/" className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-brown-soft transition hover:text-mauve-800">
          Retour à la maison
        </Link>
      </header>
      <main className="container-page relative flex flex-1 items-center py-12">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_0.65fr] lg:items-center">
          <div>
            <p className="eyebrow"><span className="h-px w-6 bg-mauve" />Erreur 404</p>
            <h1 className="mt-4 max-w-2xl text-[52px] leading-[0.95] text-mauve-900 sm:text-[74px]">
              Cette page a été <em className="text-mauve">dégustée</em>.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-brown-soft">
              La page demandée n'existe pas, a changé d'adresse ou n'est plus
              disponible. La carte, elle, est toujours prête à vous accueillir.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link href="/menu" className="btn-primary">
                <Search className="h-4 w-4" />
                Découvrir le menu
              </Link>
              <Link href="/" className="btn-secondary">
                <ArrowLeft className="h-4 w-4" />
                Accueil
              </Link>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-[10px] text-brown-light">
              <MessageCircle className="h-3.5 w-3.5 text-mauve" />
              Besoin d'aide pour commander ?{" "}
              <Link href="/contact" className="font-bold text-mauve-700 underline underline-offset-2">Contactez la maison</Link>
            </p>
          </div>
          <div className="relative mx-auto flex aspect-square w-full max-w-[340px] items-center justify-center rounded-[2.5rem] border border-brown/10 bg-white shadow-float">
            <div className="absolute inset-5 rounded-[2rem] border border-dashed border-mauve/25" />
            <div className="relative text-center">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-mauve-100 text-mauve-700">
                <ChefHat className="h-9 w-9" />
              </span>
              <p className="mt-4 font-display text-[64px] leading-none text-mauve-900">404</p>
              <p className="mt-2 text-[9px] font-extrabold uppercase tracking-[0.2em] text-brown-light">Rien dans cette boîte</p>
            </div>
          </div>
        </div>
      </main>
      <footer className="container-page relative flex flex-col gap-2 border-t border-brown/10 py-5 text-[9px] text-brown-light sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Maison Gourmande</p>
        <p>La gourmandise, faite maison.</p>
      </footer>
    </div>
  );
}
