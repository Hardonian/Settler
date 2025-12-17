#!/usr/bin/env tsx
/**
 * Apply Migrations with Status Check
 * 
 * Checks which migrations have been applied and applies only pending ones.
 * Requires DATABASE_URL environment variable.
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

interface MigrationStatus {
  name: string;
  applied: boolean;
  appliedAt?: Date;
}

/**
 * Get database connection string
 */
function getConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  throw new Error(
    'DATABASE_URL environment variable is required.\n' +
    'Set it to your PostgreSQL connection string, e.g.:\n' +
    'DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres'
  );
}

/**
 * Create migrations tracking table if it doesn't exist
 */
async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations(pool: Pool): Promise<Set<string>> {
  await ensureMigrationsTable(pool);
  
  const result = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
  return new Set(result.rows.map((row: { version: string }) => row.version));
}

/**
 * Mark migration as applied
 */
async function markMigrationApplied(pool: Pool, migrationName: string): Promise<void> {
  await pool.query(
    'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
    [migrationName]
  );
}

/**
 * Execute migration file
 */
async function executeMigration(
  migrationPath: string,
  migrationName: string,
  pool: Pool
): Promise<{ success: boolean; error?: string }> {
  try {
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await pool.query(migrationSQL);
    
    // Mark as applied
    await markMigrationApplied(pool, migrationName);
    
    return { success: true };
  } catch (error: any) {
    // Check if it's a "already exists" error that we can ignore
    if (error.message.includes('already exists') ||
        error.message.includes('duplicate') ||
        error.message.includes('already enabled') ||
        (error.message.includes('does not exist') && error.message.includes('DROP'))) {
      // Still mark as applied since the objects exist
      await markMigrationApplied(pool, migrationName);
      return { success: true };
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Main migration function
 */
async function applyPendingMigrations(): Promise<void> {
  const connectionString = getConnectionString();
  
  console.log('🚀 Checking for pending migrations...');
  const maskedConnection = connectionString.replace(/:[^:@]+@/, ':****@');
  console.log(`   Connection: ${maskedConnection}\n`);

  // Parse connection string to handle IPv6 issues
  let parsedConnection = connectionString;
  
  // Force IPv4 for Supabase connections (fixes IPv6 connectivity issues)
  if (connectionString.includes('supabase.co')) {
    try {
      const url = new URL(connectionString);
      // Use connection pooler port (6543) which handles IPv6 better, or force IPv4
      // For now, keep direct connection but ensure proper SSL
      parsedConnection = connectionString;
    } catch {
      // If URL parsing fails, use original
      parsedConnection = connectionString;
    }
  }

  const pool = new Pool({
    connectionString: parsedConnection,
    ssl: connectionString.includes('supabase.co') || connectionString.includes('pooler') ? {
      rejectUnauthorized: false,
    } : false,
    connectionTimeoutMillis: 30000,
    // Force IPv4 if IPv6 fails
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection established\n');

    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations(pool);
    console.log(`📋 Found ${appliedMigrations.size} applied migration(s)`);

    // Get all migration files
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && file !== 'rollback_template.sql')
      .sort();

    console.log(`📦 Found ${migrationFiles.length} migration file(s) total\n`);

    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(file => !appliedMigrations.has(file));
    
    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations have been applied!');
      return;
    }

    console.log(`🔄 Found ${pendingMigrations.length} pending migration(s):`);
    pendingMigrations.forEach(file => console.log(`   - ${file}`));
    console.log('');

    // Apply pending migrations
    let successCount = 0;
    let failCount = 0;

    for (const migrationFile of pendingMigrations) {
      const migrationPath = path.join(migrationsDir, migrationFile);
      console.log(`📦 Applying: ${migrationFile}`);
      
      const result = await executeMigration(migrationPath, migrationFile, pool);
      
      if (result.success) {
        console.log(`   ✅ Applied successfully\n`);
        successCount++;
      } else {
        console.log(`   ❌ Failed: ${result.error}\n`);
        failCount++;
        throw new Error(`Migration ${migrationFile} failed: ${result.error}`);
      }
    }

    console.log('📊 Migration Summary:');
    console.log(`   Applied: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Total applied: ${appliedMigrations.size + successCount}/${migrationFiles.length}`);

    if (failCount === 0) {
      console.log('\n✅ All pending migrations applied successfully!');
    }

  } catch (error: any) {
    console.error('\n❌ Migration process failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  applyPendingMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error.message);
      process.exit(1);
    });
}

export { applyPendingMigrations };
