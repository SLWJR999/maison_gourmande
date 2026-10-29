import type { Expense } from "@/db/schema";
import { dateInputValue } from "@/lib/admin";
import { PAYMENT_METHODS } from "@/lib/order-status";

export const EXPENSE_CATEGORIES = [
  "Ingrédients",
  "Emballages",
  "Livraison",
  "Salaires",
  "Loyer",
  "Énergie",
  "Marketing",
  "Entretien",
  "Équipement",
  "Autre",
];

export function ExpenseForm({
  action,
  expense,
}: {
  action: (formData: FormData) => void | Promise<void>;
  expense?: Expense;
}) {
  const key = expense?.id ?? "new";
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {expense ? <input type="hidden" name="id" value={expense.id} /> : null}
      <div className="sm:col-span-2">
        <label className="admin-label" htmlFor={`elabel-${key}`}>
          Libellé *
        </label>
        <input
          id={`elabel-${key}`}
          name="label"
          required
          defaultValue={expense?.label ?? ""}
          className="admin-input"
          placeholder="Achat farine et huile"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`ecategory-${key}`}>
          Catégorie
        </label>
        <select
          id={`ecategory-${key}`}
          name="category"
          defaultValue={expense?.category ?? "Ingrédients"}
          className="admin-select"
        >
          {EXPENSE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="admin-label" htmlFor={`eamount-${key}`}>
          Montant (FCFA) *
        </label>
        <input
          id={`eamount-${key}`}
          name="amount"
          type="number"
          min={1}
          required
          defaultValue={expense?.amount ?? ""}
          className="admin-input"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`edate-${key}`}>
          Date *
        </label>
        <input
          id={`edate-${key}`}
          name="expenseDate"
          type="date"
          required
          defaultValue={expense?.expenseDate ?? dateInputValue()}
          className="admin-input"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`esupplier-${key}`}>
          Fournisseur
        </label>
        <input
          id={`esupplier-${key}`}
          name="supplier"
          defaultValue={expense?.supplier ?? ""}
          className="admin-input"
        />
      </div>
      <div>
        <label className="admin-label" htmlFor={`epay-${key}`}>
          Moyen de paiement
        </label>
        <select
          id={`epay-${key}`}
          name="paymentMethod"
          defaultValue={expense?.paymentMethod ?? ""}
          className="admin-select"
        >
          <option value="">Non précisé</option>
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="admin-label" htmlFor={`ereceipt-${key}`}>
          Référence du reçu
        </label>
        <input
          id={`ereceipt-${key}`}
          name="receiptRef"
          defaultValue={expense?.receiptRef ?? ""}
          className="admin-input"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="admin-label" htmlFor={`enotes-${key}`}>
          Notes
        </label>
        <textarea
          id={`enotes-${key}`}
          name="notes"
          rows={2}
          defaultValue={expense?.notes ?? ""}
          className="admin-textarea"
        />
      </div>
      <button type="submit" className="btn-primary btn-sm sm:col-span-2">
        {expense ? "Enregistrer la dépense" : "Ajouter la dépense"}
      </button>
    </form>
  );
}
