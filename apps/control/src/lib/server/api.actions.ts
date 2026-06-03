"use server";

import { randomBytes, createHash } from "crypto";
import { db } from "./db";
import { apiKeys } from "./db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "./auth.actions";

export async function createApiKey(
  name: string,
): Promise<{ id: string; token: string }> {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const token = "rc_api_" + randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(token).digest();

  const [key] = await db
    .insert(apiKeys)
    .values({
      userId: user.id,
      name,
      tokenHash: hash,
      tokenStart: token.slice(0, 16),
    })
    .returning()
    .execute();

  return {
    id: key.id,
    token,
  };
}

export async function getApiKeys(): Promise<
  { id: string; name: string; tokenStart: string }[]
> {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const keys = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id))
    .execute();

  return keys.map((key) => ({
    id: key.id,
    name: key.name,
    tokenStart: key.tokenStart ?? "",
  }));
}

export async function deleteApiKey(id: string) {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const [key] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.id, id))
    .execute();

  if (!key) {
    throw new Error("API key not found");
  }

  if (key.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  await db.delete(apiKeys).where(eq(apiKeys.id, id)).execute();
}
