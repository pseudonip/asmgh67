CREATE TABLE "query_stats" (
	"zone_id" uuid NOT NULL,
	"bucket" timestamp with time zone NOT NULL,
	"rcode" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "query_stats" ADD CONSTRAINT "query_stats_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;
