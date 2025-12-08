/**
 * Enhanced Stripe Adapter
 *
 * Implements webhook ingestion, API polling, and comprehensive normalization
 * as specified in the Product & Technical Specification.
 */
import { EnhancedAdapter, AdapterConfig, DateRange, NormalizedEvent } from './enhanced-base';
import { Transaction, Settlement, Fee, RefundDispute, RefundDisputeType } from '@settler/types';
export declare class StripeEnhancedAdapter implements EnhancedAdapter {
    name: string;
    version: string;
    private supportedVersions;
    /**
     * Verify webhook signature
     */
    verifyWebhook(payload: string | Buffer, signature: string, secret: string): boolean;
    /**
     * Normalize webhook payload to canonical format
     */
    normalizeWebhook(payload: Record<string, any>, tenantId: string): NormalizedEvent[];
    /**
     * Poll transactions from Stripe API
     */
    pollTransactions(config: AdapterConfig, _dateRange: DateRange): Promise<Transaction[]>;
    /**
     * Poll settlements from Stripe API
     */
    pollSettlements(config: AdapterConfig, _dateRange: DateRange): Promise<Settlement[]>;
    /**
     * Extract fees from transaction payload
     */
    extractFees(transaction: Transaction, tenantId: string): Promise<Fee[]>;
    /**
     * Normalize transaction to canonical format
     */
    normalizeTransaction(raw: Record<string, any>, tenantId: string): Transaction;
    /**
     * Normalize settlement to canonical format
     */
    normalizeSettlement(raw: Record<string, any>, tenantId: string): Settlement;
    /**
     * Normalize refund/dispute
     */
    normalizeRefundDispute(raw: Record<string, any>, tenantId: string, type: RefundDisputeType): RefundDispute;
    /**
     * Handle API version changes
     */
    handleVersionChange(_oldVersion: string, newVersion: string): void;
    /**
     * Map Stripe transaction type to canonical type
     */
    private mapTransactionType;
    /**
     * Map Stripe status to canonical status
     */
    private mapTransactionStatus;
    /**
     * Map Stripe payout status to canonical status
     */
    private mapSettlementStatus;
    /**
     * Map Stripe refund/dispute status to canonical status
     */
    private mapRefundDisputeStatus;
    /**
     * Generate ID
     */
    private generateId;
}
//# sourceMappingURL=stripe-enhanced.d.ts.map