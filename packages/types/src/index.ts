/**
 * Canonical Data Model Types
 *
 * These types represent the unified, opinionated schema for all payment data,
 * abstracting provider differences as specified in the Product & Technical Specification.
 */

// Environment validation utilities (Phase 3: Environment Safety)
export {
  serverEnvSchema,
  clientEnvSchema,
  fullEnvSchema,
  validateServerEnv,
  validateClientEnv,
  validateEnv,
  safeEnv,
  type ServerEnv,
  type ClientEnv,
  type FullEnv,
} from "./env-validation";

export {
  CLIENT_ENV_KEYS,
  SERVER_ENV_KEYS,
  BUILD_REQUIRED_SERVER_KEYS,
  RUNTIME_REQUIRED_SERVER_KEYS,
  validateClientEnv as validateTypedClientEnv,
  validateServerEnv as validateTypedServerEnv,
  validateEnvScopes,
  type ClientEnvKey,
  type ServerEnvKey,
  type EnvValidationResult,
} from "./typed-env";

// Logging utilities (Phase 5: Observability)
export {
  logger,
  RequestCorrelation,
  AppError,
  safeAsync,
  type LogLevel,
  type LogContext,
} from "./logging";

// Ledger domain types
export {
  type AccountType,
  type TransferStatus,
  type LedgerAccount,
  type LedgerTransfer,
  type LedgerBalance,
  type TransferFilters,
  type CreateLedgerAccountInput,
  type CreateLedgerTransferInput,
  type ReverseLedgerTransferInput,
  type LedgerQueryResult,
} from "./ledger";

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

// Support intake (canonical operator/evidence-aligned categories)
export {
  SUPPORT_ISSUE_CATEGORY,
  SUPPORT_ISSUE_CATEGORY_LABELS,
  supportIntakeSubmissionSchema,
  type SupportIntakeSubmission,
  type SupportIssueCategory,
} from "./support-intake-contract";

// Run types (for reconciliation runs/executions)
export {
  Run,
  RunSummary,
  RunStatus,
  RunSummaryState,
  RunProgressState,
  CanonicalRunSummary,
  RunExceptionCounts,
  RunProvenance,
  RunWithLifecycle,
  RunListItem,
  RunDetail,
  RunListResponse,
  RunListResponseV1,
  RunV1Item,
} from "./run";

// Commercial spine (plans, meters, premium packs, legacy mappings)
export {
  USAGE_METERS,
  PLAN_SPINE,
  PREMIUM_PACKS,
  PLAN_DEFAULT_MRR_USD,
  LEGACY_SUBSCRIPTION_PLAN_ID_MAP,
  mapLegacySubscriptionPlanId,
  mapLegacyPlanTypeToPlanCode,
  getPlanSpine,
  getDefaultPlanCode,
  getLegacyQuotaProfile,
  getReconciliationVolumeLimit,
  getExceptionThreshold,
  calculatePlanMonthlyCostUsd,
  API_LEGACY_PLAN_FEATURES,
  getApiLegacyPlanLimits,
  getApiLegacyPlanFeatures,
  type PlanCode,
  type ServiceCode,
  type ServiceLimits,
  type LegacyPlanType,
  type PlanSpineEntry,
  type PremiumPackDefinition,
  type UsageMeterId,
  type UsageMeterDefinition,
  type LegacyQuotaProfile,
  type ApiLegacyPlanFeatures,
} from "./commercial-spine";
