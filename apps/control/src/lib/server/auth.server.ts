import { and, eq, gt } from "drizzle-orm";
import { createHash } from "crypto";
import { db } from "./db";
import { sessions, User, users } from "./db/schema";

export async function getUserFromToken(token: string): Promise<{
  user: User | null;
  mfaRequired: boolean;
}> {
  const sha256 = createHash("sha256").update(token).digest();

  const [session] = await db
    .select({ user: users, mfa_verified: sessions.mfa_verified })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, sha256),
        gt(sessions.expires_at, new Date().toISOString()),
      ),
    )
    .execute();

  if (!session)
    return {
      user: null,
      mfaRequired: false,
    };

  if (session.user.mfaEnabled && !session.mfa_verified) {
    return {
      user: session.user,
      mfaRequired: true,
    };
  }

  return {
    user: session.user,
    mfaRequired: false,
  };
}
