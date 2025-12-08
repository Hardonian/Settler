/**
 * Database Migration Runner
 * 
 * Runs all database migrations in order:
 * 1. 001-initial-schema.sql - Core schema
 * 2. 002-strategic-initiatives.sql - Strategic features (graph, AI, etc.)
 * 3. 003-canonical-data-model.sql - Canonical data model
 * 
 * Supports both PostgreSQL (via pg) and Supabase
 */

import { Pool } from 'pg';
import { config } from '../config';
import { logInfo, logError, logWarn } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationResult {
  migration: string;
  success: boolean;
  error?: string;
  statementsExecuted: number;
}

/**
 * Execute SQL migration file
 */
async function executeMigration(
  migrationPath: string,
  migrationName: string,
  useSupabase: boolean
): Promise<MigrationResult> {
  const result: MigrationResult = {
    migration: migrationName,
    success: false,
    statementsExecuted: 0,
  };

  try {
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon, but preserve function bodies and other multi-statement constructs
    const statements = migrationSQL
      .split(/;(?![^$]*\$\$)/) // Split on semicolon, but not inside $$ blocks
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    logInfo(`Running migration: ${migrationName}`, { statements: statements.length });

    // Use PostgreSQL pool (works for both Supabase and regular PostgreSQL)
    // Supabase is PostgreSQL, so we can use pg directly
    // Priority: DATABASE_URL > Supabase connection string > config-based connection
    let connectionString = process.env.DATABASE_URL;
    
    if (!connectionString && useSupabase) {
      // Try to construct Supabase connection string
      // Supabase provides direct database connection via DATABASE_URL or we can construct it
      if (process.env.SUPABASE_DB_PASSWORD) {
        // Extract host from SUPABASE_URL (format: https://project-id.supabase.co)
        const supabaseUrl = process.env.SUPABASE_URL || '';
        const hostMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
        const host = hostMatch 
          ? `${hostMatch[1]}.supabase.co`
          : config.database.host;
        
        connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@${host}:${config.database.port || 5432}/postgres`;
      } else {
        // Fallback to config-based connection
        connectionString = `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`;
      }
    }
    
    if (!connectionString) {
      // Fallback to config-based connection
      connectionString = `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`;
    }
    
    const pool = new Pool({
      connectionString: connectionString,
      ssl: config.database.ssl || useSupabase ? {
        rejectUnauthorized: config.nodeEnv === 'production' || config.nodeEnv === 'preview',
      } : false,
    });

    for (const statement of statements) {
      if (statement.trim() && !statement.trim().startsWith('--')) {
        try {
          await pool.query(statement);
          result.statementsExecuted++;
        } catch (error: any) {
          // Ignore "already exists" errors (idempotent migration)
          if (error.message.includes('already exists') ||
              error.message.includes('duplicate') ||
              error.message.includes('already enabled') ||
              error.message.includes('does not exist') && error.message.includes('DROP')) {
            logWarn(`Migration warning (ignored): ${error.message}`);
            continue;
          }
          throw error;
        }
      }
    }

    await pool.end();

    result.success = true;
    logInfo(`Migration completed: ${migrationName}`, { statements: result.statementsExecuted });
  } catch (error: any) {
    result.error = error.message;
    logError(`Migration failed: ${migrationName}`, error);
    throw error;
  }

  return result;
}

/**
 * Initialize Supabase extensions
 */
async function initializeSupabaseExtensions(): Promise<void> {
  try {
    logInfo('Initializing Supabase extensions...');

    // Try to use Supabase RPC if available
    const extensions = [
      { name: 'uuid-ossp', sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' },
      { name: 'pgcrypto', sql: 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";' },
      { name: 'vector', sql: 'CREATE EXTENSION IF NOT EXISTS vector;' },
    ];

    // Use direct PostgreSQL connection for extensions
    // Use same connection string logic as migrations
    let connectionString = process.env.DATABASE_URL;
    const useSupabase = !!process.env.SUPABASE_URL;
    
    if (!connectionString && useSupabase) {
      if (process.env.SUPABASE_DB_PASSWORD) {
        const supabaseUrl = process.env.SUPABASE_URL || '';
        const hostMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
        const host = hostMatch 
          ? `${hostMatch[1]}.supabase.co`
          : config.database.host;
        
        connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@${host}:${config.database.port || 5432}/postgres`;
      } else {
        connectionString = `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`;
      }
    }
    
    if (!connectionString) {
      connectionString = `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`;
    }
    
    const pool = new Pool({
      connectionString: connectionString,
      ssl: config.database.ssl || useSupabase ? {
        rejectUnauthorized: config.nodeEnv === 'production' || config.nodeEnv === 'preview',
      } : false,
    });

    for (const ext of extensions) {
      try {
        await pool.query(ext.sql);
        logInfo(`Extension enabled: ${ext.name}`);
      } catch (error: any) {
        if (error.message.includes('already exists') || 
            error.message.includes('permission denied')) {
          logWarn(`Extension ${ext.name}: ${error.message}`);
        } else {
          logError(`Failed to enable extension ${ext.name}`, error);
        }
      }
    }

    await pool.end();
  } catch (error: any) {
    logWarn('Supabase extension initialization warning', error);
    // Don't fail if extensions can't be initialized
  }
}

/**
 * Run all migrations in order
 */
export async function runMigrations(): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];
  const useSupabase = !!process.env.SUPABASE_URL;

  logInfo('Starting database migrations...', { useSupabase });

  // Initialize Supabase extensions if using Supabase
  if (useSupabase) {
    await initializeSupabaseExtensions();
  }

  // Migration files in order
  const migrations = [
    '001-initial-schema.sql',
    '002-strategic-initiatives.sql',
    '003-canonical-data-model.sql',
  ];

  const migrationsDir = path.join(__dirname, 'migrations');

  for (const migrationFile of migrations) {
    const migrationPath = path.join(migrationsDir, migrationFile);
    
    try {
      const result = await executeMigration(migrationPath, migrationFile, useSupabase);
      results.push(result);
      
      if (!result.success) {
        logError(`Migration ${migrationFile} failed, stopping migration process`);
        break;
      }
    } catch (error: any) {
      results.push({
        migration: migrationFile,
        success: false,
        error: error.message,
        statementsExecuted: 0,
      });
      logError(`Migration ${migrationFile} failed`, error);
      throw error;
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  logInfo('Migration process completed', {
    total: results.length,
    successful: successCount,
    failed: failCount,
  });

  return results;
}

/**
 * CLI entry point
 */
if (require.main === module) {
  runMigrations()
    .then((results) => {
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        console.error('Some migrations failed:');
        failed.forEach(r => console.error(`  - ${r.migration}: ${r.error}`));
        process.exit(1);
      } else {
        console.log('All migrations completed successfully');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}
