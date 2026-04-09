#!/usr/bin/env tsx
/**
 * Apply RLS Migration via Prisma
 *
 * Uses Prisma to execute raw SQL migration.
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function applyMigration() {
  console.log("🔒 Applying RLS Enforcement Migration via Prisma...\n");

  try {
    // Read migration file
    const migrationPath = join(
      process.cwd(),
      "supabase/migrations/20250122000000_rls_enforcement_critical.sql"
    );
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log("📄 Migration file:", migrationPath);
    console.log("📏 Size:", migrationSQL.length, "bytes\n");

    // Execute migration using Prisma's $executeRawUnsafe
    // Note: Prisma doesn't support multiple statements in one call, so we need to split
    console.log("🚀 Executing migration...\n");

    // Split by semicolon but preserve function definitions
    const statements = migrationSQL
      .split(/(?<!'[^']*);(?!'[^']*')/g) // Split by semicolon not inside quotes
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`📦 Found ${statements.length} SQL statements\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      if (!statement || statement.startsWith("--")) {
        continue;
      }

      // Add semicolon back
      const sql = statement.endsWith(";") ? statement : statement + ";";

      try {
        // Skip BEGIN/COMMIT as Prisma handles transactions
        if (sql.trim().toUpperCase() === "BEGIN;" || sql.trim().toUpperCase() === "COMMIT;") {
          continue;
        }

        console.log(`[${i + 1}/${statements.length}] Executing...`);

        await prisma.$executeRawUnsafe(sql);

        successCount++;
        console.log(`   ✅ Success`);
      } catch (error) {
        errorCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error: ${errorMsg.substring(0, 100)}`);

        // Some errors are expected (e.g., "already exists")
        if (errorMsg.includes("already exists") || errorMsg.includes("does not exist")) {
          console.log(`   ⚠️  (Non-critical: ${errorMsg.substring(0, 50)})`);
          successCount++; // Count as success for idempotent operations
          errorCount--;
        }
      }
    }

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("MIGRATION SUMMARY");
    console.log("═══════════════════════════════════════════════════════════\n");
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Total: ${statements.length}\n`);

    // Verify RLS is enabled
    console.log("🔍 Verifying RLS status...\n");

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
      try {
        const result = await prisma.$queryRawUnsafe<
          Array<{ tablename: string; rowsecurity: boolean }>
        >(
          `
          SELECT tablename, rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' AND tablename = $1
        `,
          table
        );

        if (result.length > 0) {
          const rlsEnabled = result[0].rowsecurity;
          console.log(
            `   ${rlsEnabled ? "✅" : "❌"} ${table}: RLS ${rlsEnabled ? "ENABLED" : "DISABLED"}`
          );
        } else {
          console.log(`   ⚠️  ${table}: Table not found`);
        }
      } catch (error) {
        console.log(
          `   ⚠️  ${table}: Could not verify (${error instanceof Error ? error.message : String(error)})`
        );
      }
    }

    if (errorCount === 0) {
      console.log("\n✅ Migration applied successfully!");
    } else {
      console.log("\n⚠️  Migration completed with some errors. Review output above.");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
