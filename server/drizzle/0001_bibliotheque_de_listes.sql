CREATE TABLE "liste" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"nom" text NOT NULL,
	"mots" jsonb NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "liste" ADD CONSTRAINT "liste_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;