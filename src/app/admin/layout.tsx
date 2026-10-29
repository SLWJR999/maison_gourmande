import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Administration · Maison Gourmande",
    template: "%s · Administration Maison Gourmande",
  },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
