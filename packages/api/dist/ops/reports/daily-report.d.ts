/**
 * Founder Daily Report Generator
 *
 * Generates comprehensive daily operational reports for solo operators.
 * Includes growth, activation funnel, usage, revenue, billing health, risk, and support metrics.
 */
interface DailyReport {
    date: string;
    period: {
        start: string;
        end: string;
    };
    growth: {
        newSignups: number;
        newTenants: number;
        activations: {
            connectedProvider: number;
            firstRecon: number;
        };
    };
    activationFunnel: {
        signup: number;
        connect: number;
        firstReconciliation: number;
        firstExceptionResolved: number;
    };
    usage: {
        daily: {
            transactionsProcessed: number;
            receiptsProcessed: number;
            apiCalls: number;
        };
        last7Days: {
            transactionsProcessed: number;
            receiptsProcessed: number;
            apiCalls: number;
        };
    };
    revenue: {
        mrr: number;
        usageRevenue: number;
        topTenantsByRevenue: Array<{
            tenantId: string;
            revenue: number;
        }>;
        topTenantsByUsage: Array<{
            tenantId: string;
            usage: number;
        }>;
        failedPayments: number;
    };
    billingHealth: {
        pastDue: number;
        unpaid: number;
        webhookFailures: number;
        chargebacks: number;
    };
    risk: {
        errorSpikes: number;
        webhookFailures: number;
        reconciliationMismatchRate: number;
        exceptionRate: number;
    };
    support: {
        openIncidents: number;
        errorQueueCount: number;
    };
    costProxy: {
        estimatedInfraBaseline: number;
        revenue: number;
        margin: number;
    };
}
export declare function generateDailyReport(): Promise<DailyReport>;
export declare function formatDailyReportMarkdown(report: DailyReport): Promise<string>;
export declare function saveDailyReport(report: DailyReport, markdown: string): Promise<string>;
export {};
//# sourceMappingURL=daily-report.d.ts.map