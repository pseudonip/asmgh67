"use server";

import { getUser } from "./auth.actions";
import { db } from "./db";
import { users, zones } from "./db/schema";

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
