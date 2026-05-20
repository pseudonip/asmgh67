import { createHash } from "crypto";

type Send = (data: unknown, eventName?: string) => void;
const streams = new Map<string, Set<Send>>();

export async function GET({ request }) {
  const auth = request.headers.get("Authorization");

  if (!auth || !auth.startsWith("Bearer ")) {
    //return new Response("Unauthorized", { status: 401 });
  }

  //const token = auth.split(" ")[1];
  //const hash = createHash("sha256").update(token).digest();

  // todo replace hardcoded
  const hostname = "ns1.cyteon.dev";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown, eventName?: string) => {
        let payload = "";
        if (eventName) payload += `event: ${eventName}\n`;
        payload += `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      if (!streams.has(hostname)) {
        streams.set(hostname, new Set([send]));
      } else {
        streams.get(hostname)!.add(send);
      }

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 30000); // every 30sec

      request.signal.addEventListener("abort", () => {
        streams.get(hostname)!.delete(send);
        clearInterval(heartbeat);
        controller.close();

        console.log(`Nameserver ${hostname} disconnected`);
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
