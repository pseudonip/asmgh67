import { recordSchemas, validateRecordData, SUPPORTED_RECORD_TYPES } from "@raincloud/types/records";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { registry } from "~/lib/openapi";
import { getApiUserFromRequest } from "~/lib/server/api.server";
import { db } from "~/lib/server/db";
import { records, zones } from "~/lib/server/db/schema";
import { sendZoneUpdate } from "~/routes/api/dns/sse";

export async function DELETE({ params, request }: { params: { name: string; id: string }; request: Request }) {
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

export async function PATCH({ params, request }: { params: { name: string; id: string }; request: Request }) {
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

  const result = validateRecordData(data.type, data.data);

  if (!result.ok) {
    return Response.json({ error: "invalid_record_data", details: result.error }, { status: 400 });
  }

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

registry.registerPath({
  method: "delete",
  path: "/zones/{name}/records/{id}",
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
      description: "Record deleted successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    }
  }
})

registry.registerPath({
  method: "patch",
  path: "/zones/{name}/records/{id}",
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
          schema: z.object({
            name: z.string(),
            type: z.enum(SUPPORTED_RECORD_TYPES),
            data: z.union(
              Object.entries(recordSchemas).map(([key, schema]) =>
                schema.openapi({ title: `${key}` })
              ) as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]
            ),
            ttl: z.enum(["auto", "5m", "1h", "1d"])
          }),
        },
      },
    }
  },
  responses: {
    200: {
      description: "Record updated successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    }
  }
})
