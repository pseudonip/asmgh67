import dnsPacket from "dns-packet";
import { applyEdns } from "./edns";
import handle from "./handle";
import { State } from "./state";

export function startTcp(port: number, state: State) {
  Bun.listen<{ buffer: Buffer }>({
    hostname: "0.0.0.0",
    port,
    socket: {
      open(socket) {
        socket.data = { buffer: Buffer.alloc(0) };
        socket.timeout(10);
      },

      data(socket, chunk) {
        socket.data.buffer = Buffer.concat([socket.data.buffer, chunk]);

        while (socket.data.buffer.length >= 2) {
          const length = socket.data.buffer.readUInt16BE(0);
          if (socket.data.buffer.length < 2 + length) break;

          const msg = socket.data.buffer.subarray(2, 2 + length);
          socket.data.buffer = socket.data.buffer.subarray(2 + length);

          try {
            const query = dnsPacket.decode(msg);
            console.log(
              `Received TCP query for ${query.questions?.map((q: any) => `${q.name}:${q.type}`).join(", ")}`,
            );

            let res = handle(query, state);
            res = applyEdns(res, query);

            socket.write(dnsPacket.streamEncode(res));
          } catch (err) {
            console.error("Failed to handle DNS query: ", err);
          }
        }
      },

      timeout(socket) {
        console.log("TCP connection timed out");
        socket.end();
      },

      error(socket, err) {
        console.error("TCP socket error: ", err);
      }
    }
  });
}
