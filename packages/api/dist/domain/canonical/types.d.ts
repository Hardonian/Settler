/**
 * Canonical Data Model Types
 *
 * These types represent the unified, opinionated schema for all payment data,
 * abstracting provider differences as specified in the Product & Technical Specification.
 */
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'refunded' | 'disputed' | 'failed';
export type TransactionType = 'authorization' | 'capture' | 'refund' | 'chargeback' | 'adjustment';
export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded' | 'disputed';
export type SettlementStatus = 'pending' | 'completed' | 'failed';
export type FeeType = 'processing' | 'fx' | 'chargeback' | 'refund' | 'adjustment' | 'other';
export type RefundDisputeType = 'refund' | 'chargeback' | 'dispute';
export type RefundDisputeStatus = 'pending' | 'completed' | 'reversed' | 'lost';
export type MatchType = '1-to-1' | '1-to-many' | 'many-to-1';
export type ExceptionCategory = 'amount_mismatch' | 'date_mismatch' | 'missing_transaction' | 'missing_settlement' | 'duplicate';
export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ExceptionResolutionStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';
/**
 * Money type - represents an amount with currency
 */
export interface Money {
    value: number;
    currency: string;
}
/**
 * Payment - Logical Payment Intent/Order
 * Represents a business-level payment intent (e.g., an order)
 */
export interface Payment {
    id: string;
    tenantId: string;
    externalId: string;
    amount: Money;
    status: PaymentStatus;
    customerId?: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Transaction - Processor-Level Record
 * Represents a single transaction at the processor level (e.g., a Stripe charge, PayPal payment)
 */
export interface Transaction {
    id: string;
    tenantId: string;
    paymentId?: string;
    provider: string;
    providerTransactionId: string;
    type: TransactionType;
    amount: Money;
    netAmount?: Money;
    status: TransactionStatus;
    rawPayload: Record<string, any>;
    created_at: Date;
    updatedAt: Date;
}
/**
 * Settlement/Payout
 * Represents funds settled to merchant account
 */
export interface Settlement {
    id: string;
    tenantId: string;
    provider: string;
    providerSettlementId: string;
    amount: Money;
    currency: string;
    fxRate?: number;
    settlementDate: Date;
    expectedDate?: Date;
    status: SettlementStatus;
    rawPayload: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Transaction-Settlement Relationship
 * Links transactions to settlements (many-to-many)
 */
export interface TransactionSettlement {
    id: string;
    tenantId: string;
    transactionId: string;
    settlementId: string;
    amount: Money;
    createdAt: Date;
}
/**
 * Fee
 * Represents a fee component (processing fee, FX fee, chargeback fee, etc.)
 */
export interface Fee {
    id: string;
    tenantId: string;
    transactionId?: string;
    settlementId?: string;
    type: FeeType;
    amount: Money;
    description?: string;
    rate?: number;
    rawPayload: Record<string, any>;
    createdAt: Date;
}
/**
 * FX Rate and Conversion
 * Tracks currency conversions and FX rates
 */
export interface FXConversion {
    id: string;
    tenantId: string;
    transactionId?: string;
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    toAmount: number;
    fxRate: number;
    provider?: string;
    rateDate: Date;
    createdAt: Date;
}
/**
 * Refund & Chargeback/Dispute
 * Tracks refunds and disputes separately from transactions
 */
export interface RefundDispute {
    id: string;
    tenantId: string;
    transactionId: string;
    type: RefundDisputeType;
    amount: Money;
    status: RefundDisputeStatus;
    reason?: string;
    providerRefundId?: string;
    providerDisputeId?: string;
    rawPayload: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Reconciliation Match
 * Represents a match between transaction and settlement
 */
export interface ReconciliationMatch {
    id: string;
    tenantId: string;
    executionId?: string;
    jobId?: string;
    transactionId?: string;
    settlementId?: string;
    matchType: MatchType;
    confidenceScore: number;
    matchingRules: Record<string, any>;
    matchedAt: Date;
    createdAt: Date;
}
/**
 * Exception
 * Represents an exception requiring manual review
 */
export interface Exception {
    id: string;
    tenantId: string;
    executionId?: string;
    jobId?: string;
    transactionId?: string;
    settlementId?: string;
    category: ExceptionCategory;
    severity: ExceptionSeverity;
    description: string;
    resolutionStatus: ExceptionResolutionStatus;
    resolvedBy?: string;
    resolvedAt?: Date;
    resolutionNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Matching Rules Configuration
 */
export interface MatchingRule {
    field: string;
    type: 'exact' | 'fuzzy' | 'range';
    tolerance?: {
        amount?: number;
        days?: number;
    };
    threshold?: number;
}
export interface MatchingRulesConfig {
    strategies: MatchingRule[];
    priority: 'exact-first' | 'fuzzy-first' | 'custom';
    conflictResolution?: 'first-wins' | 'last-wins' | 'manual-review';
}
/**
 * Reconciliation Summary
 */
export interface ReconciliationSummary {
    matched: number;
    unmatched: number;
    exceptions: number;
    accuracy: number;
    totalTransactions: number;
    totalSettlements: number;
    totalFees: Money;
    effectiveRate: number;
}
//# sourceMappingURL=types.d.ts.map