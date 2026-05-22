import { and, eq } from "drizzle-orm";
import { createHash } from "crypto";
import { db } from "~/lib/server/db";
import { nameservers, records, zones } from "~/lib/server/db/schema";

export async function GET({ request }) {
  console.log("Received request for zones");

  const auth = request.headers.get("Authorization");

  if (!auth || !auth.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
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

  const allNs = await db
    .select()
    .from(nameservers)
    .where(eq(nameservers.pool, ns.pool))
    .execute();

  const rows = await db
    .select({
      zoneId: zones.id,
      zoneName: zones.name,
      serial: zones.serial,
      recordName: records.name,
      recordType: records.type,
      recordData: records.data,
    })
    .from(zones)
    .leftJoin(records, eq(records.zoneId, zones.id))
    .where(eq(zones.nsPool, ns.pool))
    .execute();

  const byZone = new Map();

  for (const row of rows) {
    let z = byZone.get(row.zoneId);

    if (!z) {
      z = {
        name: row.zoneName,
        serial: row.serial,
        records: {},
        ns: allNs.map((ns) => ns.hostname),
      };

      byZone.set(row.zoneId, z);
    }

    if (!row.recordName) continue;

    const fqdn =
      row.recordName == "@"
        ? row.zoneName
        : `${row.recordName}.${row.zoneName}`;
    const key = `${fqdn}:${row.recordType}`;

    (z.records[key] ??= []).push({
      name: fqdn,
      type: row.recordType,
      data: row.recordData,
      ttl: 300,
    });
  }

  return Response.json([...byZone.values()]);
}
