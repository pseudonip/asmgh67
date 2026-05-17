import dnsPacket from "dns-packet";
import handle from "./handle";
import { State } from "./state";

const PORT = Number(process.env.PORT) || 5354;

let state = new State();

// placeholder data
state.set({
  name: "example.com",
  serial: 1,
  records: new Map([
    ["example.com:A", [
      {
        name: "example.com",
        type: "A",
        data: { address: "1.1.1.1" },
        ttl: 300,
      }
    ]],
    ["test.example.com:TXT", [
      {
        name: "test.example.com",
        type: "TXT",
        data: { text: "hi" },
        ttl: 300,
      }
    ]],
  ]),
});

const udp = await Bun.udpSocket({
  port: PORT,
  hostname: "0.0.0.0",
  socket: {
    data(socket, data, port: number, address: string) {
      const query = dnsPacket.decode(Buffer.from(data));
      console.log(`Received query from ${address}:${port}: `, query);

      const res = handle(query, state); console.log(res);
      const encoded = dnsPacket.encode(res);

      socket.send(encoded, port, address);
    }
  }
});

console.log(`DNS server is running on port ${PORT}`);
