import dnsPacket from "dns-packet";
import "dotenv/config";
import { ServerEventName } from "@raincloud/types/sse";
import handle from "./handle";
import { State } from "./state";
import { startStats } from "./stats";
import { applyEdns } from "./edns";

const PORT = Number(process.env.PORT) || 5354;

let state = new State();

await Bun.udpSocket({
  port: PORT,
  hostname: "0.0.0.0",
  socket: {
    data(socket: any, data: any, port: number, address: string) {
      try {
        const query = dnsPacket.decode(Buffer.from(data));
        console.log(
          `Received query for ${query.questions?.map((q: any) => `${q.name}:${q.type}`).join(", ")}`,
        );

        let res = handle(query, state);
        res = applyEdns(res, query);

        const encoded = dnsPacket.encode(res);

        socket.send(encoded, port, address);
      } catch (err) {
        console.error("Failed to handle DNS query: ", err);
      }
    },
  },
});

console.log(`DNS server is running on port ${PORT}`);

startStats();

let wait = 1000;

while (true) {
  try {
    const controller = new AbortController();

    console.log("Connecting to control server SSE stream...");

    const res = await fetch(`${process.env.CONTROL_SERVER}/api/dns/sse`, {
      headers: {
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      },
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      throw new Error(`Failed to connect to control server: ${res.statusText}`);
    }

    wait = 1000;
    console.log("Connected to control server SSE stream");

    // so that incase we missed updates while offline
    try {
      const res = await fetch(`${process.env.CONTROL_SERVER}/api/dns/zones`, {
        headers: {
          Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
        },
      });

      if (res.ok) {
        const zones = await res.json();
        console.log("Received zones from control server:", zones);
        state.setState(zones);

        console.log("Loaded zones from control server");
      } else {
        console.error(
          "Failed to load zones from control server:",
          res.statusText,
        );
      }
    } catch (err) {
      console.error("Error loading zones from control server:", err);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 2);

          if (frame.startsWith(":")) continue;

          let event: ServerEventName | undefined;
          let data = "";

          for (const line of frame.split("\n")) {
            if (line.startsWith("event:"))
              event = line.slice(6).trim() as ServerEventName;
            else if (line.startsWith("data:")) data += line.slice(5).trim();
          }

          if (event === "updateZone") {
            try {
              const zone = JSON.parse(data);
              console.log("Received zone update from control server:", zone);
              state.set(zone);
            } catch (err) {
              console.error("Failed to parse zone update data:", err);
            }
          } else if (event === "deleteZone") {
            try {
              const { name } = JSON.parse(data);

              console.log("Received zone delete from control server:", name);
              state.delete(name);
            } catch (err) {
              console.error("Failed to parse zone delete data:", err);
            }
          }
        }
      }
    } finally {
      controller.abort();
      reader.releaseLock();
      console.log("Disconnected from control server SSE stream");
    }
  } catch (err) {
    console.error("connection lost: ", err);
  }

  await Bun.sleep(wait);
  wait = Math.min(wait * 2, 10000);
}
