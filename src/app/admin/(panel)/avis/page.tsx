import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import {
  Check,
  EyeOff,
  Star,
  Trash2,
  Undo2,
} from "lucide-react";
import { getDb } from "@/db";
import { products, reviews, type ReviewStatus } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import {
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { updateReview } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Avis clients" };

const LABELS: Record<ReviewStatus, string> = {
  PENDING: "En attente",
  APPROVED: "Publié",
  REJECTED: "Refusé",
};

const STYLES: Record<ReviewStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; statut?: string }>;
}) {
  await requirePermission("reviews:read");
  const params = await searchParams;
  const status = params.statut && LABELS[params.statut as ReviewStatus]
    ? (params.statut as ReviewStatus)
    : null;
  const rows = await getDb()
    .select({ review: reviews, product: products })
    .from(reviews)
    .leftJoin(products, eq(reviews.productId, products.id))
    .where(status ? eq(reviews.status, status) : undefined)
    .orderBy(desc(reviews.createdAt))
    .limit(300);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Relation client"
        title="Avis clients"
        description="Modérez les avis avant publication. Un avis n'est visible sur le site qu'après approbation. Les avis de démonstration restent identifiés."
      />
      {params.ok ? <AdminNotice>{params.ok}</AdminNotice> : null}

      <div className="flex flex-wrap gap-1.5">
        <Link href="/admin/avis" className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${!status ? "bg-mauve text-white" : "border border-brown/10 bg-white text-brown-soft"}`}>
          Tous
        </Link>
        {Object.entries(LABELS).map(([value, label]) => (
          <Link key={value} href={`/admin/avis?statut=${value}`} className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${status === value ? "bg-mauve text-white" : "border border-brown/10 bg-white text-brown-soft"}`}>
            {label}
          </Link>
        ))}
      </div>

      {rows.length ? (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {rows.map(({ review, product }) => (
            <div key={review.id} className="admin-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-[12px] font-extrabold text-brown">{review.customerName}</p>
                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${STYLES[review.status]}`}>
                      {LABELS[review.status]}
                    </span>
                    {review.isFeatured ? (
                      <span className="rounded bg-ochre/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-800">Une</span>
                    ) : null}
                    {review.isDemo ? (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-700">Démo</span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-ochre">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className={`h-3 w-3 ${index < review.rating ? "fill-current" : "opacity-25"}`} />
                    ))}
                    <span className="ml-1 text-[9px] font-bold text-brown-light">
                      {review.rating}/5 · {formatDateTime(review.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-6 text-brown-soft">« {review.message} »</p>
              {product ? (
                <p className="mt-1 text-[9px] font-bold text-mauve-700">
                  Produit : {product.name}
                </p>
              ) : (
                <p className="mt-1 text-[9px] text-brown-light">Avis général</p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-brown/10 pt-2.5">
                {review.status !== "APPROVED" ? (
                  <form action={updateReview}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="action" value="approve" />
                    <input type="hidden" name="returnStatus" value={status ?? ""} />
                    <button className="btn-primary btn-sm">
                      <Check className="h-3 w-3" />
                      Publier
                    </button>
                  </form>
                ) : null}
                {review.status !== "REJECTED" ? (
                  <form action={updateReview}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="action" value="reject" />
                    <input type="hidden" name="returnStatus" value={status ?? ""} />
                    <button className="btn-ghost btn-sm">
                      <EyeOff className="h-3 w-3" />
                      Refuser
                    </button>
                  </form>
                ) : null}
                {review.status === "APPROVED" ? (
                  <form action={updateReview}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="action" value="feature" />
                    <input type="hidden" name="value" value={review.isFeatured ? "false" : "true"} />
                    <input type="hidden" name="returnStatus" value={status ?? ""} />
                    <button className="btn-secondary btn-sm">
                      <Star className="h-3 w-3" />
                      {review.isFeatured ? "Retirer de la une" : "Mettre en avant"}
                    </button>
                  </form>
                ) : null}
                {review.status !== "PENDING" ? (
                  <form action={updateReview}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="action" value="pending" />
                    <input type="hidden" name="returnStatus" value={status ?? ""} />
                    <button className="btn-ghost btn-sm">
                      <Undo2 className="h-3 w-3" />
                      À revoir
                    </button>
                  </form>
                ) : null}
                <form action={updateReview}>
                  <input type="hidden" name="id" value={review.id} />
                  <input type="hidden" name="action" value="delete" />
                  <input type="hidden" name="returnStatus" value={status ?? ""} />
                  <button className="btn-ghost btn-sm text-red-600">
                    <Trash2 className="h-3 w-3" />
                    Supprimer
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AdminEmpty title="Aucun avis" description="Les avis envoyés par les clients apparaîtront ici." />
      )}
    </div>
  );
}
