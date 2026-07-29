import { prisma } from "./src/infrastructure/db/prisma";

async function seed() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const hasData = await prisma.usageEvent.findFirst({ where: { eventType: "ai_request" } });
  if (!hasData) {
    console.log("Seeding data...");
    const events = [];
    const models = ["gpt-4", "gpt-3.5", "claude", "unknown"];
    for (let i = 0; i < 10000; i++) {
      events.push({
        billingAccountId: "00000000-0000-0000-0000-000000000000",
        eventType: "ai_request",
        timestamp: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
        quantity: 1,
        metadata: {
          model: models[i % models.length],
          cost: Math.random() * 0.5,
          tokens: Math.floor(Math.random() * 1000),
        },
      });
    }

    let account = await prisma.billingAccount.findFirst();
    if (!account) {
      account = await prisma.billingAccount.create({
        data: {
          id: "00000000-0000-0000-0000-000000000000",
          stripeCustomerId: "cus_123",
          plan: "free",
          status: "active",
        },
      });
    }

    events.forEach((e) => (e.billingAccountId = account.id));

    for (let i = 0; i < events.length; i += 1000) {
      await prisma.usageEvent.createMany({ data: events.slice(i, i + 1000) as any });
    }
  }
}

async function runBenchmark() {
  await seed();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  console.log("Running baseline (DB Fetch + In-memory JS process)");
  const start = performance.now();

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

  const end = performance.now();
  const baselineTime = end - start;
  console.log(`Baseline time: ${baselineTime.toFixed(2)} ms for ${aiCalls.length} records`);

  console.log("Running WITH DB Group By (Raw Query)");
  const dbStart = performance.now();

  const rawResults = await prisma.$queryRaw<any[]>`
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

  const modelUsageDB: Record<string, { calls: number; tokens: number; cost: number }> = {};
  for (const row of rawResults) {
    modelUsageDB[row.model] = {
      calls: Number(row.calls),
      tokens: Number(row.tokens),
      cost: Number(row.cost),
    };
  }

  const dbEnd = performance.now();
  const dbTime = dbEnd - dbStart;
  console.log(`Time taken WITH DB Group By: ${dbTime.toFixed(2)} ms`);
  console.log(`Improvement: ${(baselineTime / dbTime).toFixed(2)}x faster`);
}

runBenchmark()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    process.exit(0);
  });
