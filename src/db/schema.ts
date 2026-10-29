import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*  Enums                                                                     */
/* -------------------------------------------------------------------------- */

export const userRoleEnum = pgEnum("user_role", [
  "SUPER_ADMIN",
  "MANAGER",
  "STAFF",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "UNPAID",
  "PARTIAL",
  "PAID",
]);

export const orderChannelEnum = pgEnum("order_channel", [
  "WHATSAPP",
  "ADMIN",
]);

export const deliveryModeEnum = pgEnum("delivery_mode", [
  "DELIVERY",
  "PICKUP",
]);

export const promotionTypeEnum = pgEnum("promotion_type", [
  "PERCENT",
  "FIXED",
  "FREE_DELIVERY",
]);

export const reviewStatusEnum = pgEnum("review_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "CONFIRMED",
  "DECLINED",
  "ARCHIVED",
]);

export const mediaTypeEnum = pgEnum("media_type", ["IMAGE", "VIDEO"]);

export const productAvailabilityEnum = pgEnum("product_availability", [
  "AVAILABLE",
  "SOLD_OUT",
  "COMING_SOON",
]);

export const promotionScopeEnum = pgEnum("promotion_scope", [
  "ALL",
  "CATEGORIES",
  "PRODUCTS",
]);

export const bannerPlacementEnum = pgEnum("banner_placement", [
  "HOME_STRIP",
  "MENU",
  "EVENTS",
]);

/* -------------------------------------------------------------------------- */
/*  Comptes & audit                                                           */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("MANAGER"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id"),
    actorName: text("actor_name").notNull().default("Système"),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    details: jsonb("details").$type<Record<string, unknown>>(),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("audit_created_idx").on(table.createdAt)],
);

/* -------------------------------------------------------------------------- */
/*  Catalogue                                                                 */
/* -------------------------------------------------------------------------- */

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    icon: text("icon").notNull().default("Sparkles"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("categories_slug_unique").on(table.slug)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description").notNull().default(""),
    description: text("description").notNull().default(""),
    basePrice: integer("base_price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    costPrice: integer("cost_price").notNull().default(0),
    imageUrl: text("image_url").notNull().default(""),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    badge: text("badge"),
    videoUrl: text("video_url").notNull().default(""),
    ingredients: text("ingredients").notNull().default(""),
    allergens: text("allergens").notNull().default(""),
    preparationMinutes: integer("preparation_minutes"),
    availability: productAvailabilityEnum("availability")
      .notNull()
      .default("AVAILABLE"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    isArchived: boolean("is_archived").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("products_slug_unique").on(table.slug),
    index("products_category_idx").on(table.categoryId),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    quantity: integer("quantity").notNull().default(1),
    price: integer("price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    composition: text("composition").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    stock: integer("stock"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("variants_product_idx").on(table.productId)],
);

export const options = pgTable("options", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  groupName: text("group_name").notNull().default("Suppléments"),
  price: integer("price").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const productOptions = pgTable(
  "product_options",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => options.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.productId, table.optionId] })],
);

/* -------------------------------------------------------------------------- */
/*  Promotions & bannières                                                    */
/* -------------------------------------------------------------------------- */

export const promotions = pgTable(
  "promotions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    code: text("code"),
    type: promotionTypeEnum("type").notNull(),
    value: integer("value").notNull().default(0),
    minSubtotal: integer("min_subtotal").notNull().default(0),
    minItems: integer("min_items").notNull().default(0),
    daysOfWeek: jsonb("days_of_week")
      .$type<number[]>()
      .notNull()
      .default([]),
    startTime: text("start_time"),
    endTime: text("end_time"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    maxRedemptions: integer("max_redemptions"),
    maxPerCustomer: integer("max_per_customer"),
    scopeType: promotionScopeEnum("scope_type").notNull().default("ALL"),
    scopeCategoryIds: jsonb("scope_category_ids")
      .$type<string[]>()
      .notNull()
      .default([]),
    scopeProductIds: jsonb("scope_product_ids")
      .$type<string[]>()
      .notNull()
      .default([]),
    loyaltyMinOrders: integer("loyalty_min_orders").notNull().default(0),
    isAutomatic: boolean("is_automatic").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    showBanner: boolean("show_banner").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("promotions_code_unique").on(table.code),
    index("promotions_active_idx").on(table.isActive),
  ],
);

export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  ctaLabel: text("cta_label").notNull().default("Voir le menu"),
  ctaHref: text("cta_href").notNull().default("/menu"),
  placement: bannerPlacementEnum("placement").notNull().default("HOME_STRIP"),
  isActive: boolean("is_active").notNull().default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Clients & commandes                                                       */
