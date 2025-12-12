#!/usr/bin/env tsx
/**
 * Verify Stripe Webhook Setup
 * 
 * Checks:
 * - Environment variables are set
 * - Database table exists
 * - Webhook endpoint is accessible
 */

import { prisma } from '../packages/web/src/shared/db/prismaClient';

async function verifyWebhookSetup() {
  console.log('🔍 Verifying Stripe Webhook Setup...\n');

  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check environment variables
  console.log('1. Checking environment variables...');
  const requiredEnvVars = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  };

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
      console.log(`   ❌ ${key}: NOT SET`);
    } else {
      const masked = key.includes('SECRET') || key.includes('KEY')
        ? `${value.substring(0, 8)}...`
        : value;
      console.log(`   ✅ ${key}: ${masked}`);
    }
  }

  // 2. Check database connection and table
  console.log('\n2. Checking database...');
  try {
    // Check if stripe_events table exists
    const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'stripe_events'
      );
    `;

    if (!tableExists[0]?.exists) {
      errors.push('stripe_events table does not exist. Run migration first.');
      console.log('   ❌ stripe_events table: NOT FOUND');
    } else {
      console.log('   ✅ stripe_events table: EXISTS');

      // Check indexes
      const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'stripe_events';
      `;

      const expectedIndexes = [
        'stripe_events_event_id_key', // unique constraint
        'stripe_events_event_id_idx',
        'stripe_events_type_idx',
        'stripe_events_status_idx',
      ];

      const existingIndexNames = indexes.map((i) => i.indexname);
      const missingIndexes = expectedIndexes.filter(
        (idx) => !existingIndexNames.includes(idx)
      );

      if (missingIndexes.length > 0) {
        warnings.push(`Missing indexes: ${missingIndexes.join(', ')}`);
        console.log(`   ⚠️  Missing indexes: ${missingIndexes.length}`);
      } else {
        console.log(`   ✅ Indexes: ${indexes.length} found`);
      }

      // Check recent events
      const recentEvents = await prisma.stripeEvent.count({
        where: {
          receivedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      console.log(`   ℹ️  Events in last 24h: ${recentEvents}`);
    }
  } catch (error) {
    errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log(`   ❌ Database: CONNECTION FAILED`);
    console.log(`      Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  // 3. Check webhook endpoint code
  console.log('\n3. Checking webhook endpoint code...');
  try {
    const fs = await import('fs');
    const webhookPath = 'packages/web/src/app/api/stripe/webhook/route.ts';
    const webhookCode = fs.readFileSync(webhookPath, 'utf-8');

    const checks = [
      { name: 'Node.js runtime', pattern: /export const runtime = ['"]nodejs['"]/ },
      { name: 'Raw body reading', pattern: /await request\.text\(\)/ },
      { name: 'Signature verification', pattern: /stripe\.webhooks\.constructEvent/ },
      { name: 'Database idempotency', pattern: /prisma\.stripeEvent/ },
      { name: 'checkout.session.completed handler', pattern: /checkout\.session\.completed/ },
    ];

    for (const check of checks) {
      if (check.pattern.test(webhookCode)) {
        console.log(`   ✅ ${check.name}: FOUND`);
      } else {
        warnings.push(`Webhook code missing: ${check.name}`);
        console.log(`   ⚠️  ${check.name}: NOT FOUND`);
      }
    }
  } catch (error) {
    warnings.push(`Could not read webhook code: ${error instanceof Error ? error.message : 'Unknown'}`);
    console.log(`   ⚠️  Webhook code: COULD NOT READ`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed! Webhook setup is complete.\n');
    process.exit(0);
  }

  if (errors.length > 0) {
    console.log(`\n❌ ERRORS (${errors.length}):`);
    errors.forEach((error) => console.log(`   - ${error}`));
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
    warnings.forEach((warning) => console.log(`   - ${warning}`));
  }

  console.log('\n📝 Next steps:');
  if (errors.some((e) => e.includes('stripe_events table'))) {
    console.log('   1. Apply database migration:');
    console.log('      npx prisma migrate deploy');
    console.log('      OR');
    console.log('      Apply supabase/migrations/20250121000000_add_stripe_events_table.sql');
  }
  if (errors.some((e) => e.includes('environment variable'))) {
    console.log('   2. Set missing environment variables in Vercel/dotenv');
  }
  if (warnings.some((w) => w.includes('Webhook code'))) {
    console.log('   3. Review webhook implementation');
  }

  console.log('\n');

  process.exit(errors.length > 0 ? 1 : 0);
}

verifyWebhookSetup().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
