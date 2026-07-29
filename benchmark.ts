import { prisma } from './packages/api/src/infrastructure/db/prisma';
import { retentionPolicyService } from './packages/api/src/services/retention/retention-policy';

async function runBenchmark() {
  console.log("Setting up test data...");
  for (let i = 0; i < 50; i++) {
    const tenant = await prisma.tenant.create({
      data: {
        name: `Tenant ${i}`,
        isActive: true,
      }
    });

    if (i % 2 === 0) {
      const ba = await prisma.billingAccount.create({
        data: {
          tenantId: tenant.id,
        }
      });
      await prisma.subscription.create({
        data: {
          billingAccountId: ba.id,
          status: "active",
          planId: i % 4 === 0 ? "enterprise" : "starter"
        }
      });
    }
  }

  console.log("Measuring current implementation...");
  const start = performance.now();
  await retentionPolicyService.getAllTenantRetentionPolicies();
  const end = performance.now();

  console.log(`Current implementation took: ${end - start}ms`);
}

runBenchmark().catch(console.error).finally(() => prisma.$disconnect());
