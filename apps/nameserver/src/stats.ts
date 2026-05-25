const BUCKET_MS = 1000 * 60 * 5; // 5 mins

function currentBucket(): string {
  return new Date(Math.floor(Date.now() / BUCKET_MS) * BUCKET_MS).toISOString();
}

const counters = new Map<string, number>();

export function recordQuery(zoneName: string, rcode: string) {
  const key = `${currentBucket()}|${zoneName}|${rcode}`;
  counters.set(key, (counters.get(key) ?? 0) + 1);
}

async function flush() {
  if (counters.size === 0) return;
  const snapshot = [...counters.entries()];
  counters.clear();

  const stats = snapshot.map(([key, count]) => {
    const [bucket, zoneName, rcode] = key.split("|");
    return { bucket, zoneName, rcode, count };
  });

  console.log("Flushing stats:", stats);

  try {
    const result = await fetch(`${process.env.CONTROL_SERVER}/api/dns/stats`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stats }),
    });

    if (!result.ok) {
      console.error("Failed to flush stats:", await result.text());
    }
  } catch (error) {
    console.error("Failed to flush stats:", error);
  }
}

export function startStats() {
  setInterval(flush, 1000 * 10); // every 5 mins
}
