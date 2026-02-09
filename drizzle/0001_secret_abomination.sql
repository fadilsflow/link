CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"product_id" text NOT NULL,
	"buyer_email" text NOT NULL,
	"buyer_name" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"checkout_answers" json,
	"note" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"delivery_token" text NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"email_sent_at" timestamp,
	"idempotency_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_delivery_token_unique" UNIQUE("delivery_token"),
	CONSTRAINT "order_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "sales_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "total_revenue" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "total_revenue" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "total_sales_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "total_views" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_creator_id_idx" ON "order" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "order_product_id_idx" ON "order" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_buyer_email_idx" ON "order" USING btree ("buyer_email");--> statement-breakpoint
CREATE INDEX "order_delivery_token_idx" ON "order" USING btree ("delivery_token");