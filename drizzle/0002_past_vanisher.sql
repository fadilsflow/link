CREATE TABLE "block_click" (
	"id" text PRIMARY KEY NOT NULL,
	"block_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_view" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "block_click" ADD CONSTRAINT "block_click_block_id_block_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."block"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_click" ADD CONSTRAINT "block_click_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_view" ADD CONSTRAINT "profile_view_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "block_click_block_id_idx" ON "block_click" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "block_click_user_id_idx" ON "block_click" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "block_click_created_at_idx" ON "block_click" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "profile_view_user_id_idx" ON "profile_view" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profile_view_created_at_idx" ON "profile_view" USING btree ("created_at");