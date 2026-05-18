"use server";

import { eq } from "drizzle-orm";
import { resolveNs } from "node:dns/promises";
import { getUser } from "./auth";
import { db } from "./db";
import { nameservers, zones } from "./db/schema";

export async function createZone(name: string) {
  const user = await getUser();

  if (!user) {
    console.log("Unauthorized attempt to create zone");
    throw new Error("Unauthorized");
  }

  const existingZone = await db
    .select()
    .from(zones)
    .where(eq(zones.name, name))
    .execute();

  if (existingZone.length > 0) {
    console.log("Zone creation failed: domain already registered:", name);
    throw new Error("This domain is already registered with us");
  }

  await db
    .insert(zones)
    .values({
      userId: user.id,
      name,
    })
    .execute();
}

export async function getZone(name: string) {
  const user = await getUser();

  if (!user) {
    console.log("Unauthorized attempt to get zone:", name);
    throw new Error("Unauthorized");
  }

  const [zone] = await db
    .select()
    .from(zones)
    .where(eq(zones.name, name))
    .execute();

  if (!zone) {
    console.log("Zone not found:", name);
    return null;
  }

  if (zone.userId !== user.id) {
    console.log("Unauthorized attempt to access zone:", name);
    throw new Error("Unauthorized");
  }

  return zone;
}

export async function getUserZones() {
  const user = await getUser();

  if (!user) {
    console.log("Unauthorized attempt to get user zones");
    throw new Error("Unauthorized");
  }

  const userZones = await db
    .select()
    .from(zones)
    .where(eq(zones.userId, user.id))
    .execute();

  return userZones;
}

export async function getZoneSetupStatus(name: string) {
  const user = await getUser();

  if (!user) {
    console.log("Unauthorized attempt to get zone setup status:", name);
    throw new Error("Unauthorized");
  }

  const [zone] = await db
    .select()
    .from(zones)
    .where(eq(zones.name, name))
    .execute();

  if (!zone) {
    console.log("Zone not found when checking setup status:", name);
    return null;
  }

  if (zone.userId !== user.id) {
    console.log("Unauthorized attempt to access zone setup status:", name);
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

      console.log("Zone setup complete:", name);
      return { complete: true };
    } else {
      if (hasAllNs) {
        const extraNs = ns.filter((n) => !nsNames.includes(n));

        return { complete: false, remove: extraNs, add: [], added: nsNames };
      } else {
        const missingNs = nsNames.filter((n) => !ns.includes(n));
        const extraNs = ns.filter((n) => !nsNames.includes(n));

        return { complete: false, remove: extraNs, add: missingNs, added: nsNames.filter((n) => ns.includes(n)) };
      }
    }
  } catch (err) {
    return { complete: false, remove: [], add: nsNames, added: [] };
  }
}
