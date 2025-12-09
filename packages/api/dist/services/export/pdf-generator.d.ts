/**
 * PDF Export Service
 * Generates PDF reports for reconciliation data
 */
export interface ReconciliationReportData {
    jobId: string;
    jobName: string;
    summary: {
        matched: number;
        unmatched: number;
        errors: number;
        accuracy: number;
        totalTransactions: number;
    };
    matches: Array<{
        id: string;
        sourceId: string;
        targetId: string;
        amount: number;
        currency: string;
        confidence: number;
        matchedAt: Date;
    }>;
    unmatched: Array<{
        id: string;
        sourceId?: string;
        targetId?: string;
        amount: number;
        currency: string;
        reason: string;
    }>;
    errors: Array<{
        id: string;
        message: string;
        timestamp: Date;
    }>;
    dateRange: {
        start: Date;
        end: Date;
    };
}
export declare class PDFGenerator {
    /**
     * Generate PDF report
     */
    generatePDF(reportData: ReconciliationReportData): Promise<Buffer>;
    /**
     * Fetch reconciliation data for PDF generation
     */
    fetchReportData(jobId: string, userId: string, startDate?: Date, endDate?: Date): Promise<ReconciliationReportData | null>;
}
//# sourceMappingURL=pdf-generator.d.ts.map