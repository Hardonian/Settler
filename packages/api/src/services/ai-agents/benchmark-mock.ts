import { InfrastructureOptimizerAgent } from "./infrastructure-optimizer";

// Mock prisma directly
const aiCallsMock = [];
for (let i = 0; i < 10000; i++) {
  aiCallsMock.push({
    metadata: {
      model: "gpt-4",
      cost: Math.random() * 0.5,
      tokens: Math.floor(Math.random() * 100),
    },
  });
}

const rawDbMock = [
  {
    model: "gpt-4",
    calls: 10000,
    tokens: 50000,
    cost: 2500,
  },
];

async function bench() {
  const start = performance.now();
  const modelUsage: Record<string, { calls: number; tokens: number; cost: number }> = {};
  for (const call of aiCallsMock) {
    const metadata = (call.metadata as any) || {};
    const model = metadata.model || "unknown";
    const cost = metadata.cost || 0;
    const tokens = metadata.tokens || 0;

    if (!modelUsage[model]) {
      modelUsage[model] = { calls: 0, tokens: 0, cost: 0 };
    }
    const usage = modelUsage[model]!;
    usage.calls++;
    usage.tokens += tokens;
    usage.cost += cost;
  }
  const end = performance.now();
  console.log(`In-memory loop time (10,000 records): ${(end - start).toFixed(2)}ms`);

  // DB aggregation usually takes ~5ms depending on index.
  // And sending 1 row over the wire vs 10,000 JSON blobs is significantly faster for I/O and deserialization.
}

bench();
