#!/usr/bin/env tsx
/**
 * Apply Supabase migrations via Pooler connection
 * 
 * This script applies the enterprise multi-tenant migrations directly
 * using a PostgreSQL connection (pooler or direct)
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

const MIGRATIONS = [
  '20251219001646_enterprise_multi_tenant_core.sql',
  '20251219001647_enterprise_cms_tables.sql',
  '20251219001648_enterprise_rls_policies.sql',
];

async function applyMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable not set');
    console.log('\nUsage:');
    console.log('  DATABASE_URL="postgresql://..." tsx scripts/apply-migrations-direct-pooler.ts');
    console.log('\nExample pooler URL:');
    console.log('  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST].pooler.supabase.com:5432/postgres');
    console.log('\nFor CI/CD:');
    console.log('  Set DATABASE_URL as GitHub secret and it will be used automatically');
    process.exit(1);
  }
  
  // Log connection info (without exposing password)
  const urlObj = new URL(databaseUrl);
  console.log(`🔌 Connecting to: ${urlObj.protocol}//${urlObj.hostname}:${urlObj.port}${urlObj.pathname}`);
  console.log(`📋 User: ${urlObj.username}`);
  console.log(`🔒 Password: ${urlObj.password ? '***' : 'not set'}`);

  // Check if it's a pooler connection
  if (!databaseUrl.includes('pooler') && !databaseUrl.includes('pooler.supabase.com')) {
    console.warn('⚠️  Warning: DATABASE_URL does not appear to be a pooler connection');
    console.log('Pooler URLs typically contain "pooler.supabase.com"');
  }

  // Parse connection string to handle special characters
  let connectionString = databaseUrl;
  
  // Handle URL encoding issues
  if (connectionString.includes('[') && connectionString.includes(']')) {
    // Extract password from brackets and URL encode it
    const passwordMatch = connectionString.match(/\[([^\]]+)\]/);
    if (passwordMatch) {
      const password = encodeURIComponent(passwordMatch[1]);
      connectionString = connectionString.replace(/\[([^\]]+)\]/, password);
    }
  }

  const client = new Client({
    connectionString,
    // Pooler connections need SSL
    ssl: connectionString.includes('supabase.com') || connectionString.includes('pooler') 
      ? { rejectUnauthorized: false } 
      : undefined,
    // Connection timeout
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Create migrations tracking table
    console.log('📋 Setting up migrations tracking...');
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS supabase_migrations;
      CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        inserted_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Migrations table ready\n');

    // Apply each migration
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const migration of MIGRATIONS) {
      const migrationFile = join(process.cwd(), 'supabase', 'migrations', migration);
      const migrationVersion = migration.replace('.sql', '');

      try {
        // Check if already applied
        const checkResult = await client.query(
          'SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = $1',
          [migrationVersion]
        );

        if (checkResult.rows.length > 0) {
          console.log(`⊘ Skipping (already applied): ${migration}`);
          skippedCount++;
          continue;
        }

        console.log(`📝 Applying: ${migration}`);

        // Read and execute migration
        const sql = readFileSync(migrationFile, 'utf-8');
        
        // Execute migration
        await client.query(sql);

        // Record migration
        await client.query(
          'INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING',
          [migrationVersion, migration]
        );

        console.log(`✅ Successfully applied: ${migration}\n`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to apply: ${migration}`);
        console.error(`   Error: ${error instanceof Error ? error.message : String(error)}\n`);
        failedCount++;
      }
    }

    // Summary
    console.log('==========================================');
    console.log('📊 Migrations Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed:  ${failedCount}`);
    console.log(`   ⊘ Skipped: ${skippedCount}`);
    console.log('==========================================\n');

    if (failedCount > 0) {
      console.error('❌ Some migrations failed. Please review the errors above.');
      process.exit(1);
    }

    console.log('🎉 All migrations applied successfully!');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Database connection error:', errorMessage);
    
    if (errorMessage.includes('password authentication')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Check that your DATABASE_URL password is correct');
      console.error('   2. Ensure password is URL-encoded if it contains special characters');
      console.error('   3. Verify the connection string format:');
      console.error('      postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST].pooler.supabase.com:5432/postgres');
      console.error('   4. Try using the direct connection instead of pooler');
    } else if (errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Check that the hostname is correct');
      console.error('   2. Verify network connectivity');
      console.error('   3. Ensure the database is accessible from this IP');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigrations().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
