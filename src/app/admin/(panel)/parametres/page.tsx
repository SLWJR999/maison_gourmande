import Link from "next/link";
import {
  Clock3,
  KeyRound,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Phone,
  Scale,
  Settings,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import {
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { saveOperationalSettings } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paramètres" };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requirePermission("settings:write");
  const params = await searchParams;
  const settings = await getSettings();

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Gestion"
        title="Paramètres"
        description="Coordonnées, livraison, remise quantité et messages. Les secrets techniques (base de données, clé de session) restent dans les variables d'environnement et ne sont jamais affichés ici."
      />
      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr] xl:items-start">
        <form action={saveOperationalSettings} className="space-y-4">
          <section className="admin-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-mauve" />
              <h2 className="font-display text-xl text-mauve-900">Contact & maison</h2>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="admin-label">Téléphone affiché</label>
                <input id="phone" name="phone" defaultValue={settings.phone} className="admin-input" />
              </div>
              <div>
                <label htmlFor="whatsapp" className="admin-label">WhatsApp (avec indicatif) *</label>
                <input id="whatsapp" name="whatsapp" defaultValue={settings.whatsapp} className="admin-input" />
                <p className="mt-1 text-[9px] text-brown-light">Ex. 221709815201. Utilisé pour les commandes et contacts.</p>
              </div>
              <div>
                <label htmlFor="email" className="admin-label">E-mail</label>
                <input id="email" name="email" type="email" defaultValue={settings.email} className="admin-input" />
              </div>
              <div>
                <label htmlFor="address" className="admin-label">Adresse / localisation</label>
                <input id="address" name="address" defaultValue={settings.address} className="admin-input" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="hours" className="admin-label">Horaires (une ligne par jour)</label>
                <textarea id="hours" name="hours" rows={3} defaultValue={settings.hours} className="admin-textarea" />
              </div>
              <div>
                <label htmlFor="instagram" className="admin-label">Instagram</label>
                <input id="instagram" name="instagram" defaultValue={settings.instagram} className="admin-input" />
              </div>
              <div>
                <label htmlFor="facebook" className="admin-label">Facebook</label>
                <input id="facebook" name="facebook" defaultValue={settings.facebook} className="admin-input" />
              </div>
              <div>
                <label htmlFor="tiktok" className="admin-label">TikTok</label>
                <input id="tiktok" name="tiktok" defaultValue={settings.tiktok} className="admin-input" />
              </div>
              <div>
                <label htmlFor="cuisineZone" className="admin-label">Zone de livraison</label>
                <input id="cuisineZone" name="cuisineZone" defaultValue={settings.cuisineZone} className="admin-input" />
              </div>
            </div>
          </section>

          <section className="admin-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-mauve" />
              <h2 className="font-display text-xl text-mauve-900">Livraison & remise quantité</h2>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="deliveryFee" className="admin-label">Frais de livraison (FCFA)</label>
                <input id="deliveryFee" name="deliveryFee" type="number" min={0} defaultValue={settings.deliveryFee} className="admin-input" />
              </div>
              <div>
                <label htmlFor="quantityDiscountThreshold" className="admin-label">Seuil pièces</label>
                <input id="quantityDiscountThreshold" name="quantityDiscountThreshold" type="number" min={1} defaultValue={settings.quantityDiscountThreshold} className="admin-input" />
              </div>
              <div>
                <label htmlFor="quantityDiscountPercent" className="admin-label">Remise (%)</label>
                <input id="quantityDiscountPercent" name="quantityDiscountPercent" type="number" min={0} max={50} defaultValue={settings.quantityDiscountPercent} className="admin-input" />
              </div>
            </div>
            <p className="mt-2 text-[9px] leading-4 text-brown-light">
              Exemple actuel : à partir de {settings.quantityDiscountThreshold} pièces, {settings.quantityDiscountPercent} % de remise quantité. Cette remise reste cumulable avec une seule meilleure offre. Les valeurs sont contrôlées côté serveur au moment du panier.
            </p>
          </section>

          <section className="admin-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-mauve" />
              <h2 className="font-display text-xl text-mauve-900">Messages & délais</h2>
            </div>
            <div className="mt-3 grid gap-3">
              <div>
                <label htmlFor="whatsappGreeting" className="admin-label">Salutation WhatsApp</label>
                <input id="whatsappGreeting" name="whatsappGreeting" defaultValue={settings.whatsappGreeting} className="admin-input" />
              </div>
              <div>
                <label htmlFor="orderNote" className="admin-label">Note affichée au moment de la commande</label>
                <textarea id="orderNote" name="orderNote" rows={3} defaultValue={settings.orderNote} className="admin-textarea" />
              </div>
              <div>
                <label htmlFor="minLeadTime" className="admin-label">Délai minimum événements</label>
                <input id="minLeadTime" name="minLeadTime" defaultValue={settings.minLeadTime} className="admin-input" />
              </div>
            </div>
          </section>

          <section className="admin-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-mauve" />
              <h2 className="font-display text-xl text-mauve-900">Informations légales</h2>
            </div>
            <div className="mt-3">
              <label htmlFor="rccm" className="admin-label">Mentions RCCM / identification</label>
              <input id="rccm" name="rccm" defaultValue={settings.rccm} className="admin-input" />
              <p className="mt-1 text-[9px] text-brown-light">
                Complétez ces informations avant la mise en production. Les pages
                publiques de confidentialité et conditions sont à faire valider si
                nécessaire.
              </p>
            </div>
          </section>

          <button type="submit" className="btn-primary btn-sm">
            <Settings className="h-3.5 w-3.5" />
            Enregistrer les paramètres
          </button>
        </form>

        <div className="space-y-4 xl:sticky xl:top-20">
          <div className="admin-card p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-mauve" />
              <h2 className="font-display text-lg text-mauve-900">Sécurité</h2>
            </div>
            <p className="mt-2 text-[10px] leading-5 text-brown-light">
              L'accès est protégé par session signée, rôles et permissions
              vérifiées côté serveur. Les actions sensibles sont journalisées.
            </p>
            <div className="mt-3 space-y-2">
              <Link href="/admin/compte" className="flex items-center gap-2 rounded-xl border border-brown/10 px-3 py-2.5 text-[10px] font-bold text-brown-soft hover:bg-cream">
                <KeyRound className="h-3.5 w-3.5 text-mauve" />
                Changer mon mot de passe
              </Link>
              <Link href="/admin/equipe" className="flex items-center gap-2 rounded-xl border border-brown/10 px-3 py-2.5 text-[10px] font-bold text-brown-soft hover:bg-cream">
                <Users className="h-3.5 w-3.5 text-mauve" />
                Gérer l'équipe
              </Link>
              <Link href="/admin/journal" className="flex items-center gap-2 rounded-xl border border-brown/10 px-3 py-2.5 text-[10px] font-bold text-brown-soft hover:bg-cream">
                <LockKeyhole className="h-3.5 w-3.5 text-mauve" />
                Consulter le journal
              </Link>
            </div>
          </div>

          <div className="admin-card p-4">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-mauve" />
              <h2 className="font-display text-lg text-mauve-900">Exploitation</h2>
            </div>
            <ul className="mt-2 space-y-2 text-[10px] leading-5 text-brown-light">
              <li className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3 w-3 shrink-0 text-mauve" />Vérifiez la zone de livraison avant d'accepter une commande.</li>
              <li className="flex items-start gap-1.5"><LockKeyhole className="mt-0.5 h-3 w-3 shrink-0 text-mauve" />Les sauvegardes PostgreSQL et le HTTPS se configurent au déploiement (voir README).</li>
              <li className="flex items-start gap-1.5"><ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-mauve" />Ne communiquez jamais les variables d'environnement par WhatsApp ou e-mail non chiffré.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
