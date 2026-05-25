"use server";

import { count, gte, sql } from "drizzle-orm";
import { getUser } from "./auth.actions";
import { db } from "./db";
import { queryStats, records, users, zones } from "./db/schema";

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

export async function getOverview() {
  await requireAdmin();

  const [userCount] = await db.select({ count: count() }).from(users).execute();
  const [zoneCount] = await db.select({ count: count() }).from(zones).execute();
  const [recordCount] = await db
    .select({ count: count() })
    .from(records)
    .execute();

  const now = new Date();
  now.setMinutes(0, 0, 0);

  const start = new Date(now);
  start.setHours(now.getHours() - 23);

  const [{ totalQueryCount24h }] = await db
    .select({
      totalQueryCount24h: sql<number>`coalesce(sum(${queryStats.count}), 0)`,
    })
    .from(queryStats)
    .where(gte(queryStats.bucket, start))
    .execute();

  const rcodeRows = await db
    .select({
      rcode: queryStats.rcode,
      total: sql<number>`coalesce(sum(${queryStats.count}), 0)`,
    })
    .from(queryStats)
    .where(gte(queryStats.bucket, start))
    .groupBy(queryStats.rcode)
    .execute();

  let hourlyLabels: string[] = [];
  let hourlyPoints: number[] = [];

  const hourlyRows = await db
    .select({
      hour: sql<string>`date_trunc('hour', ${queryStats.bucket})`.as("hour"),
      total: sql<number>`sum(${queryStats.count})::int`,
    })
    .from(queryStats)
    .where(gte(queryStats.bucket, start))
    .groupBy(sql`date_trunc('hour', ${queryStats.bucket})`)
    .orderBy(sql`date_trunc('hour', ${queryStats.bucket})`);

  const hourlyMap = new Map<number, number>(
    hourlyRows.map((r) => [new Date(r.hour).getTime(), r.total])
  );

  for (let i = 0; i < 24; i++) {
    const d = new Date(start)
    d.setHours(start.getHours() + i)
    d.setMinutes(0, 0, 0)

    hourlyLabels.push(
      d.toLocaleTimeString([], {
        hour: "numeric",
        hour12: true
      })
    )

    hourlyPoints.push(hourlyMap.get(d.getTime()) ?? 0)
  }

  return {
    userCount: Number(userCount.count),
    zoneCount: Number(zoneCount.count),
    recordCount: Number(recordCount.count),
    totalQueryCount24h: Number(totalQueryCount24h),
    rcodeRows,
    hourlyPoints,
    hourlyLabels,
  };
}
