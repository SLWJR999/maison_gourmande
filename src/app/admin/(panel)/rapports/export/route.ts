import { NextResponse } from "next/server";
import { and, desc, eq, gte, lte, ne, sql, sum } from "drizzle-orm";
import { getDb } from "@/db";
import { expenses, orderItems, orders } from "@/db/schema";
import { can, getCurrentUser } from "@/lib/auth";
import {
  dateInputValue,
  endOfDay,
  getReport,
  monthStart,
  parseDateInput,
  startOfDay,
  toCsv,
} from "@/lib/admin";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "reports:read")) {
    return new NextResponse("Non autorisé", { status: 401 });
  }
  const url = new URL(request.url);
  const includeDemo = url.searchParams.get("demo") === "1";
  const from = startOfDay(parseDateInput(url.searchParams.get("from"), monthStart()));
  const to = endOfDay(parseDateInput(url.searchParams.get("to"), new Date()));
  const rangeFrom = from <= to ? from : to;
  const rangeTo = from <= to ? to : from;
  const report = await getReport(rangeFrom, rangeTo, includeDemo);
  const db = getDb();
  const orderConditions = [
    ne(orders.status, "CANCELLED"),
    gte(orders.createdAt, rangeFrom),
    lte(orders.createdAt, rangeTo),
  ];
  if (!includeDemo) orderConditions.push(eq(orders.isDemo, false));

  const [products, expenseRows] = await Promise.all([
    db
      .select({
        productName: orderItems.productName,
        quantity: sum(orderItems.quantity),
        revenue: sum(orderItems.lineTotal),
        cost: sum(sql`${orderItems.costPrice} * ${orderItems.quantity}`),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(...orderConditions))
      .groupBy(orderItems.productName)
      .orderBy(desc(sum(orderItems.lineTotal))),
    db
      .select()
      .from(expenses)
      .where(
        and(
          gte(expenses.expenseDate, dateInputValue(rangeFrom)),
          lte(expenses.expenseDate, dateInputValue(rangeTo)),
          ...(includeDemo ? [] : [eq(expenses.isDemo, false)]),
        ),
      )
      .orderBy(desc(expenses.expenseDate)),
  ]);

  const summary = toCsv(
    ["Indicateur", "Valeur", "Note"],
    [
      ["Période du", dateInputValue(rangeFrom), ""],
      ["Période au", dateInputValue(rangeTo), ""],
      ["Démo incluse", includeDemo ? "Oui" : "Non", "Les démos sont exclues par défaut."],
      ["Commandes non annulées", report.orderCount, ""],
      ["CA enregistré", report.revenue, "Total des commandes non annulées, livraison incluse."],
      ["Encaissements déclarés", report.declaredReceipts, "Saisis par l'équipe, non vérifiés bancairement."],
      ["Reste déclaré à encaisser", report.outstanding, ""],
      ["Coût matières historique", report.productCosts, "Instantanés des lignes."],
      ["Marge brute indicative", report.estimatedMargin, "CA − coût matières."],
      ["Dépenses réelles", report.expenseTotal, includeDemo ? "Démo incluse." : "Démo exclue."],
      ["Résultat indicatif", report.estimatedResult, "Estimation, hors charges non saisies."],
      ["Lignes sans coût", report.missingCostLines, "Si > 0, la marge est incomplète."],
    ],
  );

  const productCsv = toCsv(
    ["Produit (instantané)", "Quantité", "CA lignes", "Coût matières", "Marge brute"],
    products.map((row) => [
      row.productName,
      Number(row.quantity ?? 0),
      Number(row.revenue ?? 0),
      Number(row.cost ?? 0),
      Number(row.revenue ?? 0) - Number(row.cost ?? 0),
    ]),
  );

  const expensesCsv = toCsv(
    ["Date", "Libellé", "Catégorie", "Fournisseur", "Montant", "Paiement", "Reçu", "Démo"],
    expenseRows.map((row) => [
      row.expenseDate,
      row.label,
      row.category,
      row.supplier,
      row.amount,
      row.paymentMethod,
      row.receiptRef,
      row.isDemo ? "Oui" : "Non",
    ]),
  );

  // BOM UTF-8 : Excel ouvre correctement les accents sur Windows.
  const csv = `\uFEFF${[
    summary,
    "",
    "PRODUITS",
    productCsv,
    "",
    "DÉPENSES",
    expensesCsv,
  ].join("\r\n")}`;
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="maison-gourmande-synthese-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
