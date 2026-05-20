"use server";

import { getUser } from "./auth.actions";

import {
  createRecordForUser,
  getRecordsForUser,
} from "./records.server";

import { Record, RecordData } from "./db/schema";

async function requireUser() {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function createRecord(
  zoneId: string,
  name: string,
  type: string,
  data: RecordData,
) {
  const user = await requireUser();

  return await createRecordForUser(
    user.id,
    zoneId,
    name,
    type,
    data,
  );
}

export async function getZoneRecords(
  zoneId: string,
): Promise<Record[]> {
  const user = await requireUser();

  return await getRecordsForUser(user.id, zoneId);
}
