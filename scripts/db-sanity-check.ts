/**
 * Database Sanity Check Script
 * 
 * Validates data integrity, constraints, and relationships.
 * Run this periodically to catch data issues early.
 */

import { prisma } from '../packages/web/src/shared/db/prismaClient';

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: CheckResult[] = [];

function addResult(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (details && !passed) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }
}

async function checkBillingAccountIntegrity() {
  // Check for orphaned subscriptions
  const orphanedSubs = await prisma.subscription.findMany({
    where: {
      billingAccount: null,
    },
    select: { id: true, billingAccountId: true },
  });

  if (orphanedSubs.length > 0) {
    addResult(
      'Billing Account Integrity',
      false,
      `Found ${orphanedSubs.length} orphaned subscriptions`,
      { orphanedSubs }
    );
  } else {
    addResult('Billing Account Integrity', true, 'No orphaned subscriptions');
  }

  // Check for duplicate Stripe customer IDs
  const duplicateCustomers = await prisma.billingAccount.groupBy({
    by: ['stripeCustomerId'],
    where: {
      stripeCustomerId: { not: null },
    },
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          gt: 1,
        },
      },
    },
  });

  if (duplicateCustomers.length > 0) {
    addResult(
      'Stripe Customer Mapping',
      false,
      `Found ${duplicateCustomers.length} duplicate Stripe customer IDs`,
      { duplicateCustomers }
    );
  } else {
    addResult('Stripe Customer Mapping', true, 'No duplicate Stripe customer IDs');
  }
}

async function checkSubscriptionIntegrity() {
  // Check for subscriptions without Stripe subscription ID
  const subsWithoutStripeId = await prisma.subscription.findMany({
    where: {
      stripeSubscriptionId: null,
      status: { in: ['active', 'trialing'] },
    },
    select: { id: true, billingAccountId: true, status: true },
  });

  if (subsWithoutStripeId.length > 0) {
    addResult(
      'Subscription Integrity',
      false,
      `Found ${subsWithoutStripeId.length} active subscriptions without Stripe ID`,
      { subsWithoutStripeId }
    );
  } else {
    addResult('Subscription Integrity', true, 'All active subscriptions have Stripe IDs');
  }

  // Check for duplicate Stripe subscription IDs
  const duplicateStripeSubs = await prisma.subscription.groupBy({
    by: ['stripeSubscriptionId'],
    where: {
      stripeSubscriptionId: { not: null },
    },
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          gt: 1,
        },
      },
    },
  });

  if (duplicateStripeSubs.length > 0) {
    addResult(
      'Stripe Subscription Mapping',
      false,
      `Found ${duplicateStripeSubs.length} duplicate Stripe subscription IDs`,
      { duplicateStripeSubs }
    );
  } else {
    addResult('Stripe Subscription Mapping', true, 'No duplicate Stripe subscription IDs');
  }
}

async function checkUsageIntegrity() {
  // Check for usage events without billing account
  const orphanedUsage = await prisma.usageEvent.findMany({
    where: {
      billingAccount: null,
    },
    select: { id: true, billingAccountId: true },
    take: 10,
  });

  if (orphanedUsage.length > 0) {
    addResult(
      'Usage Event Integrity',
      false,
      `Found ${orphanedUsage.length} orphaned usage events (showing first 10)`,
      { orphanedUsage }
    );
  } else {
    addResult('Usage Event Integrity', true, 'No orphaned usage events');
  }

  // Check for negative usage quantities
  const negativeUsage = await prisma.usageEvent.findMany({
    where: {
      quantity: { lt: 0 },
    },
    select: { id: true, quantity: true, eventType: true },
    take: 10,
  });

  if (negativeUsage.length > 0) {
    addResult(
      'Usage Quantity Validation',
      false,
      `Found ${negativeUsage.length} usage events with negative quantities (showing first 10)`,
      { negativeUsage }
    );
  } else {
    addResult('Usage Quantity Validation', true, 'No negative usage quantities');
  }
}

