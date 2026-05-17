"use server";

import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { db } from "./db";
import { sessions, users } from "./db/schema";
import { getCookie, setCookie } from "@solidjs/start/http";

export async function register(email: string, password: string) {
  const emailExists = await db.select().from(users).where(eq(users.email, email)).execute();

  if (emailExists.length > 0) {
    throw new Error("Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db.insert(users).values({
    email,
    passwordHash,
  }).returning();

  const token = randomBytes(32).toString("hex");
  const sha256 = createHash("sha256").update(token).digest();

  await db.insert(sessions).values({
    userId: user.id,
    tokenHash: sha256,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week
  });

  setCookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

export async function login(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).execute();

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);

  if (!validPassword) {
    throw new Error("Invalid email or password");
  }

  const token = randomBytes(32).toString("hex");
  const sha256 = createHash("sha256").update(token).digest();

  await db.insert(sessions).values({
    userId: user.id,
    tokenHash: sha256,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week
  });

  setCookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

export async function getUser() {
  const token = getCookie("token");

  if (!token) {
    return null;
  }

  const sha256 = createHash("sha256").update(token).digest();

  const [session] = await db.select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, sha256), gt(sessions.expires_at, new Date().toISOString())))
    .execute();

  return session?.user || null;
}
