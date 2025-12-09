/**
 * Fee Extraction Service
 *
 * Automatically extracts, normalizes, and reports fee components per transaction
 * as specified in the Product & Technical Specification.
 */
import { Transaction, Fee, Money } from '@settler/types';
export interface FeeExtractionResult {
    fees: Fee[];
    totalFees: Money;
    effectiveRate: number;
}
export declare class FeeExtractionService {
    /**
     * Extract fees from a transaction's raw payload
     */
    extractFees(transaction: Transaction, tenantId: string): Promise<FeeExtractionResult>;
    /**
     * Extract Stripe fees
     */
    private extractStripeFees;
    /**
     * Extract PayPal fees
     */
    private extractPayPalFees;
    /**
     * Extract Square fees
     */
    private extractSquareFees;
    /**
     * Extract generic fees (fallback)
     */
    private extractGenericFees;
    /**
     * Calculate FX fee for Stripe
     */
    private calculateFXFee;
    /**
     * Calculate FX fee for PayPal
     */
    private calculatePayPalFXFee;
    /**
     * Calculate fee rate (percentage)
     */
    private calculateRate;
    /**
     * Calculate totals and effective rate
     */
    private calculateTotals;
    /**
     * Generate ID
     */
    private generateId;
}
//# sourceMappingURL=FeeExtractionService.d.ts.map