#!/usr/bin/env tsx
/**
 * Check Applied Migrations
 * Lists which migrations have been applied and which are pending
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkMigrations(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const maskedConnection = connectionString.replace(/:[^:@]+@/, ':****@');
  console.log('🔍 Checking migration status...');
  console.log(`   Connection: ${maskedConnection}\n`);

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('supabase.co') || connectionString.includes('pooler') ? {
      rejectUnauthorized: false,
    } : false,
    connectionTimeoutMillis: 30000,
  });

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection established\n');

    // Ensure migrations table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Get applied migrations
    const appliedResult = await pool.query<{ version: string; applied_at: Date }>(
      'SELECT version, applied_at FROM schema_migrations ORDER BY version'
    );
    const appliedMigrations = new Set(appliedResult.rows.map(r => r.version));

    console.log(`📋 Applied Migrations: ${appliedMigrations.size}`);
    if (appliedMigrations.size > 0) {
      appliedResult.rows.forEach(row => {
        console.log(`   ✅ ${row.version} (${row.applied_at.toISOString()})`);
      });
    }
    console.log('');

    // Get all migration files
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && file !== 'rollback_template.sql')
      .sort();

    console.log(`📦 Total Migration Files: ${migrationFiles.length}\n`);

    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(file => !appliedMigrations.has(file));
    
    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations have been applied!');
      return;
    }

    console.log(`🔄 Pending Migrations: ${pendingMigrations.length}`);
    pendingMigrations.forEach(file => {
      console.log(`   ⏳ ${file}`);
    });
    console.log('');

    // Summary
    console.log('📊 Summary:');
    console.log(`   Applied: ${appliedMigrations.size}`);
    console.log(`   Pending: ${pendingMigrations.length}`);
    console.log(`   Total: ${migrationFiles.length}`);

  } catch (error: any) {
    console.error('\n❌ Error checking migrations:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error.message);
      process.exit(1);
    });
}

export { checkMigrations };
