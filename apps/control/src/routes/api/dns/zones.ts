import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { db } from "~/lib/server/db";
import { nameservers } from "~/lib/server/db/schema";

export async function GET({ request }) {
  console.log("Received request for zones");

  const auth = request.headers.get("Authorization");

  if (!auth || !auth.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = auth.split(" ")[1];
  const hash = createHash("sha256").update(token).digest();

  const ns = await db
    .select()
    .from(nameservers)
    .where(eq(nameservers.auth_token_hash, hash))
    .execute();

  if (ns.length === 0) {
    return new Response("Unauthorized", { status: 401 });
  }

  // placeholder
  const zones = [
    {
      name: "example.com",
      serial: 1,
      records: {
        "example.com:A": [
          {
            name: "example.com",
            type: "A",
            data: { address: "1.1.1.1" },
            ttl: 300,
          },
        ],
        "test.example.com:TXT": [
          {
            name: "test.example.com",
            type: "TXT",
            data: { text: "hi" },
            ttl: 300,
          },
        ],
      },
    },
  ];

  return new Response(JSON.stringify(zones), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
