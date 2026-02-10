ALTER TABLE "transaction"
ADD CONSTRAINT "transaction_payout_id_payout_id_fk"
FOREIGN KEY ("payout_id") REFERENCES "public"."payout"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "payout_one_pending_per_creator_idx"
ON "payout" USING btree ("creator_id")
WHERE "status" = 'pending';
