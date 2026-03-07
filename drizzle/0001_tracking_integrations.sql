CREATE TABLE "tracking_integration" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "provider" text NOT NULL,
  "tracking_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tracking_integration"
ADD CONSTRAINT "tracking_integration_user_id_user_id_fk"
FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "tracking_integration_user_id_idx" ON "tracking_integration" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "tracking_integration_user_provider_idx" ON "tracking_integration" USING btree ("user_id","provider");
