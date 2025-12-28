/**
 * Founder Weekly Report Generator
 *
 * Generates comprehensive weekly operational reports aggregating daily metrics.
 */
interface WeeklyReport {
    weekStart: string;
    weekEnd: string;
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
        topTenantsByRevenue: Array<{
            tenantId: string;
            revenue: number;
        }>;
        topTenantsByUsage: Array<{
            tenantId: string;
            usage: number;
        }>;
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
        averageResolutionTime: number;
    };
    costProxy: {
        estimatedInfraBaseline: number;
        revenue: number;
        margin: number;
        marginPercentage: number;
    };
    recommendations: string[];
}
export declare function generateWeeklyReport(): Promise<WeeklyReport>;
export declare function formatWeeklyReportMarkdown(report: WeeklyReport): Promise<string>;
export declare function saveWeeklyReport(report: WeeklyReport, markdown: string): Promise<string>;
export {};
//# sourceMappingURL=weekly-report.d.ts.map