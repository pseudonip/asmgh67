"use server";

import { eq } from "drizzle-orm";
import { getUser } from "./auth";
import { db } from "./db";
import { zones } from "./db/schema";

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
    throw new Error("Zone not found");
  }

  if (zone.userId !== user.id) {
    console.log("Unauthorized attempt to access zone:", name);
    throw new Error("Unauthorized");
  }

  return zone;
}
