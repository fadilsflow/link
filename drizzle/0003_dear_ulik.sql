CREATE TABLE "payout" (
	"id" text PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"period_start" timestamp,
	"period_end" timestamp,
	"payout_method" text,
	"payout_details" json,
	"processed_at" timestamp,
	"failure_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"order_id" text,
	"payout_id" text,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"net_amount" integer NOT NULL,
	"platform_fee_percent" integer DEFAULT 0 NOT NULL,
	"platform_fee_amount" integer DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"metadata" json,
	"available_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order" DROP CONSTRAINT "order_creator_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "order" DROP CONSTRAINT "order_product_id_product_id_fk";
--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "creator_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "product_title" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "product_price" integer;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "product_image" text;--> statement-breakpoint
-- Backfill snapshot data from existing products
UPDATE "order" SET
  "product_title" = COALESCE(p."title", 'Unknown Product'),
  "product_price" = COALESCE("order"."amount_paid", 0),
  "product_image" = (p."images"::json->>0)
FROM "product" p WHERE "order"."product_id" = p."id" AND "order"."product_title" IS NULL;--> statement-breakpoint
-- Handle orphaned orders
UPDATE "order" SET
  "product_title" = 'Unknown Product',
  "product_price" = COALESCE("order"."amount_paid", 0)
WHERE "product_title" IS NULL;--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "product_title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "product_price" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "refunded_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "refunded_at" timestamp;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "refund_reason" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "payout_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payout_creator_id_idx" ON "payout" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "payout_status_idx" ON "payout" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payout_created_at_idx" ON "payout" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "transaction_creator_id_idx" ON "transaction" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "transaction_order_id_idx" ON "transaction" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "transaction_type_idx" ON "transaction" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transaction_available_at_idx" ON "transaction" USING btree ("available_at");--> statement-breakpoint
CREATE INDEX "transaction_created_at_idx" ON "transaction" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "order" USING btree ("status");