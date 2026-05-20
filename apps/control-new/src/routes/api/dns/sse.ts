import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "~/lib/server/db";
import { nameservers } from "~/lib/server/db/schema";

type Send = (data: unknown, eventName?: string) => void;
const streams = new Map<string, Set<Send>>();

export async function GET({ request }) {
  const auth = request.headers.get("Authorization");

  if (!auth || !auth.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = auth.split(" ")[1];
  const hash = createHash("sha256").update(token).digest();

  const [ns] = await db.select()
    .from(nameservers)
    .where(eq(nameservers.auth_token_hash, hash))
    .execute();

  if (!ns) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log(`Nameserver ${ns.hostname} connected to SSE stream`);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown, eventName?: string) => {
        let payload = "";
        if (eventName) payload += `event: ${eventName}\n`;
        payload += `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      if (!streams.has(ns.hostname)) {
        streams.set(ns.hostname, new Set([send]));
      } else {
        streams.get(ns.hostname)!.add(send);
      }

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 30000); // every 30sec

      request.signal.addEventListener("abort", () => {
        streams.get(ns.hostname)!.delete(send);
        clearInterval(heartbeat);
        controller.close();

        console.log(`Nameserver ${ns.hostname} disconnected`);
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
