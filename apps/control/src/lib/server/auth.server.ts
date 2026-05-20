import { and, eq, gt } from "drizzle-orm";
import { createHash } from "crypto";
import { db } from "./db";
import { sessions, User, users } from "./db/schema";

export async function getUserFromToken(token: string): Promise<Omit<User, "passwordHash"> | null> {
  const sha256 = createHash("sha256").update(token).digest();

  const [session] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, sha256),
        gt(sessions.expires_at, new Date().toISOString()),
      ),
    )
    .execute();

  if (!session) return null;

  delete session.user.passwordHash;

  return session.user;
}
