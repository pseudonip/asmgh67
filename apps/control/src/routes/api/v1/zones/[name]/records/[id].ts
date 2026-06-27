import { and, eq } from "drizzle-orm";
import { getApiUserFromRequest } from "~/lib/server/api.server";
import { db } from "~/lib/server/db";
import { records, zones } from "~/lib/server/db/schema";
import { sendZoneUpdate } from "~/routes/api/dns/sse";

export async function DELETE({ params, request }) {
  const { name, id } = params;

  const { userId, scopes } = await getApiUserFromRequest(request);

  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const [zone] = await db
    .select()
    .from(zones)
    .where(eq(zones.name, name))
    .execute();

  if (!zone) {
    return Response.json({ error: "zone_not_found" }, { status: 404 });
  }

  if (zone.userId !== userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!scopes.includes(`${name}:write`) && !scopes.includes(`*:write`)) {
    return Response.json({ error: "missing_scope" }, { status: 403 });
  }

  await db
    .delete(records)
    .where(and(eq(records.id, id), eq(records.zoneId, zone.id)))
    .execute();

  await sendZoneUpdate(zone.id);

  return Response.json({ success: true });
}

export async function PATCH({ params, request }) {
  const { name, id } = params;

  const { userId, scopes } = await getApiUserFromRequest(request);

  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const [zone] = await db
    .select()
    .from(zones)
    .where(eq(zones.name, name))
    .execute();

  if (!zone) {
    return Response.json({ error: "zone_not_found" }, { status: 404 });
  }

  if (zone.userId !== userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!scopes.includes(`${name}:write`) && !scopes.includes(`*:write`)) {
    return Response.json({ error: "missing_scope" }, { status: 403 });
  }

  const data = await request.json();

  await db
    .update(records)
    .set({
      name: data.name,
      type: data.type,
      data: data.data,
      ttl: data.ttl,
    })
    .where(and(eq(records.id, id), eq(records.zoneId, zone.id)))
    .execute();

  await sendZoneUpdate(zone.id);

  return Response.json({ success: true });
}
