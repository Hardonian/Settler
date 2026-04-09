#!/usr/bin/env node
/**
 * Apply RLS Migration - Final Version
 * Uses existing migration infrastructure
 */

const { execSync } = require("child_process");
const { readFileSync } = require("fs");
const { join } = require("path");

console.log("🔒 Applying RLS Enforcement Migration...\n");

// Check for database connection
const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error("❌ Missing database connection string");
  console.error("💡 Set DATABASE_URL, DIRECT_URL, or SUPABASE_DB_URL");
  process.exit(1);
}

const migrationPath = join(
  __dirname,
  "../supabase/migrations/20250122000000_rls_enforcement_critical.sql"
);

try {
  console.log("📄 Migration file:", migrationPath);

  // Try using psql if available
  try {
    console.log("🚀 Attempting via psql...\n");
    execSync(`psql "${dbUrl}" -f "${migrationPath}"`, {
      stdio: "inherit",
      env: { ...process.env },
    });
    console.log("\n✅ Migration applied successfully via psql!");
  } catch (psqlError) {
    console.log("⚠️  psql not available, trying alternative methods...\n");

    // Try Supabase CLI
    try {
      console.log("🚀 Attempting via Supabase CLI...\n");
      execSync(`supabase db push --include-all`, {
        stdio: "inherit",
        cwd: join(__dirname, ".."),
        env: { ...process.env },
      });
      console.log("\n✅ Migration applied successfully via Supabase CLI!");
    } catch (supabaseError) {
      console.log("⚠️  Supabase CLI not available\n");
      console.log("💡 Manual application required:");
      console.log(`   1. psql "${dbUrl}" -f "${migrationPath}"`);
      console.log(`   2. OR use Supabase Dashboard → SQL Editor`);
      console.log(`   3. OR run: supabase db push\n`);
      process.exit(1);
    }
  }
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}
