import { query } from "@settler/api";
import { readFileSync } from "fs";
import { join } from "path";
import { logInfo, logError } from "@settler/logger";

const EXPECTED_TABLES = [
  "alert_rules",
  "alert_history",
  "tenant_usage_ceilings",
  "background_job_limits",
  "kill_switches",
  "backup_records",
  "daily_intelligence",
];

function loadMigrationStatements(migrationPath: string): string[] {
  const migrationSQL = readFileSync(migrationPath, "utf-8");
  logInfo("Migration file loaded", { path: migrationPath });

  return migrationSQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("/*"));
}

async function executeStatements(statements: string[]): Promise<void> {
  logInfo("Executing migration statements", { count: statements.length });

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement || statement.length === 0) continue;

    try {
      logInfo(`Executing statement ${i + 1}/${statements.length}`);
      await query(statement);
      logInfo(`Statement ${i + 1} executed successfully`);
    } catch (error: any) {
      // Ignore "already exists" errors (idempotent)
      const errorMessage = error?.message || String(error);
      if (
        errorMessage.includes("already exists") ||
        errorMessage.includes("duplicate") ||
        errorMessage.includes("already enabled")
      ) {
        logInfo(`Statement ${i + 1} skipped (already exists)`, {
          statement: statement.substring(0, 100),
        });
        continue;
      }
      throw error;
    }
  }
}

async function verifyTables(): Promise<string[]> {
  logInfo("Verifying migration...");
  const tables = await query<{ table_name: string }>(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN (
         'alert_rules',
         'alert_history',
         'tenant_usage_ceilings',
         'background_job_limits',
         'kill_switches',
         'backup_records',
         'daily_intelligence'
       )
     ORDER BY table_name`
  );

  const foundTables = tables.map((t) => t.table_name);
  const missingTables = EXPECTED_TABLES.filter((t) => !foundTables.includes(t));

  if (missingTables.length > 0) {
    throw new Error(`Missing tables: ${missingTables.join(", ")}`);
  }

  logInfo("Migration verification successful", {
    tablesFound: foundTables.length,
    tables: foundTables,
  });

  return foundTables;
}

async function verifyIndexes(): Promise<{ indexname: string; tablename: string }[]> {
  logInfo("Verifying indexes...");
  const indexes = await query<{ indexname: string; tablename: string }>(
    `SELECT indexname, tablename
     FROM pg_indexes
     WHERE schemaname = 'public'
       AND tablename IN (
         'alert_rules',
         'alert_history',
         'tenant_usage_ceilings',
         'background_job_limits',
         'kill_switches',
         'backup_records',
         'daily_intelligence'
       )
     ORDER BY tablename, indexname`
  );

  logInfo("Indexes verified", { count: indexes.length });
  return indexes;
}

async function runMigration(): Promise<void> {
  logInfo("Starting operator mode migration");

  try {
    const migrationPath = join(
      __dirname,
      "../supabase/migrations/20260131000001_operator_mode.sql"
    );

    const statements = loadMigrationStatements(migrationPath);
    await executeStatements(statements);

    const foundTables = await verifyTables();
    const indexes = await verifyIndexes();

    console.info("\n✅ Operator Mode Migration Completed Successfully!");
    console.info(`\nTables created: ${foundTables.length}`);
    foundTables.forEach((table) => console.info(`  - ${table}`));
    console.info(`\nIndexes created: ${indexes.length}`);
    console.info("\n✅ Migration verification passed");
  } catch (error) {
    logError("Migration failed", error);
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.info("\n✅ Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration failed:", error);
      process.exit(1);
    });
}

export { runMigration };
