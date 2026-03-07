DROP TABLE IF EXISTS "tracking_integration" CASCADE;

CREATE TABLE "meta_pixel_config" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "pixel_id" text NOT NULL,
  "access_token" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "meta_pixel_config"
ADD CONSTRAINT "meta_pixel_config_user_id_user_id_fk"
FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
ON DELETE cascade ON UPDATE no action;

CREATE INDEX "meta_pixel_config_user_id_idx" ON "meta_pixel_config" USING btree ("user_id");
CREATE UNIQUE INDEX "meta_pixel_config_user_id_idx_unique" ON "meta_pixel_config" USING btree ("user_id");
