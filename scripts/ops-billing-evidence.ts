#!/usr/bin/env tsx
/**
 * Billing Incident Evidence Pack Generator
 * 
 * Exports a comprehensive evidence pack for billing incidents:
 * - StripeEvent logs (sanitized)
 * - Subscription timeline
 * - Usage aggregates
 * - Key tenant metadata
 * 
 * Usage: npm run ops:billing:evidence --tenant <tenant-id>
 */

import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

interface EvidencePack {
  tenantId: string;
  generatedAt: string;
  stripeEvents: Array<{
    id: string;
    type: string;
    status: string;
    receivedAt: string;
    processedAt: string | null;
    error: string | null;
  }>;
  subscriptionTimeline: Array<{
    id: string;
    planId: string;
    planName: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    createdAt: string;
  }>;
  usageAggregates: Array<{
    date: string;
    eventType: string;
    totalQuantity: number;
    eventCount: number;
  }>;
  tenantMetadata: {
    id: string;
    slug: string;
    name: string;
    isActive: boolean;
    createdAt: string;
  };
  billingAccount: {
    id: string;
    email: string;
    status: string;
    stripeCustomerId: string | null;
    createdAt: string;
  };
}

async function generateEvidencePack(tenantId: string): Promise<EvidencePack> {
  // Get tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      billingAccount: true,
    },
  });

  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  const billingAccountId = tenant.billingAccountId;
  if (!billingAccountId) {
    throw new Error(`Tenant ${tenantId} has no billing account`);
  }

  // Get Stripe events (sanitized - no raw payloads)
  const stripeEvents = await prisma.stripeEvent.findMany({
    where: {
      billingAccountId,
    },
    select: {
      id: true,
      type: true,
      status: true,
      receivedAt: true,
      processedAt: true,
      error: true,
    },
    orderBy: {
      receivedAt: 'desc',
    },
    take: 100, // Limit to recent events
  });

  // Get subscription timeline
  const subscriptions = await prisma.subscription.findMany({
    where: {
      billingAccountId,
    },
    select: {
      id: true,
      planId: true,
      planName: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get usage aggregates (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const usageAggregates = await prisma.usageAggregateDaily.findMany({
    where: {
      billingAccountId,
      date: {
        gte: ninetyDaysAgo,
      },
    },
    select: {
      date: true,
      eventType: true,
      totalQuantity: true,
      eventCount: true,
    },
    orderBy: {
      date: 'desc',
    },
  });

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    stripeEvents: stripeEvents.map((e) => ({
      id: e.id,
      type: e.type,
      status: e.status,
      receivedAt: e.receivedAt.toISOString(),
      processedAt: e.processedAt?.toISOString() || null,
      error: e.error,
    })),
    subscriptionTimeline: subscriptions.map((s) => ({
      id: s.id,
      planId: s.planId,
      planName: s.planName,
      status: s.status,
      currentPeriodStart: s.currentPeriodStart.toISOString(),
      currentPeriodEnd: s.currentPeriodEnd.toISOString(),
      createdAt: s.createdAt.toISOString(),
    })),
    usageAggregates: usageAggregates.map((u) => ({
      date: u.date.toISOString(),
      eventType: u.eventType,
      totalQuantity: Number(u.totalQuantity),
      eventCount: u.eventCount,
    })),
    tenantMetadata: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt.toISOString(),
    },
    billingAccount: {
      id: tenant.billingAccount!.id,
      email: tenant.billingAccount!.email,
      status: tenant.billingAccount!.status,
      stripeCustomerId: tenant.billingAccount!.stripeCustomerId,
      createdAt: tenant.billingAccount!.createdAt.toISOString(),
    },
  };
}

async function saveEvidencePack(pack: EvidencePack, outputDir: string): Promise<string> {
  await mkdir(outputDir, { recursive: true });

  // Save JSON
  const jsonPath = join(outputDir, `billing-evidence-${pack.tenantId}.json`);
  await writeFile(jsonPath, JSON.stringify(pack, null, 2), 'utf-8');

  // Generate markdown report
  const markdown = `# Billing Incident Evidence Pack

**Tenant ID:** ${pack.tenantId}
**Generated:** ${new Date(pack.generatedAt).toLocaleString()}

---

## Tenant Metadata

- **Slug:** ${pack.tenantMetadata.slug}
- **Name:** ${pack.tenantMetadata.name}
- **Status:** ${pack.tenantMetadata.isActive ? 'Active' : 'Inactive'}
- **Created:** ${new Date(pack.tenantMetadata.createdAt).toLocaleString()}

## Billing Account

- **Email:** ${pack.billingAccount.email}
- **Status:** ${pack.billingAccount.status}
- **Stripe Customer ID:** ${pack.billingAccount.stripeCustomerId || 'N/A'}
- **Created:** ${new Date(pack.billingAccount.createdAt).toLocaleString()}

## Subscription Timeline

${pack.subscriptionTimeline.length > 0 ? pack.subscriptionTimeline.map((s) => `
### ${s.planName} (${s.status})

- **Plan ID:** ${s.planId}
- **Period:** ${new Date(s.currentPeriodStart).toLocaleDateString()} - ${new Date(s.currentPeriodEnd).toLocaleDateString()}
- **Created:** ${new Date(s.createdAt).toLocaleString()}
`).join('\n') : 'No subscriptions found'}

## Stripe Events (Last 100)

${pack.stripeEvents.length > 0 ? pack.stripeEvents.map((e) => `
- **${e.type}** (${e.status}) - ${new Date(e.receivedAt).toLocaleString()}${e.error ? `\n  Error: ${e.error}` : ''}
`).join('\n') : 'No Stripe events found'}

## Usage Aggregates (Last 90 Days)

${pack.usageAggregates.length > 0 ? pack.usageAggregates.slice(0, 20).map((u) => `
- **${u.date}** - ${u.eventType}: ${u.totalQuantity} (${u.eventCount} events)
`).join('\n') : 'No usage data found'}

---

*This evidence pack was generated automatically. Contains sanitized data only - no raw payloads or secrets.*
`;

  const mdPath = join(outputDir, `billing-evidence-${pack.tenantId}.md`);
  await writeFile(mdPath, markdown, 'utf-8');

  return jsonPath;
}

async function main() {
  const args = process.argv.slice(2);
  const tenantIndex = args.indexOf('--tenant');
  
  if (tenantIndex === -1 || !args[tenantIndex + 1]) {
    console.error('Usage: npm run ops:billing:evidence --tenant <tenant-id>');
    process.exit(1);
  }

  const tenantId = args[tenantIndex + 1];

  try {
    console.log(`📦 Generating billing evidence pack for tenant ${tenantId}...\n`);

    const pack = await generateEvidencePack(tenantId);
    const outputDir = join(process.cwd(), 'ops', 'packs', 'billing-evidence');
    const jsonPath = await saveEvidencePack(pack, outputDir);

    console.log('✅ Evidence pack generated successfully!');
    console.log(`📄 JSON: ${jsonPath}`);
    console.log(`📄 Markdown: ${jsonPath.replace('.json', '.md')}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Stripe Events: ${pack.stripeEvents.length}`);
    console.log(`   - Subscriptions: ${pack.subscriptionTimeline.length}`);
    console.log(`   - Usage Aggregates: ${pack.usageAggregates.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to generate evidence pack:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
