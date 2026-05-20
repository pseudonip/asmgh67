import { eq } from "drizzle-orm";

import { db } from "./db";
import {
  Record,
  RecordData,
  records,
  zones,
} from "./db/schema";

async function verifyZoneOwnership(
  userId: string,
  zoneId: string,
) {
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
  name: string,
  type: string,
  data: RecordData,
) {
  await verifyZoneOwnership(userId, zoneId);

  const [record] = await db
    .insert(records)
    .values({
      zoneId,
      name,
      type,
      data,
    })
    .returning()
    .execute();

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
