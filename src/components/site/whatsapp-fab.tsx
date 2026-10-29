"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, X } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { cartSubtotal } from "@/lib/cart";
import { formatFCFA, normalizeWhatsApp } from "@/lib/utils";

export function WhatsAppFab({
  number,
  message,
}: {
  number: string;
  message: string;
}) {
  const pathname = usePathname();
  const { items, ready, subtotal } = useCart();
  const [mobileBarVisible, setMobileBarVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setMobileBarVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isCartPage = pathname === "/panier";
  const waNumber = normalizeWhatsApp(number) || "221709815201";
  const href = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  const showMobileCartBar = ready && items.length > 0 && mobileBarVisible;

  if (isCartPage) return null;

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Discuter avec Maison Gourmande sur WhatsApp"
        className={`group fixed bottom-5 right-4 z-40 h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_16px_40px_-14px_rgba(37,211,102,0.7)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_-14px_rgba(37,211,102,0.8)] sm:bottom-7 sm:right-7 ${
          showMobileCartBar ? "hidden sm:flex" : "flex"
        }`}
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/30 [animation-duration:2.6s]" />
        <svg
          viewBox="0 0 32 32"
          className="h-7 w-7"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M16.04 3C8.86 3 3.04 8.82 3.04 16c0 2.29.6 4.52 1.74 6.49L3 29l6.67-1.75A12.93 12.93 0 0 0 16.04 29C23.22 29 29.04 23.18 29.04 16S23.22 3 16.04 3Zm0 23.68c-2.04 0-4.04-.55-5.78-1.58l-.41-.25-3.96 1.04 1.06-3.86-.27-.42A10.63 10.63 0 0 1 5.36 16c0-5.89 4.79-10.68 10.68-10.68S26.72 10.11 26.72 16 21.93 26.68 16.04 26.68Zm5.86-7.99c-.32-.16-1.9-.94-2.19-1.04-.3-.11-.51-.16-.73.16-.21.32-.84 1.04-1.03 1.25-.19.21-.38.24-.7.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.15-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.75-.99-2.39-.26-.63-.53-.55-.73-.56h-.62c-.21 0-.56.08-.85.4-.29.32-1.11 1.08-1.11 2.64s1.14 3.07 1.3 3.28c.16.21 2.24 3.42 5.44 4.8.76.33 1.35.52 1.82.67.76.24 1.46.21 2.01.13.61-.09 1.9-.78 2.17-1.53.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
        </svg>
        <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-mauve-900 px-3 py-1.5 text-[11px] font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100 sm:block">
          Une envie ? Écrivez-nous
        </span>
      </a>

      {showMobileCartBar ? (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-brown/10 bg-white/95 px-4 py-3 shadow-[0_-10px_40px_-22px_rgba(66,43,82,0.4)] backdrop-blur-lg sm:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mauve-100 text-mauve-700">
              <ShoppingBag className="h-4.5 w-4.5" size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-brown-soft">
                {items.reduce((total, item) => total + item.quantity, 0)} article
                {items.reduce((total, item) => total + item.quantity, 0) > 1
                  ? "s"
                  : ""}{" "}
                · {formatFCFA(subtotal)}
              </p>
              <p className="text-[10px] text-brown-light">Votre panier vous attend</p>
            </div>
            <Link href="/panier" className="btn-primary btn-sm">
              Voir le panier
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
