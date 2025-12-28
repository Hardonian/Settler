/**
 * Founder Weekly Report Generator
 * 
 * Generates comprehensive weekly operational reports aggregating daily metrics.
 */

import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Import cost baselines - handle both relative and absolute paths
let COST_BASELINES: any;
try {
  COST_BASELINES = require('../../../../ops/cost_baselines').COST_BASELINES;
} catch {
  try {
    COST_BASELINES = require(join(process.cwd(), 'ops', 'cost_baselines')).COST_BASELINES;
  } catch {
    // Fallback if cost baselines not found
    COST_BASELINES = {
      vercel: {
        serverlessRequest: { costPerUnit: 0.0000002 },
      },
      supabase: {
        query: { costPerUnit: 0.000001 },
      },
      storage: {
        artifactGb: { costPerUnit: 0.023 },
      },
    };
  }
}

const prisma = new PrismaClient();

interface WeeklyReport {
  weekStart: string; // Format: YYYY-MM-DD
  weekEnd: string; // Format: YYYY-MM-DD
  generatedAt: string;
  growth: {
    newSignups: number;
    newTenants: number;
    activations: {
      connectedProvider: number;
      firstRecon: number;
    };
    weekOverWeekGrowth: {
      signups: number;
      tenants: number;
    };
  };
  activationFunnel: {
    signup: number;
    connect: number;
    firstReconciliation: number;
    firstExceptionResolved: number;
    conversionRates: {
      signupToConnect: number;
      connectToRecon: number;
      reconToResolved: number;
    };
  };
  usage: {
    transactionsProcessed: number;
    receiptsProcessed: number;
    apiCalls: number;
    averageDaily: {
      transactions: number;
      receipts: number;
      apiCalls: number;
    };
  };
  revenue: {
    mrr: number;
    usageRevenue: number;
    topTenantsByRevenue: Array<{ tenantId: string; revenue: number }>;
    topTenantsByUsage: Array<{ tenantId: string; usage: number }>;
    failedPayments: number;
    weekOverWeekRevenue: number;
  };
  billingHealth: {
    pastDue: number;
    unpaid: number;
    webhookFailures: number;
    chargebacks: number;
    churnRate: number;
  };
  risk: {
    errorSpikes: number;
    webhookFailures: number;
    reconciliationMismatchRate: number;
    exceptionRate: number;
    trends: {
      errorsTrending: 'up' | 'down' | 'stable';
      mismatchTrending: 'up' | 'down' | 'stable';
    };
  };
  support: {
    openIncidents: number;
    errorQueueCount: number;
    averageResolutionTime: number; // Placeholder
  };
  costProxy: {
    estimatedInfraBaseline: number;
    revenue: number;
    margin: number;
    marginPercentage: number;
  };
  recommendations: string[];
}

