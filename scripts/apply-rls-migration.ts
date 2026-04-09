#!/usr/bin/env tsx
/**
 * Apply RLS Migration to Production Database
 *
 * Uses Supabase connection pooling to apply the RLS enforcement migration.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   SUPABASE_URL:", SUPABASE_URL ? "✅" : "❌");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? "✅" : "❌");
  process.exit(1);
}

async function applyMigration() {
  console.log("🔒 Applying RLS Enforcement Migration...\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Read migration file
  const migrationPath = join(
    process.cwd(),
    "supabase/migrations/20250122000000_rls_enforcement_critical.sql"
  );
  const migrationSQL = readFileSync(migrationPath, "utf-8");

  console.log("📄 Migration file loaded:", migrationPath);
  console.log("📏 Migration size:", migrationSQL.length, "bytes\n");

  // Split migration into statements (split by semicolon, but preserve function definitions)
  const statements = migrationSQL
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`📦 Found ${statements.length} SQL statements\n`);

  let successCount = 0;
  let errorCount = 0;

  // Apply each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip empty statements and comments
    if (!statement || statement.startsWith("--")) {
      continue;
    }

    // Add semicolon back if not present
    const sql = statement.endsWith(";") ? statement : statement + ";";

    try {
      console.log(`[${i + 1}/${statements.length}] Executing statement...`);

      // Use RPC to execute SQL (Supabase doesn't have direct SQL execution, so we'll use a workaround)
      // For production, we should use psql or Supabase CLI, but for now we'll try via RPC
      const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql }).catch(async () => {
        // If exec_sql doesn't exist, try direct query (this won't work for DDL, but let's try)
        return { data: null, error: { message: "exec_sql RPC not available" } };
      });

      if (error) {
        // Try alternative: Use Supabase REST API with service role
        // For DDL statements, we need direct database access
        console.log(`   ⚠️  RPC method failed, trying direct connection...`);

        // Note: Supabase JS client doesn't support DDL directly
        // We need to use psql or Supabase CLI for migrations
        console.log(`   ⚠️  DDL statements require direct database access`);
        console.log(`   💡 Use: psql $DATABASE_URL -f ${migrationPath}`);
        console.log(`   💡 OR: supabase db push`);

        errorCount++;
        continue;
      }

      successCount++;
      console.log(`   ✅ Success`);
    } catch (error) {
      errorCount++;
      console.error(`   ❌ Error:`, error instanceof Error ? error.message : String(error));
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("MIGRATION SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${statements.length}\n`);

  if (errorCount > 0) {
    console.log("⚠️  Some statements failed. DDL statements require direct database access.");
    console.log("💡 Recommended: Use psql or Supabase CLI to apply migration:\n");
    console.log(`   psql $DATABASE_URL -f ${migrationPath}`);
    console.log(`   OR`);
    console.log(`   supabase db push\n`);
    process.exit(1);
  }

  console.log("✅ Migration applied successfully!");
}

applyMigration().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
