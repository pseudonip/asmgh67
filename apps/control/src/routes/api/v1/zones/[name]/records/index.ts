import { validateRecordData } from "@raincloud/types/records";
import { and, eq, ilike } from "drizzle-orm";
import z from "zod";
import { registry } from "~/lib/openapi";
import { getApiUserFromRequest } from "~/lib/server/api.server";
import { db } from "~/lib/server/db";
import { records, zones } from "~/lib/server/db/schema";
import { sendZoneUpdate } from "~/routes/api/dns/sse";
import { recordSchemas, SUPPORTED_RECORD_TYPES } from "@raincloud/types/records";

export async function GET({ params, request }: { params: { name: string }; request: Request }) {
  const { name } = params;

  const url = new URL(request.url);
  const search = url.searchParams.get("search");

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

  if (!scopes.includes(`${name}:read`) && !scopes.includes(`*:read`)) {
    return Response.json({ error: "missing_scope" }, { status: 403 });
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

export async function PUT({ params, request }: { params: { name: string }; request: Request }) {
  const { name } = params;

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

  const body = await request.json();

  if (!Array.isArray(body)) {
    return Response.json({ error: "invalid_body", detail: "Expected array of records" }, { status: 400 });
  }

  for (const record of body) {
    if (typeof record.name !== "string" || typeof record.type !== "string") {
      return Response.json({ error: "invalid_record" }, { status: 400 });
    }

    if (!["auto", "5m", "1h", "1d"].includes(record.ttl || "auto")) {
      return Response.json({ error: "invalid_ttl", detail: "Expected auto, 5m, 1h or 1d" }, {
        status: 400,
      });
    }

    const result = validateRecordData(record.type, record.data);

    if (!result.ok) {
      return Response.json(
        {
          error: "invalid_record_data",
          detail: `Invalid record data for type ${record.type}: ${result.error}`,
        },
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
          error: "duplicate_record",
          detail:
            "A record with the same name, type and data already exists in this zone.",
        },
        { status: 400 },
      );
    }

    return Response.json(
      {
        error: "internal_server_error",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}

registry.registerPath({
  method: "get",
  path: "/zones/{name}/records",
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "name",
      in: "path",
      required: true,
      description: "Zone name",
      schema: z.string(),
      example: "example.com",
    },
  ],
  responses: {
    200: {
      description: "List of records in the zone",
      content: {
        "application/json": {
          schema: z.array(z.object({
            id: z.string(),
            name: z.string(),
            type: z.enum(SUPPORTED_RECORD_TYPES),
            data: z.union(
              Object.entries(recordSchemas).map(([key, schema]) =>
                schema.openapi({ title: `${key}` })
              ) as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]
            ),
            ttl: z.enum(["auto", "5m", "1h", "1d"]),
          }))
        }
      }
    },
  }
});

registry.registerPath({
  method: "put",
  path: "/zones/{name}/records",
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "name",
      in: "path",
      required: true,
      description: "Zone name",
      schema: z.string(),
      example: "example.com",
    },
  ],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.array(z.object({
            name: z.string(),
            type: z.enum(SUPPORTED_RECORD_TYPES),
            data: z.union(
              Object.entries(recordSchemas).map(([key, schema]) =>
                schema.openapi({ title: `${key}` })
              ) as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]
            ),
            ttl: z.enum(["auto", "5m", "1h", "1d"]).optional(),
          }))
        }
      }
    }
  },
  responses: {
    200: {
      description: "Records created successfully",
      content: {
        "application/json": {
          schema: z.object({
            created: z.array(z.object({
              id: z.string(),
              name: z.string(),
            }))
          })
        }
      }
    }
  }
});
