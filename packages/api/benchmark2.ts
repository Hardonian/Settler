import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runBenchmark() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Seed data directly using pg
  const res = await pool.query(
    `SELECT COUNT(*) FROM "UsageEvent" WHERE "eventType" = 'ai_request'`
  );
  if (parseInt(res.rows[0].count) === 0) {
    console.log("Seeding data...");

    let accountRes = await pool.query(`SELECT id FROM "BillingAccount" LIMIT 1`);
    if (accountRes.rows.length === 0) {
      await pool.query(`
            INSERT INTO "BillingAccount" (id, "stripeCustomerId", plan, status, "createdAt", "updatedAt")
            VALUES ('00000000-0000-0000-0000-000000000000', 'cus_123', 'free', 'active', NOW(), NOW())
          `);
    }

    const models = ["gpt-4", "gpt-3.5", "claude", "unknown"];
    let values = [];
    for (let i = 0; i < 10000; i++) {
      const metadata = JSON.stringify({
        model: models[i % models.length],
        cost: Math.random() * 0.5,
        tokens: Math.floor(Math.random() * 1000),
      });
      values.push(`(
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'ai_request',
            NOW() - (random() * interval '20 days'),
            1,
            '${metadata}'::jsonb
        )`);

      if (values.length === 1000) {
        await pool.query(`
                INSERT INTO "UsageEvent" (id, "billingAccountId", "eventType", "timestamp", quantity, metadata)
                VALUES ${values.join(",")}
            `);
        values = [];
      }
    }
  }

  console.log("Running baseline (DB Fetch + In-memory JS process)");
  const start = performance.now();

  const aiCalls = await pool.query(
    `
    SELECT metadata FROM "UsageEvent"
    WHERE "eventType" = 'ai_request' AND "timestamp" >= $1
  `,
    [thirtyDaysAgo.toISOString()]
  );

  const modelUsage: Record<string, { calls: number; tokens: number; cost: number }> = {};
  for (const call of aiCalls.rows) {
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
  console.log(`Baseline time: ${baselineTime.toFixed(2)} ms for ${aiCalls.rows.length} records`);

  console.log("Running WITH DB Group By (Raw Query)");
  const dbStart = performance.now();

  const rawResults = await pool.query(
    `
    SELECT
      COALESCE(metadata->>'model', 'unknown') as model,
      COUNT(*)::int as calls,
      SUM(COALESCE((metadata->>'tokens')::numeric, 0))::int as tokens,
      SUM(COALESCE((metadata->>'cost')::numeric, 0))::float as cost
    FROM "UsageEvent"
    WHERE "eventType" = 'ai_request'
      AND "timestamp" >= $1
    GROUP BY COALESCE(metadata->>'model', 'unknown')
  `,
    [thirtyDaysAgo.toISOString()]
  );

  const modelUsageDB: Record<string, { calls: number; tokens: number; cost: number }> = {};
  for (const row of rawResults.rows) {
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
    pool.end();
    process.exit(0);
  });
