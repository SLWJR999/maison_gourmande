"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BadgePercent,
  Banknote,
  BarChart3,
  CalendarDays,
  ChefHat,
  ClipboardList,
  ExternalLink,
  FileText,
  ImageIcon,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquareQuote,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tags,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboard,
  orders: ClipboardList,
  products: Package,
  categories: Tags,
  options: ListChecks,
  promotions: BadgePercent,
  banners: ImageIcon,
  media: ImageIcon,
  customers: Users,
  events: CalendarDays,
  reviews: Star,
  expenses: Wallet,
  costs: Banknote,
  reports: BarChart3,
  content: FileText,
  settings: Settings,
  team: ShieldCheck,
  audit: ChefHat,
} as const;

type IconName = keyof typeof ICONS;

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  permission?: string;
  exact?: boolean;
  badge?: number;
};

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Pilotage",
    items: [
      { href: "/admin", label: "Tableau de bord", icon: "dashboard", permission: "dashboard:view", exact: true },
      { href: "/admin/commandes", label: "Commandes", icon: "orders", permission: "orders:read" },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/produits", label: "Produits", icon: "products", permission: "products:read" },
      { href: "/admin/categories", label: "Catégories", icon: "categories", permission: "products:read" },
      { href: "/admin/options", label: "Options", icon: "options", permission: "products:read" },
      { href: "/admin/promotions", label: "Promotions", icon: "promotions", permission: "promotions:read" },
      { href: "/admin/bannieres", label: "Bannières", icon: "banners", permission: "content:write" },
      { href: "/admin/medias", label: "Médias", icon: "media", permission: "media:write" },
    ],
  },
  {
    label: "Relation client",
    items: [
      { href: "/admin/clients", label: "Clients", icon: "customers", permission: "customers:read" },
      { href: "/admin/evenements", label: "Événements", icon: "events", permission: "events:read" },
      { href: "/admin/avis", label: "Avis", icon: "reviews", permission: "reviews:read" },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: "/admin/depenses", label: "Dépenses", icon: "expenses", permission: "expenses:read" },
      { href: "/admin/couts", label: "Coûts & marges", icon: "costs", permission: "products:read" },
      { href: "/admin/rapports", label: "Rapports", icon: "reports", permission: "reports:read" },
      { href: "/admin/contenu", label: "Contenu du site", icon: "content", permission: "content:write" },
      { href: "/admin/parametres", label: "Paramètres", icon: "settings", permission: "settings:write" },
      { href: "/admin/equipe", label: "Équipe", icon: "team", permission: "team:manage" },
      { href: "/admin/journal", label: "Journal d'audit", icon: "audit", permission: "audit:read" },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavContent({
  pathname,
  permissions,
  pendingOrders,
  onNavigate,
}: {
  pathname: string;
  permissions: string[];
  pendingOrders: number;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Navigation administration">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter(
          (item) => !item.permission || permissions.includes(item.permission),
        );
        if (!items.length) return null;
        return (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-mauve-200/45">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = isActive(pathname, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-bold transition",
                        active
                          ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                          : "text-mauve-200/70 hover:bg-white/7 hover:text-white",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-ochre-light" : "text-mauve-200/55 group-hover:text-mauve-200",
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.href === "/admin/commandes" && pendingOrders > 0 ? (
                        <span className="rounded-full bg-ochre px-1.5 py-0.5 text-[9px] font-extrabold text-mauve-900">
                          {pendingOrders}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  user,
  permissions,
  pendingOrders,
  children,
}: {
  user: { name: string; email: string; role: string };
  permissions: string[];
  pendingOrders: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebar = (
    <>
      <div className="flex h-[74px] items-center border-b border-white/10 px-5">
        <Link href="/admin" aria-label="Tableau de bord Maison Gourmande">
          <Logo variant="light" />
        </Link>
      </div>
      <NavContent
        pathname={pathname}
        permissions={permissions}
        pendingOrders={pendingOrders}
        onNavigate={() => setOpen(false)}
      />
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between rounded-xl px-3 py-2 text-[10px] font-bold text-mauve-200/60 transition hover:bg-white/5 hover:text-white"
        >
          Voir le site
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-white/5 p-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mauve-700 text-[10px] font-extrabold text-white">
            {initials || "MG"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-white">{user.name}</p>
            <p className="truncate text-[9px] uppercase tracking-wider text-mauve-200/50">
              {user.role.replace("_", " ")}
            </p>
          </div>
          <form action="/admin/logout" method="post">
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-full text-mauve-200/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-cream">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[255px] flex-col bg-mauve-900 lg:flex">
        {sidebar}
      </aside>

      <div className="lg:pl-[255px]">
        <header className="sticky top-0 z-30 flex h-[62px] items-center justify-between border-b border-brown/10 bg-cream/95 px-4 backdrop-blur-xl lg:hidden">
          <Link href="/admin" aria-label="Tableau de bord">
            <Logo compact />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-brown/10 bg-white text-brown"
              aria-label="Ouvrir le menu d'administration"
              aria-expanded={open}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="hidden items-center justify-end gap-2 border-b border-brown/10 bg-cream/60 px-6 py-2.5 lg:flex">
          <Link
            href="/"
            target="_blank"
            className="mr-2 inline-flex items-center gap-1 text-[10px] font-bold text-brown-light transition hover:text-mauve-800"
          >
            Site public <ArrowUpRight className="h-3 w-3" />
          </Link>
          <ThemeToggle compact className="h-9 w-9" />
          <span className="ml-1 text-[10px] text-brown-light">
            {user.name} · {user.role.replace("_", " ")}
          </span>
        </div>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 lg:py-7">
          {children}
        </main>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-[70] transition lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-mauve-900/45 backdrop-blur-sm transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-[86%] max-w-[290px] flex-col bg-mauve-900 shadow-float transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          aria-label="Menu d'administration"
        >
          <div className="absolute right-3 top-4 z-10">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label="Fermer le menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {sidebar}
        </aside>
      </div>
    </div>
  );
}
