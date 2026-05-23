"use server";

import { getUser } from "./auth.actions";

import {
  createRecordForUser,
  getRecordsForUser,
  deleteRecordForUser,
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
  const result = validateRecordData(type, data);

  if (!result.ok) {
    throw new Error(result.error);
  }

  const user = await requireUser();

  return await createRecordForUser(user.id, zoneId, { name, type, data, ttl });
}

export async function deleteRecord(recordId: string) {
  const user = await requireUser();

  return await deleteRecordForUser(user.id, recordId);
}

export async function getZoneRecords(zoneId: string): Promise<Record[]> {
  const user = await requireUser();

  return await getRecordsForUser(user.id, zoneId);
}
