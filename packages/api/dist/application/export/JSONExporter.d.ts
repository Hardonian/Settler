/**
 * JSON Exporter
 *
 * Exports reconciled data to JSON format for programmatic access
 */
import { Transaction, Settlement, Fee, ReconciliationMatch } from '@settler/types';
export interface JSONExportOptions {
    dateRange: {
        start: Date;
        end: Date;
    };
    includeFees: boolean;
    includeUnmatched: boolean;
    includeRawPayloads: boolean;
}
export interface JSONExportResult {
    exportDate: string;
    dateRange: {
        start: string;
        end: string;
    };
    summary: {
        totalMatches: number;
        totalUnmatched: number;
        totalFees: number;
    };
    matches: Array<{
        match: ReconciliationMatch;
        transaction: Transaction;
        settlement: Settlement;
        fees?: Fee[];
    }>;
    unmatched?: Transaction[];
}
export declare class JSONExporter {
    /**
     * Export to JSON format
     */
    exportToJSON(tenantId: string, jobId: string, options: JSONExportOptions): Promise<JSONExportResult>;
}
//# sourceMappingURL=JSONExporter.d.ts.map