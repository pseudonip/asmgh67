CREATE TABLE "records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "zones" RENAME COLUMN "apex" TO "name";--> statement-breakpoint
ALTER TABLE "zones" DROP CONSTRAINT "zones_apex_unique";--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_name_unique" UNIQUE("name");--> statement-breakpoint

CREATE OR REPLACE FUNCTION bump_zone_serial() RETURNS trigger AS $$
DECLARE
    target_zone uuid;
BEGIN
    target_zone := COALESCE(NEW.zone_id, OLD.zone_id);
    UPDATE zones SET serial = serial + 1 WHERE id = target_zone;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER records_bump_serial
    AFTER INSERT OR UPDATE OR DELETE ON records
    FOR EACH ROW
    EXECUTE FUNCTION bump_zone_serial();
