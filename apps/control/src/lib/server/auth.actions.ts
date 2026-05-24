"use server";

import bcrypt from "bcrypt";
import { randomBytes, createHash } from "crypto";
import { eq } from "drizzle-orm";
import { setCookie, getCookie } from "vinxi/http";
import { getRequestEvent } from "solid-js/web";

import { db } from "./db";
import { users, sessions } from "./db/schema";
import { getUserFromToken } from "./auth.server";

export async function register({
  displayName,
  email,
  password,
}: {
  displayName: string;
  email: string;
  password: string;
}) {
  try {
    const emailExists = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .execute();

    if (emailExists.length > 0) {
      throw new Error("Email already in use");
    }
  } catch (err) {
    console.error("Error checking email existence:", err);
    throw new Error("An error occurred while creating your account");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({
      displayName,
      email,
      passwordHash,
    })
    .returning();

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
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .execute();

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

export async function logout() {
  const req = getRequestEvent()?.request;

  let token;

  try {
    token = getCookie("token");
  } catch {
    const cookieHeader = req?.headers.get("cookie") ?? "";
    token = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/)?.[1];
  }

  if (token) {
    const sha256 = createHash("sha256").update(token).digest();

    await db.delete(sessions).where(eq(sessions.tokenHash, sha256)).execute();
  }

  setCookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
  });
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const user = await getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const passwordValid = await bcrypt.compare(oldPassword, user.passwordHash);

  if (!passwordValid) {
    throw new Error("Old password is incorrect");
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, user.id))
    .execute();
}

export async function getUser() {
  const req = getRequestEvent()?.request;

  let token;

  try {
    token = getCookie("token");
  } catch {
    const cookieHeader = req?.headers.get("cookie") ?? "";
    token = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/)?.[1];
  }

  if (!token) return null;

  return getUserFromToken(token);
}
