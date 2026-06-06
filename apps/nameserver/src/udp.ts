import dnsPacket from "dns-packet";
import { applyEdns } from "./edns";
import handle from "./handle";
import { State } from "./state";

export function startUdp(port: number, state: State) {
 Bun.udpSocket({
    port: port,
    hostname: "0.0.0.0",
    socket: {
      data(socket: any, data: any, port: number, address: string) {
        try {
          const query = dnsPacket.decode(Buffer.from(data));
          console.log(
            `Received UDP query for ${query.questions?.map((q: any) => `${q.name}:${q.type}`).join(", ")}`,
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

  console.log(`DNS UDP server started on port ${port}`);
}
