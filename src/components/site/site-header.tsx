"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Menu,
  Phone,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useCart } from "@/components/store/cart-provider";
import type { SiteSettings } from "@/lib/settings";
import { cn, formatFCFA } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/menu", label: "Menu" },
  { href: "/promotions", label: "Promotions" },
  { href: "/evenements", label: "Événements" },
  { href: "/avis", label: "Avis clients" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname();
  const { lineCount, ready, subtotal } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      {announcementVisible ? (
        <div className="relative z-40 bg-mauve-800 text-white">
          <div className="container-page flex min-h-[38px] items-center justify-center gap-2 py-2 pr-8 text-center text-[11px] font-semibold tracking-wide sm:text-xs">
            <Sparkles className="hidden h-3.5 w-3.5 text-ochre-light sm:block" />
            <span>{settings.announcement}</span>
            <Link
              href="/menu"
              className="ml-1 hidden items-center gap-1 border-b border-white/30 pb-0.5 font-bold text-white/90 transition hover:border-white sm:inline-flex"
            >
              Voir le menu
              <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              type="button"
              onClick={() => setAnnouncementVisible(false)}
              aria-label="Fermer l'annonce"
              className="absolute right-3 rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      <header
        className={cn(
          "sticky top-0 z-50 border-b transition duration-300",
          scrolled
            ? "border-brown/10 bg-cream/95 shadow-[0_12px_35px_-28px_rgba(66,43,82,0.35)] backdrop-blur-xl"
            : "border-transparent bg-cream/85 backdrop-blur-md",
        )}
      >
        <div className="container-page flex h-[72px] items-center justify-between gap-4 sm:h-[78px]">
          <Link href="/" aria-label="Maison Gourmande, accueil" className="shrink-0">
            <Logo />
          </Link>

          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-1 xl:flex"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-[13px] font-bold transition",
                  isActive(pathname, link.href)
                    ? "bg-mauve-100/80 text-mauve-800"
                    : "text-brown-soft hover:bg-mauve-100/50 hover:text-mauve-800",
                )}
                aria-current={isActive(pathname, link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-[12px] font-bold text-brown-soft transition hover:bg-white hover:text-mauve-800 xl:flex"
            >
              <Phone className="h-3.5 w-3.5" />
              {settings.phone}
            </a>

            <ThemeToggle className="hidden sm:flex" />

            <Link
              href="/panier"
              className="relative flex h-11 items-center justify-center gap-2 rounded-full border border-brown/10 bg-white text-brown shadow-sm transition hover:border-mauve/30 hover:text-mauve-700 sm:w-auto sm:pl-3.5 sm:pr-3.5"
              aria-label={
                ready && lineCount > 0
                  ? `Panier, ${lineCount} article${lineCount > 1 ? "s" : ""}, ${formatFCFA(subtotal)}`
                  : "Panier"
              }
            >
              <ShoppingBag className="h-[18px] w-[18px] shrink-0" />
              <span className="hidden flex-col leading-none sm:flex">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-brown-light">
                  Panier
                </span>
                <span className="mt-0.5 text-[11px] font-extrabold text-brown">
                  {ready && lineCount > 0 ? formatFCFA(subtotal) : "0 FCFA"}
                </span>
              </span>
              {ready && lineCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-mauve px-1 text-[10px] font-extrabold text-white ring-2 ring-cream sm:right-auto sm:left-7">
                  {lineCount > 99 ? "99+" : lineCount}
                </span>
              ) : null}
            </Link>

            <Link href="/menu" className="btn-primary btn-sm hidden sm:inline-flex">
              Commander
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-brown/10 bg-white text-brown transition hover:text-mauve-700 xl:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[80] transition duration-300 xl:hidden",
          menuOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label="Fermer le menu"
          onClick={() => setMenuOpen(false)}
          className={cn(
            "absolute inset-0 bg-mauve-900/40 backdrop-blur-sm transition-opacity duration-300",
            menuOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation"
          className={cn(
            "absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-cream shadow-float transition-transform duration-300 ease-out",
            menuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-brown/10 px-5 py-4">
            <Logo />
            <div className="flex items-center gap-2">
              <ThemeToggle compact />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brown"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav
            aria-label="Navigation mobile"
            className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6"
          >
            {NAV_LINKS.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group flex items-center justify-between rounded-2xl px-4 py-4 font-display text-2xl transition",
                  isActive(pathname, link.href)
                    ? "bg-mauve-100 text-mauve-800"
                    : "text-brown hover:bg-white",
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="text-[10px] font-sans font-bold text-mauve/50">
                    0{index + 1}
                  </span>
                  {link.label}
                </span>
                <ArrowUpRight className="h-5 w-5 opacity-40 transition group-hover:opacity-100" />
              </Link>
            ))}
            <Link
              href="/panier"
              className="group mt-2 flex items-center justify-between rounded-2xl bg-white px-4 py-4 font-display text-2xl text-brown"
            >
              <span className="flex items-center gap-3">
                <span className="text-[10px] font-sans font-bold text-mauve/50">
                  0{NAV_LINKS.length + 1}
                </span>
                Mon panier
              </span>
              {ready && lineCount > 0 ? (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-mauve px-1.5 text-xs font-extrabold text-white">
                  {lineCount}
                </span>
              ) : (
                <ArrowUpRight className="h-5 w-5 opacity-40" />
              )}
            </Link>
          </nav>

          <div className="border-t border-brown/10 p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-mauve">
              Une envie, une question ?
            </p>
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="mt-2 flex items-center gap-2 font-display text-xl text-brown"
            >
              <Phone className="h-4 w-4 text-mauve" />
              {settings.phone}
            </a>
            <Link href="/menu" className="btn-primary mt-4 w-full">
              Découvrir le menu
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-center text-[11px] text-brown-light">
              {settings.hours.split("\n")[0]}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
