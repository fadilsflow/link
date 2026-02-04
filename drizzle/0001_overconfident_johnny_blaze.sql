ALTER TABLE "user" ADD COLUMN "appearance_bg_type" text DEFAULT 'banner' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "appearance_bg_color" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "appearance_bg_image_url" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "appearance_block_style" text DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "appearance_block_radius" text DEFAULT 'rounded' NOT NULL;