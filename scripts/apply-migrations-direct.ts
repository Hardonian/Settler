#!/usr/bin/env tsx
/**
 * Direct Migration Application Script
 * 
 * Applies migrations directly without checking schema_migrations table.
 * Useful for initial setup or when schema_migrations table doesn't exist yet.
 * 
 * Usage: tsx scripts/apply-migrations-direct.ts
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

interface MigrationResult {
  migration: string;
  success: boolean;
  error?: string;
  statementsExecuted: number;
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
    'Set it to your PostgreSQL connection string.'
  );
}

/**
 * Execute migration file
 */
async function executeMigration(
  migrationPath: string,
  migrationName: string,
  pool: Pool
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
    
    // Execute the entire migration as a single transaction
    try {
      await pool.query(migrationSQL);
      result.statementsExecuted = 1;
      result.success = true;
      console.log(`✓ Migration completed: ${migrationName}`);
    } catch (error: any) {
      // Check if it's a "already exists" error that we can ignore
      if (error.message.includes('already exists') ||
          error.message.includes('duplicate') ||
          error.message.includes('already enabled') ||
          (error.message.includes('does not exist') && error.message.includes('DROP'))) {
        console.log(`⚠ Migration warning (ignored): ${migrationName} - ${error.message}`);
        result.success = true;
        result.statementsExecuted = 0;
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    result.error = error.message;
    console.error(`✗ Migration failed: ${migrationName}`);
    console.error(`  Error: ${error.message}`);
    throw error;
  }

  return result;
}

/**
 * Main migration function
 */
async function applyAllMigrations(): Promise<void> {
  const connectionString = getConnectionString();
  
  console.log('🚀 Applying all migrations...');
  const maskedConnection = connectionString.replace(/:[^:@]+@/, ':****@');
  console.log(`   Connection: ${maskedConnection}\n`);

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('supabase.co') || connectionString.includes('pooler') ? {
      rejectUnauthorized: false,
    } : false,
    connectionTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection established\n');

    // Get all migration files
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && file !== 'rollback_template.sql')
      .sort();

    console.log(`📦 Found ${migrationFiles.length} migration file(s) to apply:\n`);

    // Apply all migrations
    let successCount = 0;
    let failCount = 0;
    const results: MigrationResult[] = [];

    for (const migrationFile of migrationFiles) {
      const migrationPath = path.join(migrationsDir, migrationFile);
      console.log(`📦 Applying: ${migrationFile}`);
      
      try {
        const result = await executeMigration(migrationPath, migrationFile, pool);
        results.push(result);
        
        if (result.success) {
          successCount++;
          console.log(`   ✅ Success\n`);
        } else {
          failCount++;
          console.log(`   ❌ Failed: ${result.error}\n`);
          // Continue with other migrations instead of stopping
        }
      } catch (error: any) {
        failCount++;
        results.push({
          migration: migrationFile,
          success: false,
          error: error.message,
          statementsExecuted: 0,
        });
        console.log(`   ❌ Failed: ${error.message}\n`);
        // Continue with other migrations
      }
    }

    console.log('📊 Migration Summary:');
    console.log(`   Total: ${migrationFiles.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Skipped (already exists): ${results.filter(r => r.success && r.statementsExecuted === 0).length}`);

    if (failCount === 0) {
      console.log('\n✅ All migrations applied successfully!');
    } else {
      console.log('\n⚠️  Some migrations failed (check errors above)');
      console.log('   Note: "already exists" errors are normal and can be ignored');
    }

  } catch (error: any) {
    console.error('\n❌ Migration process failed:', error.message);
    if (error.code === 'ENETUNREACH' || error.message.includes('ENETUNREACH')) {
      console.error('\n💡 Network connectivity issue detected.');
      console.error('   This might be due to:');
      console.error('   1. IPv6 connectivity issues');
      console.error('   2. Firewall blocking connection');
      console.error('   3. Database not accessible from this network');
      console.error('\n   Solutions:');
      console.error('   - Run migrations from a machine with database access');
      console.error('   - Use Supabase connection pooler (port 6543)');
      console.error('   - Check Supabase IP allowlist settings');
      console.error('   - Use Vercel CLI or Supabase CLI for migrations');
    }
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  applyAllMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error.message);
      process.exit(1);
    });
}

export { applyAllMigrations };
