#!/usr/bin/env tsx
/**
 * Apply RLS Migration via Direct Database Connection
 *
 * Uses pg library to connect directly to PostgreSQL and apply migration.
 */

import pg from "pg";
import { readFileSync } from "fs";
import { join } from "path";

const { Client } = pg;

// Get database connection from environment
const DATABASE_URL =
  process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error("❌ Missing DATABASE_URL, DIRECT_URL, or SUPABASE_DB_URL");
  console.error("💡 Set one of these environment variables with your database connection string");
  process.exit(1);
}

async function applyMigration() {
  console.log("🔒 Applying RLS Enforcement Migration via Direct Connection...\n");

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes("supabase") ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // Read migration file
    const migrationPath = join(
      process.cwd(),
      "supabase/migrations/20250122000000_rls_enforcement_critical.sql"
    );
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log("📄 Migration file:", migrationPath);
    console.log("📏 Size:", migrationSQL.length, "bytes\n");

    // Execute migration (Supabase/PostgreSQL handles transaction automatically)
    console.log("🚀 Executing migration...\n");

    const result = await client.query(migrationSQL);

    console.log("✅ Migration executed successfully!\n");
    console.log("📊 Result:", result.command || "Migration completed");

    // Verify RLS is enabled on critical tables
    console.log("\n🔍 Verifying RLS status on critical tables...\n");

    const criticalTables = [
      "billing_accounts",
      "subscriptions",
      "usage_events",
      "recon_jobs",
      "recon_results",
      "normalized_transactions",
      "reconciliation_runs",
    ];

    for (const table of criticalTables) {
      const { rows } = await client.query(
        `
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = $1
      `,
        [table]
      );

      if (rows.length > 0) {
        const rlsEnabled = rows[0].rowsecurity;
        console.log(
          `   ${rlsEnabled ? "✅" : "❌"} ${table}: RLS ${rlsEnabled ? "ENABLED" : "DISABLED"}`
        );
      } else {
        console.log(`   ⚠️  ${table}: Table not found`);
      }
    }

    console.log("\n✅ Migration verification complete!");
  } catch (error) {
    console.error("❌ Migration failed:", error);

    if (error instanceof Error) {
      console.error("   Message:", error.message);
      if (error.stack) {
        console.error("   Stack:", error.stack.split("\n").slice(0, 5).join("\n"));
      }
    }

    process.exit(1);
  } finally {
    await client.end();
    console.log("\n🔌 Database connection closed");
  }
}

applyMigration().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
