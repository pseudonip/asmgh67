import dgram from "node:dgram";
import { createHash, randomBytes } from "crypto";
import { db } from "./db";
import { nameservers } from "./db/schema";

export async function listNameservers() {
  let ns = await db
    .select({
      id: nameservers.id,
      hostname: nameservers.hostname,
      ipv4: nameservers.ipv4,
      pool: nameservers.pool,
    })
    .from(nameservers)
    .execute();

  return Promise.all(
    ns.map((n) => {
      return new Promise((resolve) => {
        const client = dgram.createSocket("udp4");
        const start = performance.now();

        const timeout = setTimeout(() => {
          client.close();
          resolve({ ...n, ok: false });
        }, 2000);

        client.send("ping", 53, n.ipv4, (err) => {
          if (err) {
            clearTimeout(timeout);
            client.close();
            resolve({ ...n, ok: false });
          }
        });

        client.on("message", () => {
          const latency = performance.now() - start;
          clearTimeout(timeout);
          client.close();
          resolve({ ...n, ok: true });
        });

        client.on("error", () => {
          clearTimeout(timeout);
          client.close();
          resolve({ ...n, ok: false });
        });
      });
    })
  )
}

export async function createNameserver(
  hostname: string,
  ipv4: string,
  pool: string,
): Promise<string> {
  const token = "rcns_" + randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(token).digest();

  await db
    .insert(nameservers)
    .values({
      hostname,
      ipv4,
      pool,
      auth_token_hash: hash,
    })
    .execute();

  return token;
}
