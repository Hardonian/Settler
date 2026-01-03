/**
 * Demo Data Types
 * 
 * Type definitions for deterministic demo data.
 * All demo data is static and reproducible - no randomness.
 */

import { z } from "zod";

/**
 * Source adapter types
 */
export const SourceAdapterSchema = z.enum([
  "stripe",
  "shopify",
  "quickbooks",
  "bank_payout",
  "receipt",
]);

export type SourceAdapter = z.infer<typeof SourceAdapterSchema>;

/**
 * Transaction status
 */
export const TransactionStatusSchema = z.enum([
  "pending",
  "completed",
  "refunded",
  "failed",
  "disputed",
]);

export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

/**
 * Match confidence level
 */
export const MatchConfidenceSchema = z.enum([
  "exact",
  "high",
  "medium",
  "low",
  "none",
]);

export type MatchConfidence = z.infer<typeof MatchConfidenceSchema>;

/**
 * Match rule type
 */
export const MatchRuleTypeSchema = z.enum([
  "amount_exact",
  "amount_tolerance",
  "amount_date_window",
  "merchant_exact",
  "merchant_fuzzy",
  "reference_id",
  "composite",
]);

export type MatchRuleType = z.infer<typeof MatchRuleTypeSchema>;

/**
 * Base transaction schema
 */
export const BaseTransactionSchema = z.object({
  id: z.string(),
  source: SourceAdapterSchema,
  amount: z.number(),
  currency: z.string().default("USD"),
  timestamp: z.string(), // ISO 8601
  status: TransactionStatusSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type BaseTransaction = z.infer<typeof BaseTransactionSchema>;

/**
 * Stripe charge schema
 */
export const StripeChargeSchema = BaseTransactionSchema.extend({
  source: z.literal("stripe"),
  stripe_charge_id: z.string(),
  stripe_customer_id: z.string().optional(),
  description: z.string().optional(),
  fee: z.number().optional(),
  net_amount: z.number().optional(),
});

export type StripeCharge = z.infer<typeof StripeChargeSchema>;

/**
 * Shopify order schema
 */
export const ShopifyOrderSchema = BaseTransactionSchema.extend({
  source: z.literal("shopify"),
  shopify_order_id: z.string(),
  shopify_order_number: z.string(),
  customer_email: z.string().optional(),
  line_items: z.array(z.object({
    id: z.string(),
    title: z.string(),
    quantity: z.number(),
    price: z.number(),
  })).optional(),
  fulfillment_status: z.string().optional(),
});

export type ShopifyOrder = z.infer<typeof ShopifyOrderSchema>;

/**
 * QuickBooks entry schema
 */
export const QuickBooksEntrySchema = BaseTransactionSchema.extend({
  source: z.literal("quickbooks"),
  qb_entry_id: z.string(),
  qb_entry_type: z.string(),
  account_name: z.string().optional(),
  memo: z.string().optional(),
});

export type QuickBooksEntry = z.infer<typeof QuickBooksEntrySchema>;

/**
 * Bank payout schema
 */
export const BankPayoutSchema = BaseTransactionSchema.extend({
  source: z.literal("bank_payout"),
  payout_id: z.string(),
  bank_account_last4: z.string().optional(),
  description: z.string().optional(),
});

export type BankPayout = z.infer<typeof BankPayoutSchema>;

/**
 * Receipt schema
 */
export const ReceiptSchema = z.object({
  id: z.string(),
  source: z.literal("receipt"),
  vendor_name: z.string(),
  amount: z.number(),
  currency: z.string().default("USD"),
  date: z.string(), // ISO 8601
  category: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().optional(),
    unit_price: z.number().optional(),
    total: z.number(),
  })).optional(),
  tax_amount: z.number().optional(),
  total_amount: z.number(),
  payment_method: z.string().optional(),
  receipt_number: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Receipt = z.infer<typeof ReceiptSchema>;

/**
 * Union of all transaction types
 */
export const TransactionSchema = z.discriminatedUnion("source", [
  StripeChargeSchema,
  ShopifyOrderSchema,
  QuickBooksEntrySchema,
  BankPayoutSchema,
]);

export type Transaction = z.infer<typeof TransactionSchema>;

/**
 * Match result schema
 */
export const MatchResultSchema = z.object({
  id: z.string(),
  source_transaction_id: z.string(),
  target_transaction_id: z.string(),
  confidence: MatchConfidenceSchema,
  rule_used: MatchRuleTypeSchema,
  rule_id: z.string(),
  matched_at: z.string(), // ISO 8601
  evidence: z.array(z.object({
    field: z.string(),
    source_value: z.unknown(),
    target_value: z.unknown(),
    match_type: z.string(),
  })),
  audit_trail_id: z.string(),
  deterministic_hash: z.string(), // SHA-256 of normalized record
});

export type MatchResult = z.infer<typeof MatchResultSchema>;

/**
 * Audit trail entry schema
 */
export const AuditTrailEntrySchema = z.object({
  id: z.string(),
  audit_trail_id: z.string(),
  action: z.string(),
  entity_type: z.string(),
  entity_id: z.string(),
  timestamp: z.string(), // ISO 8601
  user_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  deterministic_hash: z.string(),
});

export type AuditTrailEntry = z.infer<typeof AuditTrailEntrySchema>;

/**
 * Reconciliation run schema
 */
export const ReconciliationRunSchema = z.object({
  id: z.string(),
  started_at: z.string(), // ISO 8601
  completed_at: z.string().optional(), // ISO 8601
  status: z.enum(["running", "completed", "failed"]),
  source_count: z.number(),
  target_count: z.number(),
  matches_found: z.number(),
  matches_exact: z.number(),
  matches_high_confidence: z.number(),
  matches_medium_confidence: z.number(),
  matches_low_confidence: z.number(),
  unmatched_source: z.number(),
  unmatched_target: z.number(),
  conflicts: z.number(),
  audit_trail_id: z.string(),
});

export type ReconciliationRun = z.infer<typeof ReconciliationRunSchema>;

/**
 * Feature flags schema
 */
export const FeatureFlagsSchema = z.object({
  auto_match_enabled: z.boolean(),
  receipt_matching_enabled: z.boolean(),
  ai_assist_enabled: z.boolean(),
  export_enabled: z.boolean(),
  webhooks_enabled: z.boolean(),
});

export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;

/**
 * Plan tier schema
 */
export const PlanTierSchema = z.enum(["free", "pro", "enterprise"]);

export type PlanTier = z.infer<typeof PlanTierSchema>;