/* -------------------------------------------------------------------------- */

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull().default(""),
    address: text("address").notNull().default(""),
    notes: text("notes").notNull().default(""),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("customers_phone_unique").on(table.phone)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull(),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email").notNull().default(""),
    channel: orderChannelEnum("channel").notNull().default("WHATSAPP"),
    deliveryMode: deliveryModeEnum("delivery_mode")
      .notNull()
      .default("DELIVERY"),
    address: text("address").notNull().default(""),
    notes: text("notes").notNull().default(""),
    requestedFor: text("requested_for").notNull().default(""),
    subtotal: integer("subtotal").notNull(),
    quantityDiscount: integer("quantity_discount").notNull().default(0),
    promotionDiscount: integer("promotion_discount").notNull().default(0),
    deliveryFee: integer("delivery_fee").notNull().default(0),
    discountTotal: integer("discount_total").notNull().default(0),
    total: integer("total").notNull(),
    promoCode: text("promo_code"),
    promotionId: uuid("promotion_id").references(() => promotions.id, {
      onDelete: "set null",
    }),
    promotionLabel: text("promotion_label"),
    status: orderStatusEnum("status").notNull().default("PENDING"),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("UNPAID"),
    amountReceived: integer("amount_received").notNull().default(0),
    paymentMethod: text("payment_method").notNull().default(""),
    cancelReason: text("cancel_reason").notNull().default(""),
    isDemo: boolean("is_demo").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("orders_reference_unique").on(table.reference),
    index("orders_status_idx").on(table.status),
    index("orders_created_idx").on(table.createdAt),
    index("orders_phone_idx").on(table.customerPhone),
  ],
);

export type OrderItemOptionSnapshot = {
  id: string;
  name: string;
  price: number;
};

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id"),
    variantId: uuid("variant_id"),
    productName: text("product_name").notNull(),
    variantName: text("variant_name").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
    costPrice: integer("cost_price").notNull().default(0),
    optionsSnapshot: jsonb("options_snapshot")
      .$type<OrderItemOptionSnapshot[]>()
      .notNull()
      .default([]),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

/* -------------------------------------------------------------------------- */
/*  Événements, avis, dépenses, médias, paramètres                            */
/* -------------------------------------------------------------------------- */

export type EventProductRequest = {
  productId: string | null;
  name: string;
  quantity: number;
};

export const eventRequests = pgTable(
  "event_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull().default(""),
    eventType: text("event_type").notNull(),
    eventDate: date("event_date").notNull(),
    eventTime: text("event_time").notNull().default(""),
    peopleCount: integer("people_count").notNull(),
    location: text("location").notNull(),
    budget: integer("budget").notNull().default(0),
    quoteAmount: integer("quote_amount").notNull().default(0),
    adminNotes: text("admin_notes").notNull().default(""),
    products: jsonb("products")
      .$type<EventProductRequest[]>()
      .notNull()
      .default([]),
    notes: text("notes").notNull().default(""),
    status: eventStatusEnum("status").notNull().default("NEW"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("events_reference_unique").on(table.reference),
    index("events_status_idx").on(table.status),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerName: text("customer_name").notNull(),
    rating: integer("rating").notNull(),
    message: text("message").notNull(),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    status: reviewStatusEnum("status").notNull().default("PENDING"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isDemo: boolean("is_demo").notNull().default(false),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("reviews_status_idx").on(table.status)],
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    label: text("label").notNull(),
    category: text("category").notNull(),
    amount: integer("amount").notNull(),
    expenseDate: date("expense_date").notNull(),
    supplier: text("supplier").notNull().default(""),
    paymentMethod: text("payment_method").notNull().default(""),
    receiptRef: text("receipt_ref").notNull().default(""),
    notes: text("notes").notNull().default(""),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("expenses_date_idx").on(table.expenseDate)],
);

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: mediaTypeEnum("type").notNull().default("IMAGE"),
  alt: text("alt").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Option = typeof options.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type EventRequest = typeof eventRequests.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type OrderChannel = (typeof orderChannelEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type BannerPlacement = (typeof bannerPlacementEnum.enumValues)[number];
export type PromotionType = (typeof promotionTypeEnum.enumValues)[number];
export type ReviewStatus = (typeof reviewStatusEnum.enumValues)[number];
export type EventStatus = (typeof eventStatusEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type MediaType = (typeof mediaTypeEnum.enumValues)[number];
export type ProductAvailability = (typeof productAvailabilityEnum.enumValues)[number];
export type PromotionScope = (typeof promotionScopeEnum.enumValues)[number];
