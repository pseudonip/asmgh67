DELETE FROM records
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           row_number() OVER (
             PARTITION BY zone_id, name, type, data
             ORDER BY id
           ) AS rn
    FROM records
  ) t
  WHERE t.rn > 1
);
--> statement-breakpoint

ALTER TABLE "records" ADD CONSTRAINT "records_zone_name_type_data_uq" UNIQUE("zone_id","name","type","data");
