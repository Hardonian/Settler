import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runBenchmark() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const aiCalls = await prisma.usageEvent.findMany({
    where: {
      eventType: "ai_request",
      timestamp: { gte: thirtyDaysAgo },
    },
    select: { metadata: true },
  });

  const start = performance.now();

  const modelUsage: Record<string, { calls: number; tokens: number; cost: number }> = {};
  for (const call of aiCalls) {
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
  console.log(
    `Time taken without DB group-by/caching (In memory JS processing): ${(end - start).toFixed(2)} ms for ${aiCalls.length} records`
  );
}

runBenchmark()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
