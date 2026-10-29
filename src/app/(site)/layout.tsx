import type { Metadata } from "next";
import Link from "next/link";
import { getCachedSettings } from "@/lib/settings";
import { StoreProviders } from "@/components/store/store-providers";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getCachedSettings();

  return (
    <StoreProviders>
      <div className="flex min-h-screen flex-col">
        <a
          href="#contenu"
          className="fixed left-4 top-3 z-[200] -translate-y-24 rounded-full bg-mauve px-5 py-3 text-sm font-bold text-white focus:translate-y-0"
        >
          Aller au contenu
        </a>
        <SiteHeader settings={settings} />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <SiteFooter settings={settings} />
        <WhatsAppFab
          number={settings.whatsapp}
          message={`${settings.whatsappGreeting} Je souhaite passer une commande.`}
        />
      </div>
    </StoreProviders>
  );
}
