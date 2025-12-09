/**
 * FinTech Module - Ledger Reconciliation
 *
 * Part of Phase IV: Vertical Modules
 */
import { PrismaClient } from '@prisma/client';
export interface LedgerEntry {
    id: string;
    date: Date;
    account: string;
    debit: number;
    credit: number;
    description: string;
    reference?: string;
}
export interface LedgerReconResult {
    matched: Array<{
        source: LedgerEntry;
        target: LedgerEntry;
        confidence: number;
    }>;
    unmatchedSource: LedgerEntry[];
    unmatchedTarget: LedgerEntry[];
    balanceDrift: number;
}
export declare class LedgerReconService {
    private _prisma;
    constructor(prisma: PrismaClient);
    /**
     * Reconcile ledger entries
     */
    reconcileLedgers(tenantId: string, sourceEntries: LedgerEntry[], targetEntries: LedgerEntry[]): Promise<LedgerReconResult>;
    /**
     * Detect accounting drift
     */
    detectAccountingDrift(_tenantId: string, expectedBalance: number, actualBalance: number): Promise<{
        drift: number;
        percentage: number;
        severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
}
//# sourceMappingURL=ledger-recon.d.ts.map