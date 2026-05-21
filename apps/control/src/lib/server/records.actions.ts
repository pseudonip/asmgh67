"use server";

import { getUser } from "./auth.actions";

import {
  createRecordForUser,
  getRecordsForUser,
} from "./records.server";

import { Record } from "./db/schema";
import { RecordData, validateRecordData } from "@raincloud/types/records";

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
  const result = validateRecordData(type, data);

  if (!result.ok) {
    throw new Error(result.error);
  }

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
