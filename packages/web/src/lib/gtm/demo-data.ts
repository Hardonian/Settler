/**
 * Demo Data & Seed Utilities
 * 
 * PHASE 6: GTM READINESS CHECK
 * 
 * Provides seedable demo data for safe, repeatable demos.
 * No secrets, no chaos - every demo works the same way.
 */

// Note: Prisma imported dynamically to avoid import-time failures

export interface DemoTenant {
  id: string;
  name: string;
  slug: string;
  billingAccountId: string;
  userId: string;
}

/**
 * Create or reset demo tenant with seed data
 */
export async function createDemoTenant(
  userId: string,
  tenantName: string = 'Demo Company'
): Promise<DemoTenant> {
  const { prisma } = await import('@/shared/db/prismaClient');
  
  // Create billing account
  const billingAccount = await prisma.billingAccount.create({
    data: {
      userId,
      email: `demo-${Date.now()}@settler.dev`,
      status: 'active',
    },
  });

  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
      slug: `demo-${Date.now()}`,
      billingAccountId: billingAccount.id,
      isActive: true,
    },
  });

  // Seed demo data
  await seedDemoData(billingAccount.id, tenant.id, userId);

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    billingAccountId: billingAccount.id,
    userId,
  };
}

/**
 * Seed demo data for a tenant
 */
async function seedDemoData(
  billingAccountId: string,
  tenantId: string,
  userId: string
): Promise<void> {
  const { prisma } = await import('@/shared/db/prismaClient');
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Seed reconciliation results
  await prisma.reconResult.createMany({
    data: [
      {
        reconJobId: 'demo-job-1',
        tenantId,
        status: 'completed',
        startedAt: new Date(thirtyDaysAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
        completedAt: new Date(thirtyDaysAgo.getTime() + 1 * 24 * 60 * 60 * 1000 + 5000),
        sourceCount: 1000,
        targetCount: 1000,
        matchedCount: 950,
        unmatchedSourceCount: 30,
        unmatchedTargetCount: 20,
        conflictCount: 0,
        totalAmountSource: 50000,
        totalAmountTarget: 50000,
        totalAmountMatched: 47500,
        currency: 'USD',
        confidenceAvg: 0.98,
        durationMs: BigInt(5000),
      },
      {
        reconJobId: 'demo-job-2',
        tenantId,
        status: 'completed',
        startedAt: new Date(thirtyDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
        completedAt: new Date(thirtyDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000 + 8000),
        sourceCount: 2500,
        targetCount: 2500,
        matchedCount: 2400,
        unmatchedSourceCount: 70,
        unmatchedTargetCount: 30,
        conflictCount: 0,
        totalAmountSource: 125000,
        totalAmountTarget: 125000,
        totalAmountMatched: 120000,
        currency: 'USD',
        confidenceAvg: 0.97,
        durationMs: BigInt(8000),
      },
      {
        reconJobId: 'demo-job-3',
        tenantId,
        status: 'completed',
        startedAt: new Date(thirtyDaysAgo.getTime() + 14 * 24 * 60 * 60 * 1000),
        completedAt: new Date(thirtyDaysAgo.getTime() + 14 * 24 * 60 * 60 * 1000 + 12000),
        sourceCount: 5000,
        targetCount: 5000,
        matchedCount: 4850,
        unmatchedSourceCount: 100,
        unmatchedTargetCount: 50,
        conflictCount: 5,
        totalAmountSource: 250000,
        totalAmountTarget: 250000,
        totalAmountMatched: 242500,
        currency: 'USD',
        confidenceAvg: 0.96,
        durationMs: BigInt(12000),
      },
    ],
  });

  // Seed value events
  await prisma.usageEvent.createMany({
    data: [
      {
        billingAccountId,
        userId,
        tenantId,
        eventType: 'value:reconciliation_completed',
        quantity: 3,
        timestamp: now,
        metadata: {
          demo: true,
        },
      },
      {
        billingAccountId,
        userId,
        tenantId,
        eventType: 'value:reconciliation_matched',
        quantity: 8200,
        timestamp: now,
        metadata: {
          demo: true,
        },
      },
      {
        billingAccountId,
        userId,
        tenantId,
        eventType: 'value:records_processed',
        quantity: 8500,
        timestamp: now,
        metadata: {
          demo: true,
        },
      },
      {
        billingAccountId,
        userId,
        tenantId,
        eventType: 'value:reconciliation_time_saved',
        quantity: 1,
        timestamp: now,
        metadata: {
          demo: true,
          timeSavedMs: 25 * 60 * 60 * 1000, // 25 hours
        },
      },
      {
        billingAccountId,
        userId,
        tenantId,
        eventType: 'value:integration_connected',
        quantity: 2,
        timestamp: now,
        metadata: {
          demo: true,
          integrations: ['stripe', 'shopify'],
        },
      },
    ],
  });
}

/**
 * Reset demo tenant data
 */
export async function resetDemoTenant(tenantId: string): Promise<void> {
  const { prisma } = await import('@/shared/db/prismaClient');
  
  // Delete all demo data
  await prisma.usageEvent.deleteMany({
    where: {
      tenantId,
      metadata: {
        path: ['demo'],
        equals: true,
      },
    },
  });

  await prisma.reconResult.deleteMany({
    where: {
      tenantId,
    },
  });

  // Re-seed
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      billingAccount: true,
    },
  });

  if (tenant && tenant.billingAccount) {
    await seedDemoData(
      tenant.billingAccount.id,
      tenant.id,
      tenant.billingAccount.userId
    );
  }
}

/**
 * Check if tenant is a demo tenant
 */
export async function isDemoTenant(tenantId: string): Promise<boolean> {
  const { prisma } = await import('@/shared/db/prismaClient');
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  return tenant?.slug.startsWith('demo-') || false;
}
