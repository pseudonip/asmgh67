"use server";

import { count } from "drizzle-orm";
import { getUser } from "./auth.actions";
import { db } from "./db";
import { records, users, zones } from "./db/schema";

async function requireAdmin() {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!user.isAdmin) {
    throw new Error("Forbidden");
  }

  return user;
}

export async function getAllZones() {
  await requireAdmin();

  return await db.select().from(zones);
}

export async function getAllUsers() {
  await requireAdmin();

  return await db.select().from(users).execute();
}

export async function getOverview() {
  await requireAdmin();

  const [userCount] = await db.select({ count: count() }).from(users).execute();
  const [zoneCount] = await db.select({ count: count() }).from(zones).execute();
  const [recordCount] = await db.select({ count: count() }).from(records).execute();

  return {
    userCount: Number(userCount.count),
    zoneCount: Number(zoneCount.count),
    recordCount: Number(recordCount.count),
  };
}
