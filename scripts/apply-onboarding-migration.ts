/**
 * Apply Onboarding Migration
 *
 * Applies the workspace onboarding and activation migration to the database.
 *
 * Usage:
 *   tsx scripts/apply-onboarding-migration.ts [environment]
 *
 * Environment variables required:
 *   - DATABASE_URL (preferred) OR
 *   - SUPABASE_URL + SUPABASE_DB_PASSWORD
 */

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Get database connection string
 */
function getConnectionString(): string {
  // Priority 1: DATABASE_URL (direct PostgreSQL connection string)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Priority 2: Supabase connection (remote)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_DB_PASSWORD) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const password = process.env.SUPABASE_DB_PASSWORD;

    // Extract project ref from URL (format: https://project-ref.supabase.co)
    const hostMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (hostMatch) {
      const projectRef = hostMatch[1];
      // Use direct connection (port 5432) for migrations
      return `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
    }
  }

  // Priority 3: Individual components
  if (
    process.env.DB_HOST &&
    process.env.DB_NAME &&
    process.env.DB_USER &&
    process.env.DB_PASSWORD
  ) {
    const port = process.env.DB_PORT || "5432";
    return `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${port}/${process.env.DB_NAME}`;
  }

  throw new Error(
    "Database connection string not found. Set DATABASE_URL or SUPABASE_URL + SUPABASE_DB_PASSWORD"
  );
}

/**
 * Apply migration
 */
async function applyMigration() {
  const connectionString = getConnectionString();
  const pool = new Pool({ connectionString });

  console.log("🔍 Applying Onboarding Migration...");
  console.log("");

  const migrationPath = path.join(
    process.cwd(),
    "supabase/migrations/20260131000000_workspace_onboarding_activation.sql"
  );

  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`);
  }

  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

  try {
    console.log("📦 Executing migration...");
    await pool.query(migrationSQL);
    console.log("✅ Migration applied successfully!");
    console.log("");

    // Verify tables were created
    console.log("🔍 Verifying tables...");
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'workspace_invites',
          'tenant_onboarding_progress', 
          'onboarding_events'
        )
      ORDER BY table_name;
    `);

    const createdTables = tablesResult.rows.map((r: any) => r.table_name);
    const expectedTables = ["workspace_invites", "tenant_onboarding_progress", "onboarding_events"];

    console.log("Created tables:");
    createdTables.forEach((table: string) => {
      console.log(`  ✅ ${table}`);
    });

    const missingTables = expectedTables.filter((t) => !createdTables.includes(t));
    if (missingTables.length > 0) {
      console.log("\n⚠️  Missing tables:");
      missingTables.forEach((table) => {
        console.log(`  ❌ ${table}`);
      });
    }

    // Verify functions
    console.log("\n🔍 Verifying functions...");
    const functionsResult = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name IN (
          'create_workspace_with_owner',
          'complete_onboarding_step',
          'track_onboarding_event'
        )
      ORDER BY routine_name;
    `);

    const createdFunctions = functionsResult.rows.map((r: any) => r.routine_name);
    const expectedFunctions = [
      "create_workspace_with_owner",
      "complete_onboarding_step",
      "track_onboarding_event",
    ];

    console.log("Created functions:");
    createdFunctions.forEach((func: string) => {
      console.log(`  ✅ ${func}`);
    });

    const missingFunctions = expectedFunctions.filter((f) => !createdFunctions.includes(f));
    if (missingFunctions.length > 0) {
      console.log("\n⚠️  Missing functions:");
      missingFunctions.forEach((func) => {
        console.log(`  ❌ ${func}`);
      });
    }

    // Verify RLS policies
    console.log("\n🔍 Verifying RLS policies...");
    const policiesResult = await pool.query(`
      SELECT tablename, policyname 
      FROM pg_policies 
      WHERE tablename IN (
        'workspace_invites',
        'tenant_onboarding_progress',
        'onboarding_events'
      )
      ORDER BY tablename, policyname;
    `);

    if (policiesResult.rows.length > 0) {
      console.log("RLS policies:");
      policiesResult.rows.forEach((row: any) => {
        console.log(`  ✅ ${row.tablename}.${row.policyname}`);
      });
    } else {
      console.log("  ⚠️  No RLS policies found");
    }

    console.log("");
    console.log("🎉 Migration verification complete!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
applyMigration()
  .then(() => {
    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  });
