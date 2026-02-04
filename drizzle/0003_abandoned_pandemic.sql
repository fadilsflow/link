CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"pay_what_you_want" boolean DEFAULT false NOT NULL,
	"price" integer,
	"sale_price" integer,
	"minimum_price" integer,
	"suggested_price" integer,
	"total_quantity" integer,
	"limit_per_checkout" integer,
	"product_url" text NOT NULL,
	"customer_questions" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;