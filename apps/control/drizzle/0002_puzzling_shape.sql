CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"apex" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"serial" bigint DEFAULT 1 NOT NULL,
	"ns_pool" text DEFAULT 'default' NOT NULL,
	CONSTRAINT "zones_apex_unique" UNIQUE("apex")
);
--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;