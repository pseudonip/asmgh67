import { eq } from "drizzle-orm";
import { db } from "./db";
import { Record, records, Zone, zones } from "./db/schema";
import { RecordData } from "@raincloud/types/records";
import { sendZoneUpdate } from "~/routes/api/dns/sse";

async function verifyZoneOwnership(
  userId: string,
  zoneId: string,
): Promise<Zone> {
  const [zone] = await db
    .select()
    .from(zones)
    .where(eq(zones.id, zoneId))
    .execute();

  if (!zone) {
    throw new Error("Zone not found");
  }

  if (zone.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return zone;
}

export async function createRecordForUser(
  userId: string,
  zoneId: string,
  {
    name,
    type,
    data,
    ttl,
  }: {
    name: string;
    type: string;
    data: RecordData;
    ttl: "auto" | "5m" | "1h" | "1d";
  },
) {
  await verifyZoneOwnership(userId, zoneId);

  const [record] = await db
    .insert(records)
    .values({
      zoneId,
      name,
      type,
      data,
      ttl,
    })
    .returning()
    .execute();

  await sendZoneUpdate(zoneId);

  return record;
}

export async function getRecordsForUser(
  userId: string,
  zoneId: string,
): Promise<Record[]> {
  await verifyZoneOwnership(userId, zoneId);

  return await db
    .select()
    .from(records)
    .where(eq(records.zoneId, zoneId))
    .execute();
}

export async function deleteRecordForUser(userId: string, recordId: string) {
  const [record] = await db
    .select()
    .from(records)
    .where(eq(records.id, recordId))
    .execute();

  if (!record) {
    throw new Error("Record not found");
  }

  const zone = await verifyZoneOwnership(userId, record.zoneId);

  await db.delete(records).where(eq(records.id, recordId)).execute();

  await sendZoneUpdate(zone.id);
}
