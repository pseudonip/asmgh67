import { eq } from "drizzle-orm";
import { getApiUserFromRequest } from "~/lib/server/api.server";
import { db } from "~/lib/server/db";
import { records, zones } from "~/lib/server/db/schema";

export async function DELETE({ params, request }) {
  const { name, id } = params;

  const user = await getApiUserFromRequest(request);

  if (!user) {
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

  if (zone.userId !== user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  await db.delete(records).where(eq(records.id, id)).execute();

  return Response.json({ success: true });
}
