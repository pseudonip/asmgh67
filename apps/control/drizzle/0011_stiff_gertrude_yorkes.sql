ALTER TABLE "sessions" ALTER COLUMN "expires_at" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "query_stats" DROP CONSTRAINT "query_stats_zone_id_zones_id_fk";--> statement-breakpoint
ALTER TABLE "query_stats" ADD COLUMN "zone_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "query_stats" ADD CONSTRAINT "query_stats_zone_name_bucket_rcode_pk" PRIMARY KEY("zone_name","bucket","rcode");--> statement-breakpoint
ALTER TABLE "query_stats" ADD CONSTRAINT "query_stats_zone_name_zones_name_fk" FOREIGN KEY ("zone_name") REFERENCES "public"."zones"("name") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "query_stats_bucket_idx" ON "query_stats" USING btree ("bucket");--> statement-breakpoint
ALTER TABLE "query_stats" DROP COLUMN "zone_id";
