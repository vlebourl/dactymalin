CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "liste_user_id_idx" ON "liste" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profil_user_id_idx" ON "profil" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");