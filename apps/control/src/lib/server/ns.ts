"use server";

import { createHash, randomBytes } from "crypto";
import { getUser } from "./auth";
import { db } from "./db";
import { nameservers } from "./db/schema";

export async function getNameservers() {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!user.isAdmin) {
    throw new Error("Forbidden");
  }

  const all = await db.select({
    id: nameservers.id,
    hostname: nameservers.hostname,
    ipv4: nameservers.ipv4,
    pool: nameservers.pool,
  }).from(nameservers).execute();

  return all;
}

export async function addNameserver(hostname: string, ipv4: string, pool: string): Promise<string> {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!user.isAdmin) {
    throw new Error("Forbidden");
  }

  const token = "rcns_" + randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(token).digest();

  await db.insert(nameservers).values({
    hostname,
    ipv4,
    pool,
    auth_token_hash: hash
  }).execute();

  return token;
}
