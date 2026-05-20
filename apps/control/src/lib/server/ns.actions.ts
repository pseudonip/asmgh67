"use server";

import { getUser } from "./auth.actions";
import {
  createNameserver,
  listNameservers,
} from "./ns.server";

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

export async function getNameservers() {
  await requireAdmin();

  return await listNameservers();
}

export async function addNameserver(
  hostname: string,
  ipv4: string,
  pool: string,
): Promise<string> {
  await requireAdmin();

  return await createNameserver(hostname, ipv4, pool);
}
