import type { Category, Product } from "@/db/schema";

export function ProductForm({
  action,
  categories,
  product,
}: {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  product?: Product;
}) {
  const id = product?.id ?? "new";
  return (
    <form action={action} className="space-y-4">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`name-${id}`} className="admin-label">
            Nom du produit *
          </label>
          <input
            id={`name-${id}`}
            name="name"
            required
            defaultValue={product?.name ?? ""}
            className="admin-input"
            placeholder="Tacos poulet XXL"
          />
        </div>
        <div>
          <label htmlFor={`slug-${id}`} className="admin-label">
            Slug (URL)
          </label>
          <input
            id={`slug-${id}`}
            name="slug"
            defaultValue={product?.slug ?? ""}
            className="admin-input"
            placeholder="tacos-poulet-xxl"
          />
          <p className="mt-1 text-[9px] text-brown-light">
            Laissez vide pour générer depuis le nom.
          </p>
        </div>
        <div>
          <label htmlFor={`category-${id}`} className="admin-label">
            Catégorie *
          </label>
          <select
            id={`category-${id}`}
            name="categoryId"
            defaultValue={product?.categoryId ?? ""}
            required
            className="admin-select"
          >
            <option value="">Choisir…</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.isArchived ? " (archivée)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`badge-${id}`} className="admin-label">
            Badge (facultatif)
          </label>
          <input
            id={`badge-${id}`}
            name="badge"
            defaultValue={product?.badge ?? ""}
            className="admin-input"
            placeholder="Best-seller, Nouveau…"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`short-${id}`} className="admin-label">
            Description courte
          </label>
          <input
            id={`short-${id}`}
            name="shortDescription"
            defaultValue={product?.shortDescription ?? ""}
            className="admin-input"
            placeholder="Une phrase qui donne envie."
            maxLength={180}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`description-${id}`} className="admin-label">
            Description complète
          </label>
          <textarea
            id={`description-${id}`}
            name="description"
            rows={4}
            defaultValue={product?.description ?? ""}
            className="admin-textarea"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`base-${id}`} className="admin-label">
            Prix de référence (FCFA) *
          </label>
          <input
            id={`base-${id}`}
            name="basePrice"
            type="number"
            min={0}
            step={5}
            required
            defaultValue={product?.basePrice ?? 0}
            className="admin-input"
          />
          <p className="mt-1 text-[9px] text-brown-light">
            Recalculé depuis les formats actifs après enregistrement.
          </p>
        </div>
        <div>
          <label htmlFor={`compare-${id}`} className="admin-label">
            Prix barré (FCFA)
          </label>
          <input
            id={`compare-${id}`}
            name="compareAtPrice"
            type="number"
            min={0}
            defaultValue={product?.compareAtPrice ?? ""}
            className="admin-input"
          />
        </div>
        <div>
          <label htmlFor={`cost-${id}`} className="admin-label">
            Coût matière / pièce (FCFA)
          </label>
          <input
            id={`cost-${id}`}
            name="costPrice"
            type="number"
            min={0}
            defaultValue={product?.costPrice ?? 0}
            className="admin-input"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`image-${id}`} className="admin-label">
            Image principale (URL)
          </label>
          <input
            id={`image-${id}`}
            name="imageUrl"
            defaultValue={product?.imageUrl ?? ""}
            className="admin-input"
            placeholder="/images/tacos.jpg ou https://…"
          />
        </div>
        <div>
          <label htmlFor={`video-${id}`} className="admin-label">
            Vidéo du produit (URL, facultatif)
          </label>
          <input
            id={`video-${id}`}
            name="videoUrl"
            defaultValue={product?.videoUrl ?? ""}
            className="admin-input"
            placeholder="/videos/produit.mp4"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`images-${id}`} className="admin-label">
            Galerie — une URL par ligne
          </label>
          <textarea
            id={`images-${id}`}
            name="images"
            rows={3}
            defaultValue={(product?.images ?? []).join("\n")}
            className="admin-textarea font-mono text-[11px]"
            placeholder={"/images/tacos.jpg\n/images/tacos-detail.jpg"}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`ingredients-${id}`} className="admin-label">
            Ingrédients
          </label>
          <textarea
            id={`ingredients-${id}`}
            name="ingredients"
            rows={3}
            defaultValue={product?.ingredients ?? ""}
            className="admin-textarea"
          />
        </div>
        <div>
          <label htmlFor={`allergens-${id}`} className="admin-label">
            Allergènes
          </label>
          <textarea
            id={`allergens-${id}`}
            name="allergens"
            rows={3}
            defaultValue={product?.allergens ?? ""}
            className="admin-textarea"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`prep-${id}`} className="admin-label">
            Préparation (minutes)
          </label>
          <input
            id={`prep-${id}`}
            name="preparationMinutes"
            type="number"
            min={0}
            max={240}
            defaultValue={product?.preparationMinutes ?? ""}
            className="admin-input"
          />
        </div>
        <div>
          <label htmlFor={`availability-${id}`} className="admin-label">
            Disponibilité
          </label>
          <select
            id={`availability-${id}`}
            name="availability"
            defaultValue={product?.availability ?? "AVAILABLE"}
            className="admin-select"
          >
            <option value="AVAILABLE">Disponible</option>
            <option value="SOLD_OUT">Épuisé</option>
            <option value="COMING_SOON">Bientôt disponible</option>
          </select>
        </div>
        <div>
          <label htmlFor={`sort-${id}`} className="admin-label">
            Ordre d'affichage
          </label>
          <input
            id={`sort-${id}`}
            name="sortOrder"
            type="number"
            defaultValue={product?.sortOrder ?? 0}
            className="admin-input"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="inline-flex items-center gap-2 rounded-xl border border-brown/10 px-3 py-2.5 text-[11px] font-bold text-brown-soft">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={product?.isActive ?? true}
            className="h-4 w-4 accent-mauve"
          />
          Visible sur le site
        </label>
        <label className="inline-flex items-center gap-2 rounded-xl border border-brown/10 px-3 py-2.5 text-[11px] font-bold text-brown-soft">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={product?.isFeatured ?? false}
            className="h-4 w-4 accent-mauve"
          />
          Mettre en avant sur l'accueil
        </label>
      </div>

      <button type="submit" className="btn-primary btn-sm">
        {product ? "Enregistrer le produit" : "Créer le produit"}
      </button>
    </form>
  );
}
