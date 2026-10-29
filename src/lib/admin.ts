import { and, count, desc, eq, gte, lte, ne, sql, sum } from "drizzle-orm";
import { getDb } from "@/db";
import {
  banners,
  expenses,
  orderItems,
  orders,
  productVariants,
  products,
  type OrderStatus,
} from "@/db/schema";

export function startOfDay(date = new Date()): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function endOfDay(date = new Date()): Date {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export function dateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateInput(
  value: string | null | undefined,
  fallback: Date,
): Date {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export function monthStart(date = new Date()): Date {
  const value = new Date(date);
  value.setDate(1);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(
  headers: string[],
  rows: Array<Array<unknown>>,
): string {
  return `\uFEFF${[headers, ...rows]
    .map((row) => row.map(csvEscape).join(";"))
    .join("\r\n")}`;
}

export type ReportTotals = {
  orderCount: number;
  revenue: number;
  declaredReceipts: number;
  outstanding: number;
  itemsRevenue: number;
  productCosts: number;
  discounts: number;
  estimatedMargin: number;
  expenseTotal: number;
  estimatedResult: number;
  orderExpenses: number;
  missingCostLines: number;
  demoOrderCount: number;
};

function number(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function aggregatePeriod(
  from: Date,
  to: Date,
  includeDemo = false,
): Promise<ReportTotals> {
  const db = getDb();
  const baseConditions = [
    ne(orders.status, "CANCELLED"),
    gte(orders.createdAt, from),
    lte(orders.createdAt, to),
  ];
  if (!includeDemo) baseConditions.push(eq(orders.isDemo, false));

  const [orderTotals] = await db
    .select({
      orderCount: count(),
      revenue: sum(orders.total),
      declaredReceipts: sum(orders.amountReceived),
      discounts: sum(orders.discountTotal),
      orderExpenses: sum(orders.deliveryFee),
    })
    .from(orders)
    .where(and(...baseConditions));

  const [lineTotals] = await db
    .select({
      itemsRevenue: sum(orderItems.lineTotal),
      productCosts: sum(
        sql`${orderItems.costPrice} * ${orderItems.quantity}`,
      ),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(...baseConditions));

  const missingCostRows = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(...baseConditions, eq(orderItems.costPrice, 0)));

  const expenseConditions = [
    gte(expenses.expenseDate, dateInputValue(from)),
    lte(expenses.expenseDate, dateInputValue(to)),
  ];
  if (!includeDemo) expenseConditions.push(eq(expenses.isDemo, false));

  const [expenseTotals] = await db
    .select({ total: sum(expenses.amount) })
    .from(expenses)
    .where(and(...expenseConditions));

  const revenue = number(orderTotals?.revenue);
  const declaredReceipts = number(orderTotals?.declaredReceipts);
  const discounts = number(orderTotals?.discounts);
  const productCosts = number(lineTotals?.productCosts);
  const expenseTotal = number(expenseTotals?.total);
  const estimatedMargin = revenue - productCosts;

  return {
    orderCount: number(orderTotals?.orderCount),
    revenue,
    declaredReceipts,
    outstanding: Math.max(0, revenue - declaredReceipts),
    itemsRevenue: number(lineTotals?.itemsRevenue),
    productCosts,
    discounts,
    estimatedMargin,
    expenseTotal,
    estimatedResult: estimatedMargin - expenseTotal,
    orderExpenses: number(orderTotals?.orderExpenses),
    missingCostLines: missingCostRows.length,
    demoOrderCount: 0,
  };
}

export async function getReport(from: Date, to: Date, includeDemo = false) {
  const [totals, demoRows] = await Promise.all([
    aggregatePeriod(from, to, includeDemo),
    includeDemo
      ? Promise.resolve([])
      : (() => {
          const db = getDb();
          return db
            .select({ total: count() })
            .from(orders)
            .where(
              and(
                eq(orders.isDemo, true),
                gte(orders.createdAt, from),
                lte(orders.createdAt, to),
                ne(orders.status, "CANCELLED"),
              ),
            );
        })(),
  ]);

  return {
    ...totals,
    demoOrderCount: number(demoRows[0]?.total),
  };
}

export async function getDashboardData() {
  const today = startOfDay();
  const yesterdayStart = new Date(today);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const month = monthStart();

  const [todayReport, monthReport, recentOrders, pendingCount, activePromotions, activeProducts] =
    await Promise.all([
      getReport(today, endOfDay(today)),
      getReport(month, endOfDay()),
      getDb()
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(6),
      getDb()
        .select({ total: count() })
        .from(orders)
        .where(and(eq(orders.status, "PENDING"), eq(orders.isDemo, false)))
        .then((rows) => number(rows[0]?.total)),
      getDb()
        .select({ total: count() })
        .from(banners)
        .where(eq(banners.isActive, true))
        .then((rows) => number(rows[0]?.total)),
      getDb()
        .select({ total: count() })
        .from(products)
        .where(and(eq(products.isActive, true), eq(products.isArchived, false)))
        .then((rows) => number(rows[0]?.total)),
    ]);

  return {
    today: todayReport,
    month: monthReport,
    recentOrders,
    pendingCount,
    activePromotions,
    activeProducts,
  };
}

export async function nextOrderStatuses() {
  return ["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED"] as OrderStatus[];
}

export async function getActiveVariantChoices() {
  const db = getDb();
  return db
    .select({
      variantId: productVariants.id,
      variantName: productVariants.name,
      price: productVariants.price,
      productName: products.name,
      productCost: products.costPrice,
      quantity: productVariants.quantity,
      productId: products.id,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(eq(productVariants.isActive, true), eq(products.isActive, true)))
    .orderBy(products.name, productVariants.price);
}
