/**
 * Run Operator Mode Migration
 * Applies the operator mode migration to the database
 */

import { query } from '../packages/api/src/db';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logInfo, logError } from '../packages/api/src/utils/logger';

async function runMigration(): Promise<void> {
  logInfo('Starting operator mode migration');

  try {
    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20260131000001_operator_mode.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    logInfo('Migration file loaded', { path: migrationPath });

    // Split by semicolons and execute each statement
    // Remove comments and empty lines
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    logInfo('Executing migration statements', { count: statements.length });

    // Execute each statement
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
          errorMessage.includes('already exists') ||
          errorMessage.includes('duplicate') ||
          errorMessage.includes('already enabled')
        ) {
          logInfo(`Statement ${i + 1} skipped (already exists)`, { statement: statement.substring(0, 100) });
          continue;
        }
        throw error;
      }
    }

    // Verify migration
    logInfo('Verifying migration...');
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

    const expectedTables = [
      'alert_rules',
      'alert_history',
      'tenant_usage_ceilings',
      'background_job_limits',
      'kill_switches',
      'backup_records',
      'daily_intelligence',
    ];

    const foundTables = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !foundTables.includes(t));

    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }

    logInfo('Migration verification successful', {
      tablesFound: foundTables.length,
      tables: foundTables,
    });

    // Verify indexes
    logInfo('Verifying indexes...');
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

    logInfo('Indexes verified', { count: indexes.length });

    console.log('\n✅ Operator Mode Migration Completed Successfully!');
    console.log(`\nTables created: ${foundTables.length}`);
    foundTables.forEach(table => console.log(`  - ${table}`));
    console.log(`\nIndexes created: ${indexes.length}`);
    console.log('\n✅ Migration verification passed');
  } catch (error) {
    logError('Migration failed', error);
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n✅ Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

export { runMigration };
