import { eq } from "drizzle-orm";
import { resolveNs } from "node:dns/promises";

import { db } from "./db";
import { nameservers, zones } from "./db/schema";

export async function createZoneForUser(userId: string, name: string) {
  const existingZone = await db
    .select()
    .from(zones)
    .where(eq(zones.name, name))
    .execute();

  if (existingZone.length > 0) {
    throw new Error("This domain is already registered with us");
  }

  await db
    .insert(zones)
    .values({
      userId,
      name,
    })
    .execute();
}

export async function getZoneForUser(userId: string, name: string) {
  const [zone] = await db
    .select()
    .from(zones)
    .where(eq(zones.name, name))
    .execute();

  if (!zone) {
    return null;
  }

  if (zone.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return zone;
}

export async function getZonesForUser(userId: string) {
  return await db
    .select()
    .from(zones)
    .where(eq(zones.userId, userId))
    .execute();
}

export async function getZoneSetupStatusForUser(userId: string, name: string) {
  const [zone] = await db
    .select()
    .from(zones)
    .where(eq(zones.name, name))
    .execute();

  if (!zone) {
    return null;
  }

  if (zone.userId !== userId) {
    throw new Error("Unauthorized");
  }

  if (zone.status === "active") {
    return { complete: true };
  }

  const servers = await db
    .select()
    .from(nameservers)
    .where(eq(nameservers.pool, zone.nsPool))
    .execute();

  const nsNames = servers.map((r) => r.hostname);

  try {
    const ns = await resolveNs(zone.name);

    const hasAllNs = nsNames.every((n) => ns.includes(n));

    if (hasAllNs && ns.length === nsNames.length) {
      await db
        .update(zones)
        .set({ status: "active" })
        .where(eq(zones.name, zone.name))
        .execute();

      return { complete: true };
    }

    const missingNs = nsNames.filter((n) => !ns.includes(n));

    const extraNs = ns.filter((n) => !nsNames.includes(n));

    return {
      complete: false,
      remove: extraNs,
      add: missingNs,
      added: nsNames.filter((n) => ns.includes(n)),
    };
  } catch {
    return {
      complete: false,
      remove: [],
      add: nsNames,
      added: [],
    };
  }
}
