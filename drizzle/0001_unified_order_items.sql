CREATE TABLE "order_item" (
  "id" text PRIMARY KEY NOT NULL,
  "order_id" text NOT NULL,
  "creator_id" text,
  "product_id" text,
  "product_title" text NOT NULL,
  "product_price" integer NOT NULL,
  "product_image" text,
  "quantity" integer DEFAULT 1 NOT NULL,
  "amount_paid" integer DEFAULT 0 NOT NULL,
  "checkout_answers" json,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "order_item_order_id_idx" ON "order_item" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX "order_item_creator_id_idx" ON "order_item" USING btree ("creator_id");
--> statement-breakpoint
CREATE INDEX "order_item_product_id_idx" ON "order_item" USING btree ("product_id");
--> statement-breakpoint
INSERT INTO "order_item" (
  "id",
  "order_id",
  "creator_id",
  "product_id",
  "product_title",
  "product_price",
  "product_image",
  "quantity",
  "amount_paid",
  "checkout_answers",
  "created_at",
  "updated_at"
)
SELECT
  md5(o.id || '-legacy-item'),
  o.id,
  o.creator_id,
  o.product_id,
  o.product_title,
  o.product_price,
  o.product_image,
  o.quantity,
  o.amount_paid,
  o.checkout_answers,
  o.created_at,
  o.updated_at
FROM "order" o
WHERE NOT EXISTS (
  SELECT 1 FROM "order_item" oi WHERE oi.order_id = o.id
);
