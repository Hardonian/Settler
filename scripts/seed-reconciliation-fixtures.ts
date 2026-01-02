/**
 * Seed Reconciliation Fixtures
 * 
 * One-command seed script for reconciliation testing.
 * Creates test data: ingestion sources, transactions, and triggers reconciliation.
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface CSVRow {
  date: string;
  amount: string;
  description: string;
  currency: string;
  source: 'bank' | 'receipt';
}

async function seedFixtures() {
  console.log('🌱 Seeding reconciliation fixtures...\n');

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  // Read CSV fixture
  const csvPath = path.join(__dirname, '../fixtures/reconciliation-test-data.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = csv.parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  }) as CSVRow[];

  console.log(`📄 Loaded ${rows.length} transactions from fixture CSV\n`);

  // Get or create test user
  const testEmail = `test-reconciliation-${Date.now()}@settler.dev`;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Create test user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: 'TestPassword123!',
    email_confirm: true,
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to create test user: ${authError?.message}`);
  }

  const userId = authData.user.id;
  console.log(`✅ Created test user: ${testEmail}`);

  // Create billing account
  const billingAccount = await prisma.billingAccount.create({
    data: {
      userId,
      email: testEmail,
      status: 'active',
    },
  });
  console.log(`✅ Created billing account: ${billingAccount.id}`);

  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      slug: `test-reconciliation-${Date.now()}`,
      name: 'Test Reconciliation Tenant',
      billingAccountId: billingAccount.id,
      isActive: true,
    },
  });
  console.log(`✅ Created tenant: ${tenant.id}`);

  // Update billing account with tenant_id
  await prisma.billingAccount.update({
    where: { id: billingAccount.id },
    data: { tenantId: tenant.id },
  });

  // Create ingestion sources
  const bankSource = await prisma.ingestionSource.create({
    data: {
      tenantId: tenant.id,
      userId,
      name: 'Test Bank Feed',
      type: 'csv',
      connectorType: null,
      status: 'active',
    },
  });

  const receiptSource = await prisma.ingestionSource.create({
    data: {
      tenantId: tenant.id,
      userId,
      name: 'Test Receipt Feed',
      type: 'csv',
      connectorType: null,
      status: 'active',
    },
  });
  console.log(`✅ Created ingestion sources: bank=${bankSource.id}, receipt=${receiptSource.id}`);

  // Create ingestion records
  const bankIngestion = await prisma.ingestion.create({
    data: {
      sourceId: bankSource.id,
      tenantId: tenant.id,
      userId,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      rawRecordCount: 0,
      normalizedCount: 0,
      failedCount: 0,
    },
  });

  const receiptIngestion = await prisma.ingestion.create({
    data: {
      sourceId: receiptSource.id,
      tenantId: tenant.id,
      userId,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      rawRecordCount: 0,
      normalizedCount: 0,
      failedCount: 0,
    },
  });

  // Create normalized transactions
  const bankTransactions = [];
  const receiptTransactions = [];

  for (const row of rows) {
    const transactionDate = new Date(row.date);
    const amount = parseFloat(row.amount);
    const isBank = row.source === 'bank';

    const transaction = await prisma.normalizedTransaction.create({
      data: {
        tenantId: tenant.id,
        sourceId: isBank ? bankSource.id : receiptSource.id,
        ingestionId: isBank ? bankIngestion.id : receiptIngestion.id,
        amount,
        currency: row.currency,
        date: transactionDate,
        description: row.description,
        createdAt: new Date(),
      },
    });

    if (isBank) {
      bankTransactions.push(transaction);
    } else {
      receiptTransactions.push(transaction);
    }
  }

  console.log(`✅ Created ${bankTransactions.length} bank transactions`);
  console.log(`✅ Created ${receiptTransactions.length} receipt transactions`);

  // Create reconciliation run
  const reconciliationRun = await prisma.reconciliationRun.create({
    data: {
      tenantId: tenant.id,
      userId,
      ingestionId: bankIngestion.id,
      name: 'Test Reconciliation Run',
      status: 'pending',
      startedAt: new Date(),
      sourceCount: bankTransactions.length,
      targetCount: receiptTransactions.length,
    },
  });
  console.log(`✅ Created reconciliation run: ${reconciliationRun.id}`);

  // Run matching (using deterministic matcher)
  const { runDeterministicMatching } = await import('../packages/web/src/lib/reconciliation/deterministic-matcher');

  const matchResult = await runDeterministicMatching(
    tenant.id,
    reconciliationRun.id,
    bankTransactions.map(t => ({
      id: t.id,
      amount: Number(t.amount),
      date: t.date,
      description: t.description,
      currency: t.currency,
    })),
    receiptTransactions.map(t => ({
      id: t.id,
      amount: Number(t.amount),
      date: t.date,
      description: t.description,
      currency: t.currency,
    }))
  );

  // Update reconciliation run
  await prisma.reconciliationRun.update({
    where: { id: reconciliationRun.id },
    data: {
      status: 'completed',
      completedAt: new Date(),
      matchedCount: matchResult.matchedCount,
      unmatchedSourceCount: matchResult.unmatchedCount,
      unmatchedTargetCount: receiptTransactions.length - matchResult.matchedCount,
    },
  });

  console.log(`\n✅ Reconciliation complete:`);
  console.log(`   - Matched: ${matchResult.matchedCount}`);
  console.log(`   - Unmatched: ${matchResult.unmatchedCount}`);

  console.log(`\n📊 Summary:`);
  console.log(`   - Tenant ID: ${tenant.id}`);
  console.log(`   - Reconciliation Run ID: ${reconciliationRun.id}`);
  console.log(`   - Bank Transactions: ${bankTransactions.length}`);
  console.log(`   - Receipt Transactions: ${receiptTransactions.length}`);
  console.log(`   - Matches Created: ${matchResult.matchedCount}`);

  console.log(`\n✅ Fixture seeding complete!`);
  console.log(`\nTo test reconciliation:`);
  console.log(`  curl http://localhost:3000/api/console/reconciliation?id=${reconciliationRun.id} \\`);
  console.log(`    -H "Authorization: Bearer <token>"`);

  return {
    tenantId: tenant.id,
    runId: reconciliationRun.id,
    matchCount: matchResult.matchedCount,
  };
}

seedFixtures()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
