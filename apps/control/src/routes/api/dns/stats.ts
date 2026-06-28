import { and, eq, sql } from "drizzle-orm";
import { createHash } from "crypto";
import { db } from "~/lib/server/db";
import { nameservers, queryStats } from "~/lib/server/db/schema";

export async function POST({ request }: { request: Request }) {
  const auth = request.headers.get("Authorization");

  if (!auth || !auth.startsWith("Bearer ")) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = auth.split(" ")[1];
  const hash = createHash("sha256").update(token).digest();

  const [ns] = await db
    .select()
    .from(nameservers)
    .where(eq(nameservers.auth_token_hash, hash))
    .execute();

  if (!ns) {
    return new Response("Unauthorized", { status: 401 });
  }

  const {
    stats,
  }: {
    stats: {
      bucket: string;
      zoneName: string;
      rcode: string;
      count: number;
    }[];
  } = await request.json();

  console.log("Received stats:", stats);

  const data = stats.map((s) => ({
    zoneName: s.zoneName,
    bucket: new Date(s.bucket),
    rcode: s.rcode,
    count: s.count,
  }));

  console.log("Prepared data for insertion:", data);

  try {
    await db
      .insert(queryStats)
      .values(data)
      .onConflictDoUpdate({
        target: [queryStats.zoneName, queryStats.bucket, queryStats.rcode],
        set: { count: sql`${queryStats.count} + excluded.count` },
      })
      .execute();

    return new Response(undefined, { status: 204 });
  } catch (error) {
    console.error("Failed to insert stats:", error);
    return Response.json({ error: "internal_server_error" }, { status: 500 });
  }
}
