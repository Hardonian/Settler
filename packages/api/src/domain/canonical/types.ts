/**
 * Canonical Data Model Types
 *
 * These types represent the unified, opinionated schema for all payment data,
 * abstracting provider differences as specified in the Product & Technical Specification.
 */

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "refunded"
  | "disputed"
  | "failed";
export type TransactionType = "authorization" | "capture" | "refund" | "chargeback" | "adjustment";
export type TransactionStatus = "pending" | "succeeded" | "failed" | "refunded" | "disputed";
export type SettlementStatus = "pending" | "completed" | "failed";
export type FeeType = "processing" | "fx" | "chargeback" | "refund" | "adjustment" | "other";
export type RefundDisputeType = "refund" | "chargeback" | "dispute";
export type RefundDisputeStatus = "pending" | "completed" | "reversed" | "lost";
export type MatchType = "1-to-1" | "1-to-many" | "many-to-1";
export type ExceptionCategory =
  | "amount_mismatch"
  | "date_mismatch"
  | "missing_transaction"
  | "missing_settlement"
  | "duplicate";
export type ExceptionSeverity = "low" | "medium" | "high" | "critical";
export type ExceptionResolutionStatus = "open" | "in_progress" | "resolved" | "dismissed";

/**
 * Money type - represents an amount with currency
 */
export interface Money {
  value: number; // Decimal amount
  currency: string; // ISO 4217 currency code (e.g., 'USD', 'EUR')
}

/**
 * Payment - Logical Payment Intent/Order
 * Represents a business-level payment intent (e.g., an order)
 */
export interface Payment {
  id: string; // Settler-generated UUID
  tenantId: string;
  externalId: string; // Merchant's order ID
  amount: Money;
  status: PaymentStatus;
  customerId?: string; // Merchant's customer ID
  metadata: Record<string, any>; // Merchant-provided metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transaction - Processor-Level Record
 * Represents a single transaction at the processor level (e.g., a Stripe charge, PayPal payment)
 */
export interface Transaction {
  id: string; // Settler-generated UUID
  tenantId: string;
  paymentId?: string; // Links to Payment
  provider: string; // stripe, paypal, square, bank
  providerTransactionId: string; // Provider's transaction ID
  type: TransactionType;
  amount: Money; // Transaction amount
  netAmount?: Money; // Amount after fees
  status: TransactionStatus;
  rawPayload: Record<string, any>; // Original provider payload
  created_at: Date;
  updatedAt: Date;
}

/**
 * Settlement/Payout
 * Represents funds settled to merchant account
 */
export interface Settlement {
  id: string; // Settler-generated UUID
  tenantId: string;
  provider: string; // stripe, paypal, square, bank
  providerSettlementId: string; // Provider's settlement ID
  amount: Money; // Settlement amount
  currency: string; // Settlement currency (may differ from transaction currency)
  fxRate?: number; // FX rate if currency conversion occurred
  settlementDate: Date; // When funds were settled
  expectedDate?: Date; // When settlement was expected
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
  amount: Money; // Amount of this transaction included in settlement
  createdAt: Date;
}

/**
 * Fee
 * Represents a fee component (processing fee, FX fee, chargeback fee, etc.)
 */
export interface Fee {
  id: string;
  tenantId: string;
  transactionId?: string; // Links to Transaction
  settlementId?: string; // Links to Settlement
  type: FeeType;
  amount: Money; // Fee amount
  description?: string; // Human-readable description
  rate?: number; // Percentage rate (if applicable)
  rawPayload: Record<string, any>; // Provider-specific fee data
  createdAt: Date;
}

/**
 * FX Rate and Conversion
 * Tracks currency conversions and FX rates
 */
export interface FXConversion {
  id: string;
  tenantId: string;
  transactionId?: string; // Links to Transaction
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  fxRate: number;
  provider?: string; // FX provider (PSP or third-party)
  rateDate: Date; // When rate was applied
  createdAt: Date;
}

/**
 * Refund & Chargeback/Dispute
 * Tracks refunds and disputes separately from transactions
 */
export interface RefundDispute {
  id: string;
  tenantId: string;
  transactionId: string; // Links to original Transaction
  type: RefundDisputeType;
  amount: Money; // Refund/dispute amount (may be partial)
  status: RefundDisputeStatus;
  reason?: string; // Refund reason or dispute reason code
  providerRefundId?: string; // Provider's refund ID
  providerDisputeId?: string; // Provider's dispute ID
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
  confidenceScore: number; // 0.00 to 1.00
  matchingRules: Record<string, any>; // Rules used for matching
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
  field: string; // transactionId, amount, date, referenceId, etc.
  type: "exact" | "fuzzy" | "range";
  tolerance?: {
    amount?: number; // Amount tolerance (e.g., 0.01)
    days?: number; // Date tolerance in days
  };
  threshold?: number; // Confidence threshold for fuzzy matching (0-1)
}

export interface MatchingRulesConfig {
  strategies: MatchingRule[];
  priority: "exact-first" | "fuzzy-first" | "custom";
  conflictResolution?: "first-wins" | "last-wins" | "manual-review";
}

/**
 * Reconciliation Summary
 */
export interface ReconciliationSummary {
  matched: number;
  unmatched: number;
  exceptions: number;
  accuracy: number; // Percentage (0-100)
  totalTransactions: number;
  totalSettlements: number;
  totalFees: Money;
  effectiveRate: number; // Average effective rate
}
