import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { loginAction } from "./actions";
import { LoginSubmit } from "./login-submit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connexion administration",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next =
    params.next && params.next.startsWith("/admin") && !params.next.startsWith("//")
      ? params.next
      : "/admin";

  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden overflow-hidden bg-mauve-900 lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/event.jpg"
          alt="Table gourmande Maison Gourmande"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-mauve-900 via-mauve-900/70 to-mauve-900/20" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Logo variant="light" />
          <div className="max-w-lg">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-ochre-light">
              Espace privé
            </p>
            <p className="mt-3 font-display text-[44px] leading-[1.02] text-white xl:text-[52px]">
              La maison se gère ici.
            </p>
            <p className="mt-4 max-w-md text-sm leading-7 text-mauve-200/80">
              Commandes, catalogue, promotions, événements et finances : un seul
              espace pour piloter Maison Gourmande au quotidien.
            </p>
            <div className="mt-7 flex flex-wrap gap-4 text-[10px] font-bold text-mauve-200/70">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-ochre-light" />
                Accès protégé par rôle
              </span>
              <span className="inline-flex items-center gap-1.5">
                <LockKeyhole className="h-3.5 w-3.5 text-ochre-light" />
                Journalisation des actions
              </span>
            </div>
          </div>
          <p className="text-[10px] text-mauve-200/40">
            © {new Date().getFullYear()} Maison Gourmande · Keur Massar, Dakar
          </p>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brown-soft transition hover:text-mauve-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour au site
          </Link>
          <ThemeToggle compact />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-[400px]">
            <div className="lg:hidden">
              <Logo />
            </div>
            <p className="mt-8 text-[10px] font-extrabold uppercase tracking-[0.2em] text-mauve lg:mt-0">
              Administration
            </p>
            <h1 className="mt-2 font-display text-[38px] leading-none text-mauve-900">
              Bonjour.
            </h1>
            <p className="mt-2 text-[12px] leading-6 text-brown-soft">
              Identifiez-vous pour accéder à l'espace privé de la maison.
            </p>

            {params.error ? (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] leading-5 text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Identifiants incorrects ou compte temporairement bloqué. Réessayez
                dans quelques minutes.
              </div>
            ) : null}

            <form action={loginAction} className="mt-6 space-y-4">
              <input type="hidden" name="next" value={next} />
              <div>
                <label htmlFor="email" className="label-field">
                  E-mail professionnel
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  className="input-field"
                  placeholder="vous@maisongourmande.sn"
                />
              </div>
              <div>
                <label htmlFor="password" className="label-field">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  className="input-field"
                  placeholder="••••••••••••"
                />
              </div>
              <LoginSubmit />
            </form>

            <p className="mt-4 text-center text-[10px] leading-5 text-brown-light">
              Aucune inscription publique. Les accès sont créés par un
              administrateur autorisé.
            </p>
            <div className="mt-6 rounded-2xl border border-brown/10 bg-white/60 p-4 text-[10px] leading-5 text-brown-light">
              <p className="font-bold text-brown-soft">Sécurité</p>
              <p className="mt-1">
                Les tentatives de connexion sont limitées et journalisées. Changez
                le mot de passe initial avant toute mise en production.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
