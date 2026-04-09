#!/usr/bin/env tsx
/**
 * Apply All Migrations to Supabase Backend
 *
 * This script applies all migrations in order and verifies they were successful.
 */

import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get database URL from environment or .env.connection
function getDatabaseUrl(): string {
  // Try environment variable first
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Try .env.connection file
  const envConnectionPath = path.join(process.cwd(), ".env.connection");
  if (fs.existsSync(envConnectionPath)) {
    const content = fs.readFileSync(envConnectionPath, "utf-8");
    const match = content.match(/DATABASE_URL=(.+)/);
    if (match && match[1]) {
      let url = match[1].trim();
      // Remove brackets from password if present
      url = url.replace(/\[([^\]]+)\]/g, "$1");
      return url;
    }
  }

  throw new Error("DATABASE_URL not found. Set it in environment or .env.connection file");
}

interface MigrationFile {
  name: string;
  path: string;
  timestamp: number;
}

async function getMigrationFiles(): Promise<MigrationFile[]> {
  const migrationsDir = path.join(process.cwd(), "supabase/migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql") && !f.startsWith("_") && f !== "rollback_template.sql")
    .map((f) => ({
      name: f,
      path: path.join(migrationsDir, f),
      timestamp: getTimestampFromFilename(f),
    }))
    .sort((a, b) => {
      // Sort by timestamp, then by name for same timestamp
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      return a.name.localeCompare(b.name);
    });

  return files;
}

function getTimestampFromFilename(filename: string): number {
  // Extract timestamp from filename patterns:
  // - 00000000_settler_golden_schema.sql -> 0
  // - 20250121000000_security_billing_enforcement.sql -> 20250121000000
  const match = filename.match(/^(\d+)_/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
}

async function getAppliedMigrations(client: Client): Promise<Set<string>> {
  try {
    // Check if migrations table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      // Create migrations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.schema_migrations (
          version VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      return new Set();
    }

    const result = await client.query(
      "SELECT version FROM public.schema_migrations ORDER BY version"
    );
    return new Set(result.rows.map((r) => r.version));
  } catch (error) {
    console.error("Error checking applied migrations:", error);
    return new Set();
  }
}

async function markMigrationApplied(client: Client, version: string): Promise<void> {
  await client.query(
    "INSERT INTO public.schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING",
    [version]
  );
}

async function applyMigration(client: Client, migration: MigrationFile): Promise<boolean> {
  const content = fs.readFileSync(migration.path, "utf-8");

  console.log(`\n📄 Applying: ${migration.name}`);
  console.log("─".repeat(60));

  try {
    // Execute migration in a transaction
    await client.query("BEGIN");

    // Execute the migration SQL
    await client.query(content);

    // Mark as applied
    await markMigrationApplied(client, migration.name);

    await client.query("COMMIT");

    console.log(`✅ Successfully applied: ${migration.name}`);
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`❌ Failed to apply ${migration.name}:`, error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      if (error.message.includes("already exists")) {
        console.log("⚠️  Migration may have already been applied. Marking as applied...");
        try {
          await markMigrationApplied(client, migration.name);
          return true;
        } catch (markError) {
          console.error("Failed to mark migration:", markError);
        }
      }
    }

    return false;
  }
}

async function verifyDatabaseState(client: Client): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 Verifying Database State");
  console.log("=".repeat(60));

  // Check critical tables
  const criticalTables = [
    "billing_accounts",
    "subscriptions",
    "add_ons",
    "add_on_purchases",
    "recon_jobs",
    "receipt_uploads",
    "receipts",
    "feature_flags",
    "usage_events",
    "tenants",
  ];

  console.log("\n📊 Tables:");
  for (const table of criticalTables) {
    const result = await client.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `,
      [table]
    );

    const exists = result.rows[0].exists;
    console.log(`  ${exists ? "✅" : "❌"} ${table}`);
  }

  // Check critical functions
  const criticalFunctions = [
    "has_active_subscription",
    "has_plan_or_higher",
    "has_add_on_purchase",
    "get_user_billing_account_id",
    "get_user_org_ids",
  ];

  console.log("\n⚙️  Functions:");
  for (const func of criticalFunctions) {
    const result = await client.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = $1
      );
    `,
      [func]
    );

    const exists = result.rows[0].exists;
    console.log(`  ${exists ? "✅" : "❌"} ${func}()`);
  }

  // Check RLS policies
  console.log("\n🔒 RLS Policies:");
  const rlsResult = await client.query(`
    SELECT t.tablename, COUNT(p.policyname) as policy_count
    FROM pg_tables t
    LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
    WHERE t.schemaname = 'public'
    AND t.tablename IN ('recon_jobs', 'receipt_uploads', 'feature_flags', 'usage_events')
    GROUP BY t.tablename
    ORDER BY t.tablename;
  `);

  for (const row of rlsResult.rows) {
    const count = parseInt(row.policy_count, 10);
    console.log(`  ${count > 0 ? "✅" : "❌"} ${row.tablename}: ${count} policies`);
  }

  // Check triggers
  console.log("\n🎯 Triggers:");
  const triggerResult = await client.query(`
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    AND trigger_name LIKE 'enforce_subscription%'
    ORDER BY trigger_name;
  `);

  if (triggerResult.rows.length > 0) {
    for (const row of triggerResult.rows) {
      console.log(`  ✅ ${row.trigger_name} on ${row.event_object_table}`);
    }
  } else {
    console.log("  ⚠️  No subscription enforcement triggers found");
  }
}

async function main() {
  console.log("🚀 Starting Migration Application Process");
  console.log("=".repeat(60));

  const databaseUrl = getDatabaseUrl();
  console.log(`\n📡 Connecting to database...`);
  console.log(`   URL: ${databaseUrl.replace(/:[^:@]+@/, ":****@")}`);

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // Get migration files
    const migrations = await getMigrationFiles();
    console.log(`📋 Found ${migrations.length} migration files\n`);

    // Get applied migrations
    const applied = await getAppliedMigrations(client);
    console.log(`📝 Found ${applied.size} already applied migrations\n`);

    // Filter out already applied migrations
    const pending = migrations.filter((m) => !applied.has(m.name));

    if (pending.length === 0) {
      console.log("✅ All migrations are already applied!\n");
    } else {
      console.log(`🔄 Applying ${pending.length} pending migrations...\n`);

      let successCount = 0;
      let failCount = 0;

      for (const migration of pending) {
        const success = await applyMigration(client, migration);
        if (success) {
          successCount++;
        } else {
          failCount++;
          // Continue with other migrations even if one fails
        }
      }

      console.log("\n" + "=".repeat(60));
      console.log("📊 Migration Summary");
      console.log("=".repeat(60));
      console.log(`✅ Successful: ${successCount}`);
      console.log(`❌ Failed: ${failCount}`);
      console.log(`📋 Total: ${pending.length}`);
    }

    // Verify database state
    await verifyDatabaseState(client);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Migration process completed!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
