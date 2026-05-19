"use server";

import { eq } from "drizzle-orm";
import { getUser } from "./auth";
import { db } from "./db";
import { Record, RecordData, records, zones } from "./db/schema";

export async function createRecord(
  zoneId: string,
  name: string,
  type: string,
  data: RecordData,
) {
  const user = await getUser();

  if (!user) {
    console.log("Unauthorized attempt to create record in zone ", zoneId);
    throw new Error("Unauthorized");
  }

  const [zone] = await db
    .select()
    .from(zones)
    .where(eq(zones.id, zoneId))
    .execute();

  if (!zone) {
    console.log("Zone not found for record creation: ", zoneId);
    throw new Error("Zone not found");
  }

  if (zone.userId !== user.id) {
    console.log("Unauthorized attempt to create record in zone ", zoneId);
    throw new Error("Unauthorized");
  }

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

export async function getZoneRecords(zoneId: string): Promise<Record[]> {
  const user = await getUser();

  if (!user) {
    console.log("Unauthorized attempt to get records for zone ", zoneId);
    throw new Error("Unauthorized");
  }

  const [zone] = await db
    .select()
    .from(zones)
    .where(eq(zones.id, zoneId))
    .execute();

  if (!zone) {
    console.log("Zone not found for record retrieval: ", zoneId);
    throw new Error("Zone not found");
  }

  if (zone.userId !== user.id) {
    console.log("Unauthorized attempt to get records for zone ", zoneId);
    throw new Error("Unauthorized");
  }

  const recordsData = await db
    .select()
    .from(records)
    .where(eq(records.zoneId, zoneId))
    .execute();

  return recordsData;
}
