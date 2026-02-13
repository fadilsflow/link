ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS "public_theme" text DEFAULT 'system' NOT NULL;
