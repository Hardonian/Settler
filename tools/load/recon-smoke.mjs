const base = process.env.LOAD_BASE_URL || "http://127.0.0.1:3000";

async function hit(path, init, count) {
  const latencies = [];
  for (let i = 0; i < count; i += 1) {
    const start = Date.now();
    const response = await fetch(`${base}${path}`, init);
    latencies.push(Date.now() - start);
    if (response.status >= 500) throw new Error(`${path} returned ${response.status}`);
  }
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  return { p50, p95 };
}

const read = await hit("/api/v1/health", undefined, 25);
const write = await hit(
  "/api/v1/runs",
  {
    method: "POST",
    headers: {
      "x-api-key": process.env.LOAD_API_KEY || "rk_invalid",
      "idempotency-key": `load-${Date.now()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: "load",
      sourceAdapter: "stripe",
      targetAdapter: "shopify",
      async: true,
    }),
  },
  10
);

console.log(JSON.stringify({ read, write }, null, 2));
