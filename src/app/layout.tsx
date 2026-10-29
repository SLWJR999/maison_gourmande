import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Maison Gourmande — Fait maison à Keur Massar, Dakar",
    template: "%s · Maison Gourmande",
  },
  description:
    "Mini-fataya croustillants, tacos généreux, crêpes fondantes et jus naturels. Commandez votre gourmandise à Keur Massar et Dakar sur WhatsApp.",
  keywords: [
    "Maison Gourmande",
    "fast-food Dakar",
    "fataya Keur Massar",
    "tacos Dakar",
    "crêpes",
    "commande WhatsApp",
    "Sénégal",
  ],
  openGraph: {
    type: "website",
    locale: "fr_SN",
    siteName: "Maison Gourmande",
    title: "Maison Gourmande — Le goût de la maison, à chaque bouchée",
    description:
      "Des recettes généreuses préparées avec soin à Keur Massar, Dakar. Commandez sur WhatsApp.",
    images: [{ url: "/images/hero-fataya.jpg", width: 1600, height: 1067 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maison Gourmande",
    description: "Le goût de la maison, à chaque bouchée. À Keur Massar, Dakar.",
    images: ["/images/hero-fataya.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#76518F" },
    { media: "(prefers-color-scheme: dark)", color: "#16101b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeScript = `(function(){try{var k='maison-gourmande-theme';var s=localStorage.getItem(k);var d=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark');r.style.colorScheme='dark';r.dataset.theme='dark';}else{r.style.colorScheme='light';r.dataset.theme='light';}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