async function checkReconJobIntegrity() {
  // Check for recon jobs without tenant
  const jobsWithoutTenant = await prisma.reconJob.findMany({
    where: {
      tenantId: null,
    },
    select: { id: true, name: true },
    take: 10,
  });

  if (jobsWithoutTenant.length > 0) {
    addResult(
      'Recon Job Integrity',
      false,
      `Found ${jobsWithoutTenant.length} recon jobs without tenant (showing first 10)`,
      { jobsWithoutTenant }
    );
  } else {
    addResult('Recon Job Integrity', true, 'All recon jobs have tenants');
  }

  // Check for recon results without job
  const orphanedResults = await prisma.reconResult.findMany({
    where: {
      reconJob: null,
    },
    select: { id: true, reconJobId: true },
    take: 10,
  });

  if (orphanedResults.length > 0) {
    addResult(
      'Recon Result Integrity',
      false,
      `Found ${orphanedResults.length} orphaned recon results (showing first 10)`,
      { orphanedResults }
    );
  } else {
    addResult('Recon Result Integrity', true, 'No orphaned recon results');
  }
}

async function checkFeatureFlagIntegrity() {
  // Check for feature flags without environments
  const flagsWithoutEnvs = await prisma.featureFlag.findMany({
    where: {
      environments: {
        none: {},
      },
    },
    select: { id: true, key: true },
    take: 10,
  });

  if (flagsWithoutEnvs.length > 0) {
    addResult(
      'Feature Flag Integrity',
      false,
      `Found ${flagsWithoutEnvs.length} feature flags without environments (showing first 10)`,
      { flagsWithoutEnvs }
    );
  } else {
    addResult('Feature Flag Integrity', true, 'All feature flags have environments');
  }
}

async function checkTenantIntegrity() {
  // Check for tenants without billing accounts (if required)
  const tenantsWithoutBilling = await prisma.tenant.findMany({
    where: {
      billingAccountId: null,
      isActive: true,
    },
    select: { id: true, slug: true },
    take: 10,
  });

  // This is a warning, not an error (billing account is optional)
  if (tenantsWithoutBilling.length > 0) {
    addResult(
      'Tenant Billing Mapping',
      true, // Pass but warn
      `Found ${tenantsWithoutBilling.length} active tenants without billing accounts (optional)`,
      { tenantsWithoutBilling }
    );
  } else {
    addResult('Tenant Billing Mapping', true, 'All active tenants have billing accounts');
  }
}

async function checkStripeEventIntegrity() {
  // Check for unprocessed events older than 1 hour
  const oldUnprocessedEvents = await prisma.stripeEvent.findMany({
    where: {
      status: { in: ['received'] },
      receivedAt: {
        lt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      },
    },
    select: { id: true, eventId: true, type: true, receivedAt: true },
    take: 10,
  });

  if (oldUnprocessedEvents.length > 0) {
    addResult(
      'Stripe Event Processing',
      false,
      `Found ${oldUnprocessedEvents.length} unprocessed Stripe events older than 1 hour (showing first 10)`,
      { oldUnprocessedEvents }
    );
  } else {
    addResult('Stripe Event Processing', true, 'All Stripe events processed within 1 hour');
  }

  // Check for duplicate event IDs
  const duplicateEvents = await prisma.stripeEvent.groupBy({
    by: ['eventId'],
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          gt: 1,
        },
      },
    },
  });

  if (duplicateEvents.length > 0) {
    addResult(
      'Stripe Event Uniqueness',
      false,
      `Found ${duplicateEvents.length} duplicate Stripe event IDs`,
      { duplicateEvents }
    );
  } else {
    addResult('Stripe Event Uniqueness', true, 'No duplicate Stripe event IDs');
  }
}

async function main() {
  console.log('🔍 Running database sanity checks...\n');

  try {
    await checkBillingAccountIntegrity();
    await checkSubscriptionIntegrity();
    await checkUsageIntegrity();
    await checkReconJobIntegrity();
    await checkFeatureFlagIntegrity();
    await checkTenantIntegrity();
    await checkStripeEventIntegrity();

    console.log('\n📊 Summary:');
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total: ${results.length}`);

    if (failed > 0) {
      console.log('\n⚠️  Some checks failed. Review the details above.');
      process.exit(1);
    } else {
      console.log('\n✅ All checks passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error running sanity checks:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
