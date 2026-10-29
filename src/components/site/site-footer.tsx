import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Music2,
  Phone,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import type { SiteSettings } from "@/lib/settings";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  const socials = [
    { href: settings.instagram, label: "Instagram", Icon: Instagram },
    { href: settings.facebook, label: "Facebook", Icon: Facebook },
    { href: settings.tiktok, label: "TikTok", Icon: Music2 },
  ].filter((social) => social.href && social.href !== "https://www.instagram.com/" && social.href !== "https://www.facebook.com/" && social.href !== "https://www.tiktok.com/");

  return (
    <footer className="relative mt-24 overflow-hidden bg-mauve-900 text-white">
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-mauve-700/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-ochre/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-page relative py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr_0.9fr_1fr]">
          <div>
            <Logo variant="light" />
            <p className="mt-5 max-w-sm text-sm leading-7 text-mauve-200/80">
              {settings.footerText}
            </p>
            <Link
              href="/menu"
              className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white transition hover:text-ochre-light"
            >
              Commander
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-ochre-light">
              Explorer
            </p>
            <ul className="mt-5 space-y-3 text-sm text-mauve-200/85">
              <li>
                <Link className="transition hover:text-white" href="/menu">
                  Le menu
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/promotions">
                  Promotions
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/evenements">
                  Anniversaires & événements
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/avis">
                  Avis clients
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/a-propos">
                  À propos
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/contact">
                  Contact
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/panier">
                  Mon panier
                </Link>
              </li>
              <li>
                <Link
                  className="transition hover:text-white"
                  href="/confidentialite"
                >
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/conditions">
                  Conditions de commande
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-ochre-light">
              Nous trouver
            </p>
            <ul className="mt-5 space-y-4 text-sm text-mauve-200/85">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ochre-light" />
                <span>{settings.address}</span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ochre-light" />
                <a
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  className="transition hover:text-white"
                >
                  {settings.phone}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ochre-light" />
                <a
                  href={`mailto:${settings.email}`}
                  className="break-all transition hover:text-white"
                >
                  {settings.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-ochre-light">
              Horaires
            </p>
            <div className="mt-5 flex gap-2.5 text-sm leading-7 text-mauve-200/85">
              <Clock3 className="mt-1 h-4 w-4 shrink-0 text-ochre-light" />
              <p className="whitespace-pre-line">{settings.hours}</p>
            </div>
            <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-mauve-200/75">
              {settings.cuisineZone}
            </p>
            {socials.length ? (
              <div className="mt-5 flex gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-mauve-200 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-[11px] text-mauve-200/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.brandName}. Tous droits réservés.
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <span>{settings.rccm}</span>
            <Link href="/confidentialite" className="transition hover:text-white">
              Données personnelles
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
