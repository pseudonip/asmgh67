import { validateRecordData } from "@raincloud/types/records";
import { and, eq, ilike } from "drizzle-orm";
import { getApiUserFromRequest } from "~/lib/server/api.server";
import { db } from "~/lib/server/db";
import { records, zones } from "~/lib/server/db/schema";
import { sendZoneUpdate } from "~/routes/api/dns/sse";

export async function GET({ params, request }) {
  const { name } = params;

  const url = new URL(request.url);
  const search = url.searchParams.get("search");

  const { userId, scopes } = await getApiUserFromRequest(request);

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [zone] = await db
    .select()
    .from(zones)
    .where(eq(zones.name, name))
    .execute();

  if (!zone) {
    return new Response("Zone not found", { status: 404 });
  }

  if (zone.userId !== userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!scopes.includes(`${name}:read`) && !scopes.includes(`*:read`)) {
    return new Response("Forbidden", { status: 403 });
  }

  const recordsData = await db
    .select()
    .from(records)
    .where(
      and(
        eq(records.zoneId, zone.id),
        search ? ilike(records.name, search) : undefined,
      ),
    )
    .execute();

  return Response.json(recordsData);
}

export async function PUT({ params, request }) {
  const { name } = params;

  const { userId, scopes } = await getApiUserFromRequest(request);

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [zone] = await db
    .select()
    .from(zones)
    .where(eq(zones.name, name))
    .execute();

  if (!zone) {
    return new Response("Zone not found", { status: 404 });
  }

  if (zone.userId !== userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!scopes.includes(`${name}:write`) && !scopes.includes(`*:write`)) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await request.json();

  if (!Array.isArray(body)) {
    return new Response("Expected array of records", { status: 400 });
  }

  for (const record of body) {
    if (typeof record.name !== "string" || typeof record.type !== "string") {
      return new Response("Invalid record format", { status: 400 });
    }

    if (!["auto", "5m", "1h", "1d"].includes(record.ttl || "auto")) {
      return new Response("Invalid TTL value, should be auto, 5m, 1h or 1d", {
        status: 400,
      });
    }

    const result = validateRecordData(record.type, record.data);

    if (!result.ok) {
      return new Response(
        `Invalid record data for type ${record.type}: ${result.error}`,
        { status: 400 },
      );
    }
  }

  try {
    const created = await db
      .insert(records)
      .values(
        body.map((record) => ({
          zoneId: zone.id,
          name: record.name,
          type: record.type,
          data: record.data,
          ttl: record.ttl || "auto",
        })),
      )
      .returning()
      .execute();

    await sendZoneUpdate(zone.id);

    return Response.json({
      created: created.map((r) => ({
        id: r.id,
        name: r.name,
      })),
    });
  } catch (e) {
    if (
      e instanceof Error &&
      e.message.includes("records_zone_name_type_data_uq")
    ) {
      return Response.json(
        {
          error: "Duplicate record",
          message:
            "A record with the same name, type and data already exists in this zone.",
        },
        { status: 400 },
      );
    }

    return Response.json(
      {
        error: "Failed to create records",
        message: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}
