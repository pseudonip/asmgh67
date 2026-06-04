"use server";

import { getUser } from "./auth.actions";

import {
  createZoneForUser,
  getZoneForUser,
  getZonesForUser,
  getZoneSetupStatusForUser,
  deleteZoneForUser,
} from "./zones.server";

async function requireUser() {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function createZone(name: string) {
  if (!/^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,63}$/.test(name)) {
    throw new Error("Invalid domain name");
  }

  const user = await requireUser();

  return await createZoneForUser(user.id, name);
}

export async function getZone(name: string) {
  const user = await requireUser();

  return await getZoneForUser(user.id, name);
}

export async function getUserZones() {
  const user = await requireUser();

  return await getZonesForUser(user.id);
}

export async function getZoneSetupStatus(name: string) {
  const user = await requireUser();

  return await getZoneSetupStatusForUser(user.id, name);
}

export async function deleteZone(name: string) {
  const user = await requireUser();

  await deleteZoneForUser(user.id, name);
}
