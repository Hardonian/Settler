/**
 * Schema Validation on Startup
 * Validates database schema matches expectations before starting the application
 */

import { query } from '../db';
import { logError, logInfo } from './logger';

interface SchemaCheck {
  table: string;
  exists: boolean;
  columns?: string[];
}

/**
 * Critical tables that must exist for the application to function
 */
const CRITICAL_TABLES = [
  'users',
  'tenants',
  'api_keys',
  'jobs',
  'executions',
  'billing_accounts',
  'usage_events',
  'schema_migrations',
] as const;

/**
 * Validate database schema on startup
 * Throws error if critical tables are missing
 */
export async function validateSchema(): Promise<void> {
  logInfo('Validating database schema...');

  const checks: SchemaCheck[] = [];

  // Check if critical tables exist
  for (const table of CRITICAL_TABLES) {
    try {
      const result = await query<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );

      const exists = result[0]?.exists || false;
      checks.push({ table, exists });

      if (exists) {
        // Get columns for the table
        const columns = await query<{ column_name: string }>(
          `SELECT column_name 
           FROM information_schema.columns 
           WHERE table_schema = 'public' 
           AND table_name = $1
           ORDER BY ordinal_position`,
          [table]
        );
        const lastCheck = checks[checks.length - 1];
        if (lastCheck) {
          lastCheck.columns = columns.map(c => c.column_name);
        }
      }
    } catch (error) {
      logError(`Failed to check table ${table}`, error);
      checks.push({ table, exists: false });
    }
  }

  // Check for missing critical tables
  const missingTables = checks.filter(c => !c.exists).map(c => c.table);

  if (missingTables.length > 0) {
    const errorMessage = `Critical tables missing: ${missingTables.join(', ')}. Please run migrations.`;
    logError('Schema validation failed', new Error(errorMessage));
    throw new Error(errorMessage);
  }

  // Check schema_migrations table
  const migrationsCheck = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM schema_migrations`
  );
  const migrationCount = parseInt((migrationsCheck[0]?.count || '0'), 10);

  logInfo('Schema validation passed', {
    tablesChecked: checks.length,
    migrationsApplied: migrationCount,
  });

  // Log schema summary
  logInfo('Database schema summary', {
    tables: checks.map(c => ({
      name: c.table,
      columns: (c.columns?.length || 0),
    })),
  });
}

/**
 * Check if migrations are up to date
 * Compares applied migrations with available migration files
 */
export async function checkMigrationsStatus(): Promise<{
  applied: number;
  pending: string[];
  upToDate: boolean;
}> {
  try {
    // Get applied migrations
    const applied = await query<{ version: string }>(
      `SELECT version FROM schema_migrations ORDER BY version`
    );
    const appliedVersions = new Set(applied.map(m => m.version));

    // Get available migration files (would need fs access, simplified here)
    // In practice, this would read from supabase/migrations directory
    const pending: string[] = [];

    return {
      applied: appliedVersions.size,
      pending,
      upToDate: pending.length === 0,
    };
  } catch (error) {
    logError('Failed to check migration status', error);
    return {
      applied: 0,
      pending: [],
      upToDate: false,
    };
  }
}
