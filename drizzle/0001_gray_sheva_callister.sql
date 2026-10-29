CREATE TYPE "public"."product_availability" AS ENUM('AVAILABLE', 'SOLD_OUT', 'COMING_SOON');--> statement-breakpoint
CREATE TYPE "public"."promotion_scope" AS ENUM('ALL', 'CATEGORIES', 'PRODUCTS');--> statement-breakpoint
ALTER TABLE "event_requests" ADD COLUMN "event_time" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_requests" ADD COLUMN "quote_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_requests" ADD COLUMN "admin_notes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "supplier" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "payment_method" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "receipt_ref" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "requested_for" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancel_reason" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "stock" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "video_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "ingredients" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "allergens" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "preparation_minutes" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "availability" "product_availability" DEFAULT 'AVAILABLE' NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "max_per_customer" integer;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "scope_type" "promotion_scope" DEFAULT 'ALL' NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "scope_category_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "scope_product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;