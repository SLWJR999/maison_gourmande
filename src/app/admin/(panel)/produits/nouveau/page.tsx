import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { ProductForm } from "@/components/admin/product-form";
import {
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { saveProduct } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nouveau produit" };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("products:write");
  const params = await searchParams;
  const categoryRows = await getDb()
    .select()
    .from(categories)
    .where(eq(categories.isArchived, false))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Nouveau produit"
        description="Créez la fiche, puis ajoutez ses formats (unité, box 10, 15, 25, 50…), ses photos et ses options."
        actions={
          <Link href="/admin/produits" className="btn-secondary btn-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux produits
          </Link>
        }
      />
      {params.error ? <AdminNotice tone="error">{params.error}</AdminNotice> : null}
      <div className="flex items-start gap-2 rounded-xl border border-mauve-200 bg-mauve-100/40 p-3 text-[11px] leading-5 text-mauve-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Un premier format « Unité » sera créé avec le prix de référence. Vous
        pourrez le modifier ou ajouter des formats adaptés.
      </div>
      <div className="admin-card p-4 sm:p-5">
        <ProductForm action={saveProduct} categories={categoryRows} />
      </div>
    </div>
  );
}