export async function generateWeeklyReport(): Promise<WeeklyReport> {
  const now = new Date();
  const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekStart.getDate() - 7);
  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekEnd = new Date(weekStart);

  // Aggregate weekly metrics
  const newSignups = await prisma.billingAccount.count({
    where: {
      createdAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  const previousWeekSignups = await prisma.billingAccount.count({
    where: {
      createdAt: {
        gte: previousWeekStart,
        lt: previousWeekEnd,
      },
    },
  });

  const newTenants = await prisma.tenant.count({
    where: {
      createdAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  const previousWeekTenants = await prisma.tenant.count({
    where: {
      createdAt: {
        gte: previousWeekStart,
        lt: previousWeekEnd,
      },
    },
  });

  const connectedProviderEvents = await prisma.usageEvent.count({
    where: {
      eventType: 'provider.connected',
      timestamp: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  const firstReconEvents = await prisma.usageEvent.count({
    where: {
      eventType: 'recon.first_run',
      timestamp: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  // Activation funnel
  const signupCount = newSignups;
  const connectCount = await prisma.ingestionSource.count({
    where: {
      createdAt: {
        gte: weekStart,
        lt: weekEnd,
      },
      status: 'active',
    },
  });
  const firstReconciliationCount = await prisma.reconciliationRun.count({
    where: {
      createdAt: {
        gte: weekStart,
        lt: weekEnd,
      },
      status: 'completed',
    },
  });
  const firstExceptionResolvedCount = await prisma.reconciliationMatch.count({
    where: {
      reviewed: true,
      reviewedAt: {
        gte: weekStart,
        lt: weekEnd,
      },
      matchType: {
        not: 'unmatched',
      },
    },
  });

  const conversionRates = {
    signupToConnect: signupCount > 0 ? (connectCount / signupCount) * 100 : 0,
    connectToRecon: connectCount > 0 ? (firstReconciliationCount / connectCount) * 100 : 0,
    reconToResolved: firstReconciliationCount > 0 ? (firstExceptionResolvedCount / firstReconciliationCount) * 100 : 0,
  };

  // Usage metrics
  const transactionsProcessed = await prisma.normalizedTransaction.count({
    where: {
      createdAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  const receiptsProcessed = await prisma.receipt.count({
    where: {
      createdAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  const apiCalls = await prisma.usageEvent.count({
    where: {
      timestamp: {
        gte: weekStart,
        lt: weekEnd,
      },
      eventType: {
        in: ['api_request', 'webhook_event', 'db_query'],
      },
    },
  });

  // Revenue metrics
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'active',
    },
  });

  const mrr = activeSubscriptions.length * 50; // Placeholder

  const usageAggregates = await prisma.usageAggregateDaily.findMany({
    where: {
      date: {
        gte: weekStart,
        lt: weekEnd,
      },
      estimatedCost: {
        not: null,
      },
    },
  });

  const usageRevenue = usageAggregates.reduce(
    (sum, agg) => sum + Number(agg.estimatedCost || 0),
    0
  );

  const previousWeekUsageRevenue = await prisma.usageAggregateDaily.findMany({
    where: {
      date: {
        gte: previousWeekStart,
        lt: previousWeekEnd,
      },
      estimatedCost: {
        not: null,
      },
    },
  });

  const previousWeekRevenue = previousWeekUsageRevenue.reduce(
    (sum, agg) => sum + Number(agg.estimatedCost || 0),
    0
  );

  const weekOverWeekRevenue = usageRevenue - previousWeekRevenue;

  const tenantUsage = await prisma.usageAggregateDaily.groupBy({
    by: ['tenantId'],
    where: {
      date: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    _sum: {
      totalQuantity: true,
    },
    orderBy: {
      _sum: {
        totalQuantity: 'desc',
      },
    },
    take: 10,
  });

  const failedPayments = await prisma.stripeEvent.count({
    where: {
      type: {
        in: ['payment_intent.payment_failed', 'invoice.payment_failed'],
      },
      receivedAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  // Billing health
  const pastDue = await prisma.subscription.count({
    where: {
      status: 'past_due',
    },
  });

  const unpaid = await prisma.subscription.count({
    where: {
      status: {
        in: ['past_due', 'unpaid'],
      },
    },
  });

  const webhookFailures = await prisma.stripeEvent.count({
    where: {
      status: 'failed',
      receivedAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  const chargebacks = await prisma.stripeEvent.count({
    where: {
      type: 'charge.dispute.created',
      receivedAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  // Churn rate (simplified - count cancelled subscriptions)
  const cancelledThisWeek = await prisma.subscription.count({
    where: {
      cancelledAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  const churnRate = activeSubscriptions.length > 0 ? (cancelledThisWeek / activeSubscriptions.length) * 100 : 0;

  // Risk metrics
  const errorSpikes = await prisma.reconResult.count({
    where: {
      status: 'failed',
      startedAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  const previousWeekErrors = await prisma.reconResult.count({
    where: {
      status: 'failed',
      startedAt: {
        gte: previousWeekStart,
        lt: previousWeekEnd,
      },
    },
  });

  const errorsTrending = errorSpikes > previousWeekErrors * 1.1 ? 'up' : errorSpikes < previousWeekErrors * 0.9 ? 'down' : 'stable';

  const reconciliationMismatches = await prisma.reconciliationMatch.count({
    where: {
      matchType: 'unmatched',
      createdAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  const totalMatches = await prisma.reconciliationMatch.count({
    where: {
      createdAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  const reconciliationMismatchRate = totalMatches > 0 ? reconciliationMismatches / totalMatches : 0;

  const previousWeekMismatches = await prisma.reconciliationMatch.count({
    where: {
      matchType: 'unmatched',
      createdAt: {
        gte: previousWeekStart,
        lt: previousWeekEnd,
      },
    },
  });

  const previousWeekTotalMatches = await prisma.reconciliationMatch.count({
    where: {
      createdAt: {
        gte: previousWeekStart,
        lt: previousWeekEnd,
      },
    },
  });

  const previousWeekMismatchRate = previousWeekTotalMatches > 0 ? previousWeekMismatches / previousWeekTotalMatches : 0;

  const mismatchTrending = reconciliationMismatchRate > previousWeekMismatchRate * 1.1 ? 'up' : reconciliationMismatchRate < previousWeekMismatchRate * 0.9 ? 'down' : 'stable';

  const exceptions = await prisma.driftEvent.count({
    where: {
      createdAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  const totalReconRuns = await prisma.reconciliationRun.count({
    where: {
      startedAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  const exceptionRate = totalReconRuns > 0 ? exceptions / totalReconRuns : 0;

  // Support metrics
  const errorQueueCount = await prisma.reconResult.count({
    where: {
      status: 'failed',
      errorMessage: {
        not: null,
      },
      startedAt: {
        gte: weekStart,
      },
    },
  });

  // Cost proxy
  const estimatedInfraBaseline =
    (apiCalls * COST_BASELINES.vercel.serverlessRequest.costPerUnit) +
    (transactionsProcessed * COST_BASELINES.supabase.query.costPerUnit) +
    (receiptsProcessed * COST_BASELINES.storage.artifactGb.costPerUnit * 0.001);

  const revenue = (mrr / 4) + usageRevenue; // Weekly revenue estimate
  const margin = revenue - estimatedInfraBaseline;
  const marginPercentage = revenue > 0 ? (margin / revenue) * 100 : 0;

  // Generate recommendations
  const recommendations: string[] = [];
  if (churnRate > 5) {
    recommendations.push('High churn rate detected - investigate cancellation reasons and improve retention');
  }
  if (reconciliationMismatchRate > 0.1) {
    recommendations.push('High reconciliation mismatch rate - review matching algorithms and data quality');
  }
  if (errorSpikes > 50) {
    recommendations.push('High error rate - investigate root causes and improve error handling');
  }
  if (marginPercentage < 20) {
    recommendations.push('Low margin - optimize infrastructure costs or increase pricing');
  }
  if (conversionRates.signupToConnect < 30) {
    recommendations.push('Low signup-to-connect conversion - improve onboarding flow');
  }
  if (failedPayments > 10) {
    recommendations.push('High failed payment rate - review payment processing and retry logic');
  }

  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  if (!weekStartStr || !weekEndStr) {
    throw new Error('Failed to format dates');
  }

  const report: WeeklyReport = {
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    generatedAt: new Date().toISOString(),
    growth: {
      newSignups,
      newTenants,
      activations: {
        connectedProvider: connectedProviderEvents,
        firstRecon: firstReconEvents,
      },
      weekOverWeekGrowth: {
        signups: newSignups - previousWeekSignups,
        tenants: newTenants - previousWeekTenants,
      },
    },
    activationFunnel: {
      signup: signupCount,
      connect: connectCount,
      firstReconciliation: firstReconciliationCount,
      firstExceptionResolved: firstExceptionResolvedCount,
      conversionRates,
    },
    usage: {
      transactionsProcessed,
      receiptsProcessed,
      apiCalls,
      averageDaily: {
        transactions: transactionsProcessed / 7,
        receipts: receiptsProcessed / 7,
        apiCalls: apiCalls / 7,
      },
    },
    revenue: {
      mrr,
      usageRevenue,
      topTenantsByRevenue: [], // Simplified for now
      topTenantsByUsage: tenantUsage
        .filter((t) => t.tenantId)
        .map((t) => ({
          tenantId: t.tenantId as string,
          usage: Number(t._sum.totalQuantity || 0),
        })),
      failedPayments,
      weekOverWeekRevenue,
    },
    billingHealth: {
      pastDue,
      unpaid,
      webhookFailures,
      chargebacks,
      churnRate,
    },
    risk: {
      errorSpikes,
      webhookFailures,
      reconciliationMismatchRate,
      exceptionRate,
      trends: {
        errorsTrending,
        mismatchTrending,
      },
    },
    support: {
      openIncidents: 0,
      errorQueueCount,
      averageResolutionTime: 0, // Placeholder
    },
    costProxy: {
      estimatedInfraBaseline,
      revenue,
      margin,
      marginPercentage,
    },
    recommendations,
  };

  return report;
}

export async function formatWeeklyReportMarkdown(report: WeeklyReport): Promise<string> {
  const markdown = `# Founder Weekly Report

**Week:** ${report.weekStart} to ${report.weekEnd}
**Generated:** ${new Date(report.generatedAt).toLocaleString()}

---

## 📈 Growth Metrics

- **New Signups:** ${report.growth.newSignups} (${report.growth.weekOverWeekGrowth.signups >= 0 ? '+' : ''}${report.growth.weekOverWeekGrowth.signups} WoW)
- **New Tenants:** ${report.growth.newTenants} (${report.growth.weekOverWeekGrowth.tenants >= 0 ? '+' : ''}${report.growth.weekOverWeekGrowth.tenants} WoW)
- **Provider Connections:** ${report.growth.activations.connectedProvider}
- **First Reconciliations:** ${report.growth.activations.firstRecon}

## 🎯 Activation Funnel

- **Signups:** ${report.activationFunnel.signup}
- **Connected Provider:** ${report.activationFunnel.connect}
- **First Reconciliation:** ${report.activationFunnel.firstReconciliation}
- **First Exception Resolved:** ${report.activationFunnel.firstExceptionResolved}

**Conversion Rates:**
- Signup → Connect: ${report.activationFunnel.conversionRates.signupToConnect.toFixed(1)}%
- Connect → First Recon: ${report.activationFunnel.conversionRates.connectToRecon.toFixed(1)}%
- First Recon → Exception Resolved: ${report.activationFunnel.conversionRates.reconToResolved.toFixed(1)}%

## 📊 Usage Metrics

### Weekly Totals
- **Transactions Processed:** ${report.usage.transactionsProcessed.toLocaleString()}
- **Receipts Processed:** ${report.usage.receiptsProcessed.toLocaleString()}
- **API Calls:** ${report.usage.apiCalls.toLocaleString()}

### Daily Averages
- **Transactions:** ${report.usage.averageDaily.transactions.toFixed(0)}
- **Receipts:** ${report.usage.averageDaily.receipts.toFixed(0)}
- **API Calls:** ${report.usage.averageDaily.apiCalls.toFixed(0)}

## 💰 Revenue Metrics

- **MRR:** $${report.revenue.mrr.toLocaleString()}
- **Usage Revenue (Weekly):** $${report.revenue.usageRevenue.toFixed(2)}
- **Week-over-Week Revenue Change:** ${report.revenue.weekOverWeekRevenue >= 0 ? '+' : ''}$${report.revenue.weekOverWeekRevenue.toFixed(2)}
- **Failed Payments:** ${report.revenue.failedPayments}

### Top Tenants by Usage
${report.revenue.topTenantsByUsage.length > 0 ? report.revenue.topTenantsByUsage.map((t, i) => `${i + 1}. Tenant ${t.tenantId}: ${t.usage.toLocaleString()} units`).join('\n') : 'No data available'}

## 💳 Billing Health

- **Past Due Subscriptions:** ${report.billingHealth.pastDue}
- **Unpaid Subscriptions:** ${report.billingHealth.unpaid}
- **Webhook Failures:** ${report.billingHealth.webhookFailures}
- **Chargebacks:** ${report.billingHealth.chargebacks}
- **Churn Rate:** ${report.billingHealth.churnRate.toFixed(2)}%

${report.billingHealth.churnRate > 5 ? '🚨 **High Churn:** Investigate cancellation reasons' : report.billingHealth.churnRate > 2 ? '⚠️ **Moderate Churn:** Monitor closely' : '✅ Churn rate within acceptable range'}

## ⚠️ Risk Indicators

- **Error Spikes:** ${report.risk.errorSpikes} (trending ${report.risk.trends.errorsTrending})
- **Webhook Failures:** ${report.risk.webhookFailures}
- **Reconciliation Mismatch Rate:** ${(report.risk.reconciliationMismatchRate * 100).toFixed(2)}% (trending ${report.risk.trends.mismatchTrending})
- **Exception Rate:** ${(report.risk.exceptionRate * 100).toFixed(2)}%

${report.risk.errorSpikes > 50 || report.risk.reconciliationMismatchRate > 0.1 ? '🚨 **High Risk:** Investigate issues immediately' : report.risk.errorSpikes > 20 || report.risk.reconciliationMismatchRate > 0.05 ? '⚠️ **Moderate Risk:** Monitor closely' : '✅ Risk levels within acceptable range'}

## 🎧 Support Signals

- **Open Incidents:** ${report.support.openIncidents}
- **Error Queue Count:** ${report.support.errorQueueCount}
- **Average Resolution Time:** ${report.support.averageResolutionTime > 0 ? `${report.support.averageResolutionTime} hours` : 'N/A'}

${report.support.errorQueueCount > 100 ? '🚨 **High Support Load:** Prioritize error resolution' : report.support.errorQueueCount > 50 ? '⚠️ **Moderate Support Load:** Monitor queue' : '✅ Support queue manageable'}

## 💵 Cost Proxy

- **Estimated Infrastructure Baseline (Weekly):** $${report.costProxy.estimatedInfraBaseline.toFixed(2)}
- **Revenue (Weekly):** $${report.costProxy.revenue.toFixed(2)}
- **Margin:** $${report.costProxy.margin.toFixed(2)} (${report.costProxy.marginPercentage.toFixed(1)}%)

${report.costProxy.marginPercentage < 0 ? '🚨 **Negative Margin:** Revenue below infrastructure costs' : report.costProxy.marginPercentage < 20 ? '⚠️ **Low Margin:** Consider cost optimization' : '✅ Healthy margin'}

## 💡 Recommendations

${report.recommendations.length > 0 ? report.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n') : 'No urgent recommendations. System operating normally.'}

---

*Report generated automatically by Settler Ops Autopilot*
`;

  return markdown;
}

export async function saveWeeklyReport(report: WeeklyReport, markdown: string): Promise<string> {
  const reportsDir = join(process.cwd(), 'ops', 'reports');
  await mkdir(reportsDir, { recursive: true });

  const reportPath = join(reportsDir, 'FOUNDERS_WEEKLY_REPORT.md');
  await writeFile(reportPath, markdown, 'utf-8');

  // Also save JSON for programmatic access
  const jsonPath = join(reportsDir, 'FOUNDERS_WEEKLY_REPORT.json');
  await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf-8');

  return reportPath;
}
