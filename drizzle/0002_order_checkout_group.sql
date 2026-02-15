ALTER TABLE "order" ADD COLUMN "checkout_group_id" text;
--> statement-breakpoint
CREATE INDEX "order_checkout_group_id_idx" ON "order" USING btree ("checkout_group_id");
--> statement-breakpoint
UPDATE "order"
SET "checkout_group_id" = id
WHERE "checkout_group_id" IS NULL;
