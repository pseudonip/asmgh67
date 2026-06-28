import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "~/lib/server/db";
import { nameservers, records, zones } from "~/lib/server/db/schema";
import {
  SerializedRecord,
  SerializedZone,
  ServerEventMap,
  ServerEventName,
} from "@raincloud/types/sse";

type Send = <E extends ServerEventName>(
  event: E,
  data: ServerEventMap[E],
) => void;
const streams: Map<string, Set<Send>> = ((globalThis as any).__sseStreams ??=
  new Map());

export async function GET({ request, nativeEvent }: {
  request: Request;
  nativeEvent: any;
}) {
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
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  console.log(`Nameserver ${ns.hostname} connected to SSE stream`);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));

      const send: Send = (event, data) => {
        let payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      if (!streams.has(ns.pool)) {
        streams.set(ns.pool, new Set([send]));
      } else {
        streams.get(ns.pool)!.add(send);
      }

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch (e) {
          console.error("Error sending heartbeat:", e);
        }
      }, 30000); // every 30sec

      const cleanup = () => {
        streams.get(ns.pool)!.delete(send);

        clearInterval(heartbeat);
        controller.close();

        console.log(`Nameserver ${ns.hostname} disconnected`);
      };

      nativeEvent.node.res.on("close", cleanup);
      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function sendZoneDeletion(zoneName: string, pool: string) {
  const poolStreams = streams.get(pool);

  if (poolStreams) {
    for (const send of poolStreams) {
      send("deleteZone", { name: zoneName });
    }
  }
}

export async function sendZoneUpdate(zoneId: string) {
  console.log(`Sending zone update for zone ${zoneId}`);

  const [zoneData] = await db
    .select({
      name: zones.name,
      serial: zones.serial,
      nsPool: zones.nsPool,
    })
    .from(zones)
    .where(eq(zones.id, zoneId))
    .execute();

  const ns = await db
    .select({
      hostname: nameservers.hostname,
    })
    .from(nameservers)
    .where(eq(nameservers.pool, zoneData.nsPool))
    .execute();

  const zoneRecords = await db
    .select()
    .from(records)
    .where(eq(records.zoneId, zoneId))
    .execute();

  const recordMap: Record<string, SerializedRecord[]> = {};

  for (const r of zoneRecords) {
    const fqdn = r.name === "@" ? zoneData.name : `${r.name}.${zoneData.name}`;
    const key = `${fqdn}:${r.type}`;

    if (!recordMap[key]) {
      recordMap[key] = [];
    }

    let ttl: number;

    switch (r.ttl) {
      case "auto":
        ttl = 3600;
        break;
      case "5m":
        ttl = 300;
        break;
      case "1h":
        ttl = 3600;
        break;
      case "1d":
        ttl = 86400;
        break;
      default:
        ttl = 3600;
    }

    recordMap[key].push({
      name: fqdn,
      type: r.type,
      data: r.data,
      ttl,
    });
  }

  const data: SerializedZone = {
    name: zoneData.name,
    serial: zoneData.serial,
    records: recordMap,
    ns: ns.map((n) => n.hostname),
  };

  const poolStreams = streams.get(zoneData.nsPool);

  console.log(
    `Found ${poolStreams?.size ?? 0} stream(s) for pool ${zoneData.nsPool}`,
  );

  if (poolStreams) {
    for (const send of poolStreams) {
      send("updateZone", data);
    }
  }
}
