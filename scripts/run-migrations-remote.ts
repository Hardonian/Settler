/**
 * Remote Migration Runner
 * 
 * Runs database migrations using IPv4 Pooler connection string.
 * Usage: DATABASE_URL="postgresql://..." pnpm tsx scripts/run-migrations-remote.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or SUPABASE_DB_URL environment variable is required');
  console.error('   Example: DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"');
  process.exit(1);
}

const migrations = [
  '20241201000000_create_api_call_logs.sql',
  '20241201000001_optimize_api_call_logs.sql',
  '20241201000002_add_log_retention_policy.sql',
  '20241201000003_enhance_rls_policies.sql',
];

async function runMigrations() {
  // Configure SSL for Supabase pooler connections
  // Always use SSL for Supabase, but don't reject self-signed certs
  const sslConfig = DATABASE_URL.includes('pooler') || DATABASE_URL.includes('supabase') 
    ? { 
        rejectUnauthorized: false,
        require: true 
      } 
    : undefined;
  
  // Parse connection string and override SSL settings
  const clientConfig: any = {
    connectionString: DATABASE_URL,
  };
  
  // Force SSL config for Supabase
  if (DATABASE_URL.includes('pooler') || DATABASE_URL.includes('supabase')) {
    clientConfig.ssl = sslConfig;
  }
  
  const client = new Client(clientConfig);

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Get applied migrations
    const { rows: appliedMigrations } = await client.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    const appliedVersions = new Set(appliedMigrations.map((r: { version: string }) => r.version));

    console.log(`📋 Found ${migrations.length} migration(s) to check\n`);

    for (const migrationFile of migrations) {
      const version = migrationFile.replace('.sql', '');
      
      if (appliedVersions.has(version)) {
        console.log(`⏭️  Skipping ${migrationFile} (already applied)`);
        continue;
      }

      console.log(`📄 Running ${migrationFile}...`);
      
      try {
        const migrationPath = join(process.cwd(), 'supabase', 'migrations', migrationFile);
        const migrationSQL = readFileSync(migrationPath, 'utf-8');
        
        // Run migration in a transaction
        await client.query('BEGIN');
        await client.query(migrationSQL);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version]
        );
        await client.query('COMMIT');
        
        console.log(`✅ Successfully applied ${migrationFile}\n`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error applying ${migrationFile}:`, error);
        throw error;
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

runMigrations();
