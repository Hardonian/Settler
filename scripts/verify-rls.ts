import { Client } from "pg";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    console.log("🔍 Checking RLS status for all public tables...");

    // Query pg_class for RLS enablement and pg_policies for actual policy counts
    const result = await client.query(`
      SELECT
        c.relname as table_name,
        c.relrowsecurity as rls_enabled,
        COALESCE(p.policy_count, 0) as policy_count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN (
        SELECT tablename, COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename
      ) p ON p.tablename = c.relname
      WHERE n.nspname = 'public'
        AND c.relkind = 'r' -- Only base tables
        AND c.relname NOT IN ('schema_migrations') -- Exclude internal tooling tables
      ORDER BY c.relname;
    `);

    let hasErrors = false;

    for (const row of result.rows) {
      if (!row.rls_enabled) {
        console.error(`❌ ERROR: Table '${row.table_name}' does NOT have RLS enabled!`);
        hasErrors = true;
      } else if (Number(row.policy_count) === 0) {
        console.warn(
          `⚠️ WARNING: Table '${row.table_name}' has RLS enabled but NO policies defined. Default deny is active.`
        );
      } else {
        console.log(
          `✅ Table '${row.table_name}' is secured (RLS Enabled, ${row.policy_count} policies)`
        );
      }
    }

    if (hasErrors) {
      console.error("\n🚨 RLS verification failed. All tables must have RLS enabled.");
      process.exit(1);
    }

    console.log("\n🎉 RLS verification passed! All public tables are secured.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Fatal error during RLS verification:", err);
  process.exit(1);
});
