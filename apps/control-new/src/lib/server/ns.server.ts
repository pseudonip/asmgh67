import { createHash, randomBytes } from "crypto";
import { db } from "./db";
import { nameservers } from "./db/schema";

export async function listNameservers() {
  return await db
    .select({
      id: nameservers.id,
      hostname: nameservers.hostname,
      ipv4: nameservers.ipv4,
      pool: nameservers.pool,
    })
    .from(nameservers)
    .execute();
}

export async function createNameserver(
  hostname: string,
  ipv4: string,
  pool: string,
): Promise<string> {
  const token = "rcns_" + randomBytes(32).toString("hex");

  const hash = createHash("sha256").update(token).digest();

  await db
    .insert(nameservers)
    .values({
      hostname,
      ipv4,
      pool,
      auth_token_hash: hash,
    })
    .execute();

  return token;
}
