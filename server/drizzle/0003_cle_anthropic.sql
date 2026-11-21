CREATE TABLE "cle_anthropic" (
	"user_id" text PRIMARY KEY NOT NULL,
	"chiffre" text NOT NULL,
	"fin" text NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cle_anthropic" ADD CONSTRAINT "cle_anthropic_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;