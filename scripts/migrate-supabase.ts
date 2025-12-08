/**
 * Supabase Migration Runner
 * 
 * Automatically runs all migrations from supabase/migrations/ directory
 * and seeds the database with initial data.
 * 
 * Usage:
 *   tsx scripts/migrate-supabase.ts
 * 
 * Environment Variables Required:
 *   - DATABASE_URL (preferred) OR
 *   - SUPABASE_URL + SUPABASE_DB_PASSWORD OR
 *   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
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
  // Priority 1: DATABASE_URL (direct PostgreSQL connection string)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Priority 2: Supabase connection (remote)
  if (process.env.SUPABASE_URL) {
    // Try to get password from SUPABASE_DB_PASSWORD
    if (process.env.SUPABASE_DB_PASSWORD) {
      const supabaseUrl = process.env.SUPABASE_URL;
      // Extract project ref from URL (format: https://project-ref.supabase.co)
      const hostMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
      if (hostMatch) {
        const projectRef = hostMatch[1];
        // Try transaction pooler first (better connectivity, port 6543)
        // Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
        // For now, try direct connection with db. prefix
        const host = `db.${projectRef}.supabase.co`;
        const port = process.env.DB_PORT || '5432';
        return `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@${host}:${port}/postgres`;
      }
    }
    
    // Try to construct from SUPABASE_URL if it's a connection string format
    // Some setups provide direct connection strings
    if (process.env.SUPABASE_URL.startsWith('postgresql://')) {
      return process.env.SUPABASE_URL;
    }
  }

  // Priority 3: Local Supabase (from config.toml)
  // Default local Supabase connection
  const localHost = process.env.DB_HOST || 'localhost';
  const localPort = process.env.DB_PORT || '54322'; // Supabase local DB port
  const localDatabase = process.env.DB_NAME || 'postgres';
  const localUser = process.env.DB_USER || 'postgres';
  const localPassword = process.env.DB_PASSWORD || 'postgres';
  
  return `postgresql://${localUser}:${localPassword}@${localHost}:${localPort}/${localDatabase}`;
}

/**
 * Execute SQL migration file
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
    // This handles BEGIN/COMMIT blocks properly
    try {
      await pool.query(migrationSQL);
      result.statementsExecuted = 1; // Count as one transaction
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
 * Execute seed file
 */
async function executeSeed(
  seedPath: string,
  pool: Pool
): Promise<void> {
  try {
    if (!fs.existsSync(seedPath)) {
      console.log('⚠ Seed file not found, skipping seed data');
      return;
    }

    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    // Only execute if there's actual content (not just comments)
    const hasContent = seedSQL
      .split('\n')
      .some(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--') && !trimmed.startsWith('BEGIN') && !trimmed.startsWith('COMMIT');
      });

    if (!hasContent) {
      console.log('⚠ Seed file is empty, skipping seed data');
      return;
    }

    await pool.query(seedSQL);
    console.log('✓ Seed data loaded successfully');
  } catch (error: any) {
    console.error('✗ Seed data failed to load');
    console.error(`  Error: ${error.message}`);
    // Don't throw - seed failures shouldn't stop the migration process
  }
}

/**
 * Run all migrations in order
 */
async function runMigrations(): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];
  const connectionString = getConnectionString();

  console.log('🚀 Starting Supabase migration process...');
  const maskedConnection = connectionString.replace(/:[^:@]+@/, ':****@');
  console.log(`   Connection: ${maskedConnection}`);
  
  // Provide helpful connection info
  if (!process.env.DATABASE_URL && !process.env.SUPABASE_URL) {
    console.log('\n💡 Tip: Set DATABASE_URL or SUPABASE_URL environment variable for remote connections');
    console.log('   For local Supabase: Make sure Supabase is running locally (supabase start)');
  }

  // Parse connection string to handle IPv6 issues
  let parsedConnection = connectionString;
  
  // If using pooler hostname, resolve to IPv4 to avoid IPv6 issues
  if (connectionString.includes('pooler.supabase.com')) {
    try {
      const dns = require('dns');
      const { promisify } = require('util');
      const resolve4 = promisify(dns.resolve4);
      
      // Extract hostname from connection string
      const hostMatch = connectionString.match(/@([^:]+):/);
      if (hostMatch) {
        const hostname = hostMatch[1];
        const ipv4 = await resolve4(hostname);
        if (ipv4 && ipv4[0]) {
          // Replace hostname with IPv4 address
          parsedConnection = connectionString.replace(hostname, ipv4[0]);
          console.log(`   Resolved ${hostname} to IPv4: ${ipv4[0]}`);
        }
      }
    } catch (error) {
      // If resolution fails, use original connection string
      console.log(`   Could not resolve to IPv4, using original hostname`);
    }
  }

  const pool = new Pool({
    connectionString: parsedConnection,
    ssl: process.env.SUPABASE_URL || connectionString.includes('supabase.co') || connectionString.includes('pooler') ? {
      rejectUnauthorized: false, // Supabase uses self-signed certs
    } : (process.env.DB_SSL === 'true'),
    // Connection settings
    connectionTimeoutMillis: 30000,
    // Allow IPv6 connections
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✓ Database connection established');

    // Get all migration files in order
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && file !== 'rollback_template.sql')
      .sort(); // Sort alphabetically to ensure order

    console.log(`\n📦 Found ${migrationFiles.length} migration(s) to run:`);
    migrationFiles.forEach(file => console.log(`   - ${file}`));

    // Run each migration
    for (const migrationFile of migrationFiles) {
      const migrationPath = path.join(migrationsDir, migrationFile);
      
      try {
        const result = await executeMigration(migrationPath, migrationFile, pool);
        results.push(result);
        
        if (!result.success) {
          console.error(`\n❌ Migration ${migrationFile} failed, stopping migration process`);
          break;
        }
      } catch (error: any) {
        results.push({
          migration: migrationFile,
          success: false,
          error: error.message,
          statementsExecuted: 0,
        });
        console.error(`\n❌ Migration ${migrationFile} failed`, error);
        throw error;
      }
    }

    // Run seed file
    console.log('\n🌱 Running seed data...');
    const seedPath = path.join(process.cwd(), 'supabase', 'seeds', 'seed.sql');
    await executeSeed(seedPath, pool);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log('\n📊 Migration Summary:');
    console.log(`   Total migrations: ${results.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${failCount}`);

    if (failCount === 0) {
      console.log('\n✅ All migrations completed successfully!');
    } else {
      console.log('\n❌ Some migrations failed');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n❌ Migration process failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }

  return results;
}

/**
 * CLI entry point
 */
if (require.main === module) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runMigrations };
