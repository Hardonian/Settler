"use strict";
/**
 * Founder Daily Report Generator
 *
 * Generates comprehensive daily operational reports for solo operators.
 * Includes growth, activation funnel, usage, revenue, billing health, risk, and support metrics.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDailyReport = generateDailyReport;
exports.formatDailyReportMarkdown = formatDailyReportMarkdown;
exports.saveDailyReport = saveDailyReport;
const client_1 = require("@prisma/client");
const promises_1 = require("fs/promises");
const path_1 = require("path");
// Import cost baselines - handle both relative and absolute paths
let COST_BASELINES;
try {
    COST_BASELINES = require('../../../../ops/cost_baselines').COST_BASELINES;
}
catch {
    try {
        COST_BASELINES = require((0, path_1.join)(process.cwd(), 'ops', 'cost_baselines')).COST_BASELINES;
    }
    catch {
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
const prisma = new client_1.PrismaClient();
async function generateDailyReport() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    // Growth metrics
    const newSignups = await prisma.billingAccount.count({
        where: {
            createdAt: {
                gte: yesterdayStart,
                lt: todayStart,
            },
        },
    });
    const newTenants = await prisma.tenant.count({
        where: {
            createdAt: {
                gte: yesterdayStart,
                lt: todayStart,
            },
        },
    });
    // Activation metrics (using UsageEvent if eventType exists, otherwise estimate from other tables)
    const connectedProviderEvents = await prisma.usageEvent.count({
        where: {
            eventType: 'provider.connected',
            timestamp: {
                gte: yesterdayStart,
                lt: todayStart,
            },
        },
    });
    const firstReconEvents = await prisma.usageEvent.count({
        where: {
            eventType: 'recon.first_run',
            timestamp: {
                gte: yesterdayStart,
                lt: todayStart,
            },
        },
    });
    // Activation funnel (estimate from existing data)
    const signupCount = newSignups;
    const connectCount = await prisma.ingestionSource.count({
        where: {
            createdAt: {
                gte: yesterdayStart,
                lt: todayStart,
            },
            status: 'active',
        },
    });
    const firstReconciliationCount = await prisma.reconciliationRun.count({
        where: {
            createdAt: {
                gte: yesterdayStart,
                lt: todayStart,
            },
            status: 'completed',
        },
    });
    const firstExceptionResolvedCount = await prisma.reconciliationMatch.count({
        where: {
            reviewed: true,
            reviewedAt: {
                gte: yesterdayStart,
                lt: todayStart,
            },
            matchType: {
                not: 'unmatched',
            },
        },
    });
    // Usage metrics
    const dailyTransactions = await prisma.normalizedTransaction.count({
        where: {
            createdAt: {
                gte: yesterdayStart,
                lt: todayStart,
            },
        },
    });
    const dailyReceipts = await prisma.receipt.count({
        where: {
            createdAt: {
                gte: yesterdayStart,
                lt: todayStart,
            },
        },
    });
    const dailyApiCalls = await prisma.usageEvent.count({
        where: {
            timestamp: {
                gte: yesterdayStart,
                lt: todayStart,
            },
            eventType: {
                in: ['api_request', 'webhook_event', 'db_query'],
            },
        },
    });
    const last7DaysTransactions = await prisma.normalizedTransaction.count({
        where: {
            createdAt: {
                gte: sevenDaysAgo,
                lt: todayStart,
            },
        },
    });
    const last7DaysReceipts = await prisma.receipt.count({
        where: {
            createdAt: {
                gte: sevenDaysAgo,
                lt: todayStart,
            },
        },
    });
    const last7DaysApiCalls = await prisma.usageEvent.count({
        where: {
            timestamp: {
                gte: sevenDaysAgo,
                lt: todayStart,
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
        include: {
            billingAccount: {
                include: {
                    tenant: true,
                },
            },
        },
    });
    // Calculate MRR (simplified - would need actual plan pricing)
    const mrr = activeSubscriptions.length * 50; // Placeholder - should query plan pricing
    // Usage revenue from UsageAggregateDaily
    const usageAggregates = await prisma.usageAggregateDaily.findMany({
        where: {
            date: {
                gte: yesterdayStart,
                lt: todayStart,
            },
            estimatedCost: {
                not: null,
            },
        },
    });
    const usageRevenue = usageAggregates.reduce((sum, agg) => sum + Number(agg.estimatedCost || 0), 0);
    // Top tenants by revenue (simplified)
    const topTenantsByRevenue = await prisma.billingAccount.findMany({
        where: {
            subscriptions: {
                some: {
                    status: 'active',
                },
            },
        },
        include: {
            tenant: true,
            subscriptions: true,
        },
        take: 10,
        orderBy: {
            createdAt: 'desc',
        },
    });
    // Top tenants by usage
    const tenantUsage = await prisma.usageAggregateDaily.groupBy({
        by: ['tenantId'],
        where: {
            date: {
                gte: sevenDaysAgo,
                lt: todayStart,
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
                gte: yesterdayStart,
                lt: todayStart,
            },
            status: 'processed',
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
                gte: yesterdayStart,
                lt: todayStart,
            },
        },
    });
    const chargebacks = await prisma.stripeEvent.count({
        where: {
            type: 'charge.dispute.created',
            receivedAt: {
                gte: yesterdayStart,
                lt: todayStart,
            },
        },
    });
    // Risk metrics
    const errorSpikes = await prisma.reconResult.count({
        where: {
            status: 'failed',
            startedAt: {
                gte: yesterdayStart,
                lt: todayStart,
            },
        },
    });
    const reconciliationMismatches = await prisma.reconciliationMatch.count({
        where: {
            matchType: 'unmatched',
            createdAt: {
                gte: yesterdayStart,
                lt: todayStart,
            },
        },
    });
    const totalMatches = await prisma.reconciliationMatch.count({
        where: {
            createdAt: {
                gte: yesterdayStart,
                lt: todayStart,
            },
        },
    });
    const reconciliationMismatchRate = totalMatches > 0 ? reconciliationMismatches / totalMatches : 0;
    const exceptions = await prisma.driftEvent.count({
        where: {
            createdAt: {
                gte: yesterdayStart,
                lt: todayStart,
            },
        },
    });
    const totalReconRuns = await prisma.reconciliationRun.count({
        where: {
            startedAt: {
                gte: yesterdayStart,
                lt: todayStart,
            },
        },
    });
    const exceptionRate = totalReconRuns > 0 ? exceptions / totalReconRuns : 0;
    // Support metrics (using error queue as proxy)
    const errorQueueCount = await prisma.reconResult.count({
        where: {
            status: 'failed',
            errorMessage: {
                not: null,
            },
            startedAt: {
                gte: sevenDaysAgo,
            },
        },
    });
    // Cost proxy
    const estimatedInfraBaseline = (dailyApiCalls * COST_BASELINES.vercel.serverlessRequest.costPerUnit) +
        (dailyTransactions * COST_BASELINES.supabase.query.costPerUnit) +
        (dailyReceipts * COST_BASELINES.storage.artifactGb.costPerUnit * 0.001); // Rough estimate
    const revenue = mrr / 30 + usageRevenue; // Daily revenue estimate
    const dateStr = yesterdayStart.toISOString().split('T')[0];
    if (!dateStr) {
        throw new Error('Failed to format date');
    }
    const report = {
        date: dateStr,
        period: {
            start: yesterdayStart.toISOString(),
            end: todayStart.toISOString(),
        },
        growth: {
            newSignups,
            newTenants,
            activations: {
                connectedProvider: connectedProviderEvents,
                firstRecon: firstReconEvents,
            },
        },
        activationFunnel: {
            signup: signupCount,
            connect: connectCount,
            firstReconciliation: firstReconciliationCount,
            firstExceptionResolved: firstExceptionResolvedCount,
        },
        usage: {
            daily: {
                transactionsProcessed: dailyTransactions,
                receiptsProcessed: dailyReceipts,
                apiCalls: dailyApiCalls,
            },
            last7Days: {
                transactionsProcessed: last7DaysTransactions,
                receiptsProcessed: last7DaysReceipts,
                apiCalls: last7DaysApiCalls,
            },
        },
        revenue: {
            mrr,
            usageRevenue,
            topTenantsByRevenue: topTenantsByRevenue
                .filter((t) => t.tenantId)
                .map((t) => ({
                tenantId: t.tenantId,
                revenue: mrr / activeSubscriptions.length, // Simplified
            })),
            topTenantsByUsage: tenantUsage
                .filter((t) => t.tenantId)
                .map((t) => ({
                tenantId: t.tenantId,
                usage: Number(t._sum.totalQuantity || 0),
            })),
            failedPayments,
        },
        billingHealth: {
            pastDue,
            unpaid,
            webhookFailures,
            chargebacks,
        },
        risk: {
            errorSpikes,
            webhookFailures,
            reconciliationMismatchRate,
            exceptionRate,
        },
        support: {
            openIncidents: 0, // Placeholder - would integrate with ticketing system
            errorQueueCount,
        },
        costProxy: {
            estimatedInfraBaseline,
            revenue,
            margin: revenue - estimatedInfraBaseline,
        },
    };
    return report;
}
async function formatDailyReportMarkdown(report) {
    const markdown = `# Founder Daily Report

**Date:** ${report.date}
**Period:** ${new Date(report.period.start).toLocaleString()} - ${new Date(report.period.end).toLocaleString()}
**Generated:** ${new Date().toISOString()}

---

## 📈 Growth Metrics

- **New Signups:** ${report.growth.newSignups}
- **New Tenants:** ${report.growth.newTenants}
- **Provider Connections:** ${report.growth.activations.connectedProvider}
- **First Reconciliations:** ${report.growth.activations.firstRecon}

## 🎯 Activation Funnel

- **Signups:** ${report.activationFunnel.signup}
- **Connected Provider:** ${report.activationFunnel.connect}
- **First Reconciliation:** ${report.activationFunnel.firstReconciliation}
- **First Exception Resolved:** ${report.activationFunnel.firstExceptionResolved}

**Conversion Rates:**
- Signup → Connect: ${report.activationFunnel.signup > 0 ? ((report.activationFunnel.connect / report.activationFunnel.signup) * 100).toFixed(1) : 0}%
- Connect → First Recon: ${report.activationFunnel.connect > 0 ? ((report.activationFunnel.firstReconciliation / report.activationFunnel.connect) * 100).toFixed(1) : 0}%
- First Recon → Exception Resolved: ${report.activationFunnel.firstReconciliation > 0 ? ((report.activationFunnel.firstExceptionResolved / report.activationFunnel.firstReconciliation) * 100).toFixed(1) : 0}%

## 📊 Usage Metrics

### Daily (${report.date})
- **Transactions Processed:** ${report.usage.daily.transactionsProcessed.toLocaleString()}
- **Receipts Processed:** ${report.usage.daily.receiptsProcessed.toLocaleString()}
- **API Calls:** ${report.usage.daily.apiCalls.toLocaleString()}

### Last 7 Days
- **Transactions Processed:** ${report.usage.last7Days.transactionsProcessed.toLocaleString()}
- **Receipts Processed:** ${report.usage.last7Days.receiptsProcessed.toLocaleString()}
- **API Calls:** ${report.usage.last7Days.apiCalls.toLocaleString()}

## 💰 Revenue Metrics

- **MRR:** $${report.revenue.mrr.toLocaleString()}
- **Usage Revenue (Daily):** $${report.revenue.usageRevenue.toFixed(2)}
- **Failed Payments:** ${report.revenue.failedPayments}

### Top Tenants by Revenue
${report.revenue.topTenantsByRevenue.length > 0 ? report.revenue.topTenantsByRevenue.map((t, i) => `${i + 1}. Tenant ${t.tenantId}: $${t.revenue.toFixed(2)}`).join('\n') : 'No data available'}

### Top Tenants by Usage
${report.revenue.topTenantsByUsage.length > 0 ? report.revenue.topTenantsByUsage.map((t, i) => `${i + 1}. Tenant ${t.tenantId}: ${t.usage.toLocaleString()} units`).join('\n') : 'No data available'}

## 💳 Billing Health

- **Past Due Subscriptions:** ${report.billingHealth.pastDue}
- **Unpaid Subscriptions:** ${report.billingHealth.unpaid}
- **Webhook Failures:** ${report.billingHealth.webhookFailures}
- **Chargebacks:** ${report.billingHealth.chargebacks}

${report.billingHealth.pastDue > 0 || report.billingHealth.unpaid > 0 ? '⚠️ **Action Required:** Review past due/unpaid subscriptions' : '✅ All subscriptions in good standing'}

## ⚠️ Risk Indicators

- **Error Spikes:** ${report.risk.errorSpikes}
- **Webhook Failures:** ${report.risk.webhookFailures}
- **Reconciliation Mismatch Rate:** ${(report.risk.reconciliationMismatchRate * 100).toFixed(2)}%
- **Exception Rate:** ${(report.risk.exceptionRate * 100).toFixed(2)}%

${report.risk.errorSpikes > 10 || report.risk.reconciliationMismatchRate > 0.1 ? '🚨 **High Risk:** Investigate error spikes and reconciliation issues' : '✅ Risk levels within acceptable range'}

## 🎧 Support Signals

- **Open Incidents:** ${report.support.openIncidents}
- **Error Queue Count:** ${report.support.errorQueueCount}

${report.support.errorQueueCount > 50 ? '⚠️ **Action Required:** High error queue - review failed reconciliations' : '✅ Support queue manageable'}

## 💵 Cost Proxy

- **Estimated Infrastructure Baseline (Daily):** $${report.costProxy.estimatedInfraBaseline.toFixed(2)}
- **Revenue (Daily):** $${report.costProxy.revenue.toFixed(2)}
- **Margin:** $${report.costProxy.margin.toFixed(2)} (${report.costProxy.revenue > 0 ? ((report.costProxy.margin / report.costProxy.revenue) * 100).toFixed(1) : 0}%)

${report.costProxy.margin < 0 ? '🚨 **Negative Margin:** Revenue below infrastructure costs' : report.costProxy.margin < report.costProxy.revenue * 0.2 ? '⚠️ **Low Margin:** Consider cost optimization' : '✅ Healthy margin'}

---

*Report generated automatically by Settler Ops Autopilot*
`;
    return markdown;
}
async function saveDailyReport(report, markdown) {
    const reportsDir = (0, path_1.join)(process.cwd(), 'ops', 'reports');
    await (0, promises_1.mkdir)(reportsDir, { recursive: true });
    const reportPath = (0, path_1.join)(reportsDir, 'FOUNDERS_DAILY_REPORT.md');
    await (0, promises_1.writeFile)(reportPath, markdown, 'utf-8');
    // Also save JSON for programmatic access
    const jsonPath = (0, path_1.join)(reportsDir, 'FOUNDERS_DAILY_REPORT.json');
    await (0, promises_1.writeFile)(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
    return reportPath;
}
//# sourceMappingURL=daily-report.js.map