ALTER TABLE "product" ALTER COLUMN "product_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "product_files" json;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "images" text[];