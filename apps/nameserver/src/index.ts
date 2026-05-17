import dnsPacket from "dns-packet";
import "dotenv/config";
import handle from "./handle";
import { State } from "./state";

const PORT = Number(process.env.PORT) || 5354;

let state = new State();

try {
  const res = await fetch(`${process.env.CONTROL_SERVER}/api/dns/zones`, {
    headers: {
      "Authorization": `Bearer ${process.env.AUTH_TOKEN}`
    }
  });

  if (res.ok) {
    const zones = await res.json();
    console.log("Received zones from control server:", zones);
    state.setState(zones);

    console.log("Loaded zones from control server");
  } else {
    console.error("Failed to load zones from control server:", res.statusText);
  }
} catch (err) {
  console.error("Error loading zones from control server:", err);
}

await Bun.udpSocket({
  port: PORT,
  hostname: "0.0.0.0",
  socket: {
    data(socket: any, data: any, port: number, address: string) {
      const query = dnsPacket.decode(Buffer.from(data));
      console.log(`Received query from ${address}:${port}: `, query);

      const res = handle(query, state); console.log(res);
      const encoded = dnsPacket.encode(res);

      socket.send(encoded, port, address);
    }
  }
});

console.log(`DNS server is running on port ${PORT}`);
