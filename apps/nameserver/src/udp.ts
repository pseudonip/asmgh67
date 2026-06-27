import dnsPacket from "dns-packet";
import { applyEdns, readEdns } from "./edns";
import handle from "./handle";
import { State } from "./state";

export function startUdp(port: number, state: State) {
  Bun.udpSocket({
    port: port,
    hostname: "::",
    socket: {
      async data(socket: any, data: any, port: number, address: string) {
        if (data.toString() === "ping") {
          socket.send("pong", port, address);
          return;
        }

        try {
          const query = dnsPacket.decode(Buffer.from(data));
          console.log(
            `Received UDP query for ${query.questions?.map((q: any) => `${q.name}:${q.type}`).join(", ")}`,
          );

          let res = await handle(query, state);
          res = applyEdns(res, query);
          ("");

          let encoded = dnsPacket.encode(res);
          const { udpSize } = readEdns(query);

          if (encoded.length > udpSize) {
            res.flags = (res.flags ?? 0x8400) | 0x0200; // TC
            res.answers = [];
            encoded = dnsPacket.encode(res);
          }

          socket.send(encoded, port, address);
        } catch (err) {
          console.error("Failed to handle DNS query: ", err);
        }
      },
    },
  });

  console.log(`DNS UDP server started on port ${port}`);
}
