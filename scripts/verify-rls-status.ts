#!/usr/bin/env tsx
/**
 * Verify RLS Status on Production Database
 * 
 * Checks if RLS is enabled on critical tables.
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 
  process.env.DIRECT_URL ||
  process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL, DIRECT_URL, or SUPABASE_DB_URL');
  process.exit(1);
}

const criticalTables = [
  'billing_accounts',
  'subscriptions',
  'usage_events',
  'recon_jobs',
  'recon_results',
  'normalized_transactions',
  'reconciliation_runs',
  'reconciliation_matches',
  'receipt_uploads',
  'receipts',
  'feature_flags',
  'tenants',
];

async function verifyRLS() {
  console.log('🔍 Verifying RLS Status on Critical Tables...\n');

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false,
  });

  try {
    await pool.query('SELECT 1');
    console.log('✅ Connected to database\n');

    let allEnabled = true;
    const results: Array<{ table: string; rlsEnabled: boolean; policies: number }> = [];

    for (const table of criticalTables) {
      try {
        // Check if RLS is enabled
        const rlsCheck = await pool.query(`
          SELECT tablename, rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' AND tablename = $1
        `, [table]);

        if (rlsCheck.rows.length === 0) {
          console.log(`⚠️  ${table}: Table not found`);
          continue;
        }

        const rlsEnabled = rlsCheck.rows[0].rowsecurity;

        // Count policies
        const policyCheck = await pool.query(`
          SELECT COUNT(*) as count
          FROM pg_policies
          WHERE schemaname = 'public' AND tablename = $1
        `, [table]);

        const policyCount = parseInt(policyCheck.rows[0].count, 10);

        results.push({
          table,
          rlsEnabled,
          policies: policyCount,
        });

        const icon = rlsEnabled ? '✅' : '❌';
        const policyIcon = policyCount > 0 ? '🔒' : '⚠️';
        console.log(`${icon} ${policyIcon} ${table}: RLS ${rlsEnabled ? 'ENABLED' : 'DISABLED'} (${policyCount} policies)`);

        if (!rlsEnabled) {
          allEnabled = false;
        }
      } catch (error) {
        console.error(`❌ Error checking ${table}:`, error instanceof Error ? error.message : String(error));
        allEnabled = false;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('RLS VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    const enabledCount = results.filter(r => r.rlsEnabled).length;
    const disabledCount = results.filter(r => !r.rlsEnabled).length;

    console.log(`Total tables checked: ${results.length}`);
    console.log(`✅ RLS Enabled: ${enabledCount}`);
    console.log(`❌ RLS Disabled: ${disabledCount}\n`);

    if (allEnabled && results.every(r => r.policies > 0)) {
      console.log('✅ All critical tables have RLS enabled with policies!');
      console.log('🚀 Database is secure for production launch.\n');
    } else {
      console.log('⚠️  Some tables are missing RLS or policies.');
      console.log('💡 Apply migration: supabase/migrations/20250122000000_rls_enforcement_critical.sql\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyRLS().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
