import { prisma } from "./src/infrastructure/db/prisma";
async function check() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const res = await prisma.$queryRaw`
          SELECT
            COALESCE(metadata->>'model', 'unknown') as model,
            COUNT(*)::int as calls,
            SUM(COALESCE((metadata->>'tokens')::numeric, 0))::int as tokens,
            SUM(COALESCE((metadata->>'cost')::numeric, 0))::float as cost
          FROM "UsageEvent"
          WHERE "eventType" = 'ai_request'
            AND "timestamp" >= ${thirtyDaysAgo}
          GROUP BY COALESCE(metadata->>'model', 'unknown')
        `;
    console.log("DB Group By Response:", res);

    const aiCalls = await prisma.usageEvent.findMany({
      where: {
        eventType: "ai_request",
        timestamp: { gte: thirtyDaysAgo },
      },
      select: { metadata: true },
    });

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
    console.log("In memory JS aggregation Response:", modelUsage);
  } catch (e) {
    console.error(e);
  }
}
check()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    process.exit(0);
  });
