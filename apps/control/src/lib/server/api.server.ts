import { createHash } from "crypto";
import { apiKeys, users } from "./db/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function getApiUserFromRequest(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      user: null,
      scopes: [],
    };
  }

  const token = authHeader.split(" ")[1];
  const hash = createHash("sha256").update(token).digest();

  const [key] = await db
    .select(
      {
        userId: users.id,
        scopes: apiKeys.scopes
      }
    )
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(eq(apiKeys.tokenHash, hash))
    .execute();

  if (!key) {
    return {
      user: null,
      scopes: [],
    };
  }

  console.log("API Key User:", key);

  return {
    userId: key.userId,
    scopes: key.scopes,
  };
}
