/**
 * Demo Data Loader
 * 
 * Loads and validates demo data from JSON files.
 * Provides graceful degradation if files are missing or invalid.
 */

import { z } from "zod";
import {
  StripeChargeSchema,
  ShopifyOrderSchema,
  QuickBooksEntrySchema,
  BankPayoutSchema,
  ReceiptSchema,
  type Transaction,
  type Receipt,
} from "./types";
import {
  hashTransaction,
  deterministicAuditTrailId,
} from "./deterministic";

// Import JSON data
import stripeChargesData from "./stripe-charges.json";
import shopifyOrdersData from "./shopify-orders.json";
import quickbooksEntriesData from "./quickbooks-entries.json";
import bankPayoutsData from "./bank-payouts.json";
import receiptsData from "./receipts.json";

/**
 * Load and validate transactions
 */
export function loadTransactions(): Transaction[] {
  const transactions: Transaction[] = [];

  try {
    // Load Stripe charges
    const stripeCharges = z.array(StripeChargeSchema).parse(stripeChargesData);
    transactions.push(...stripeCharges);
  } catch (_error) {
    console.warn("[Demo] Failed to load Stripe charges:", error);
  }

  try {
    // Load Shopify orders
    const shopifyOrders = z.array(ShopifyOrderSchema).parse(shopifyOrdersData);
    transactions.push(...shopifyOrders);
  } catch (_error) {
    console.warn("[Demo] Failed to load Shopify orders:", error);
  }

  try {
    // Load QuickBooks entries
    const qbEntries = z.array(QuickBooksEntrySchema).parse(quickbooksEntriesData);
    transactions.push(...qbEntries);
  } catch (_error) {
    console.warn("[Demo] Failed to load QuickBooks entries:", error);
  }

  try {
    // Load bank payouts
    const payouts = z.array(BankPayoutSchema).parse(bankPayoutsData);
    transactions.push(...payouts);
  } catch (_error) {
    console.warn("[Demo] Failed to load bank payouts:", error);
  }

  return transactions;
}

/**
 * Load and validate receipts
 */
export function loadReceipts(): Receipt[] {
  try {
    return z.array(ReceiptSchema).parse(receiptsData);
  } catch (_error) {
    console.warn("[Demo] Failed to load receipts:", error);
    return [];
  }
}

/**
 * Get transactions by source
 */
export function getTransactionsBySource(source: string): Transaction[] {
  return loadTransactions().filter((t: any) => t.source === source);
}

/**
 * Get all source transactions (Stripe, Shopify)
 */
export function getSourceTransactions(): Transaction[] {
  return loadTransactions().filter((t: any) => t.source === "stripe" || t.source === "shopify");
}

/**
 * Get all target transactions (QuickBooks, Bank payouts)
 */
export function getTargetTransactions(): Transaction[] {
  return loadTransactions().filter((t: any) => t.source === "quickbooks" || t.source === "bank_payout");
}

/**
 * Add deterministic hashes and audit trail IDs to transactions
 */
export function enrichTransaction(transaction: Transaction): Transaction & {
  deterministic_hash: string;
  audit_trail_id: string;
} {
  const hash = hashTransaction(transaction);
  const auditTrailId = deterministicAuditTrailId(transaction.id, "transaction_created");

  return {
    ...transaction,
    deterministic_hash: hash,
    audit_trail_id: auditTrailId,
  };
}

/**
 * Get enriched transactions
 */
export function getEnrichedTransactions(): Array<
  Transaction & {
    deterministic_hash: string;
    audit_trail_id: string;
  }
> {
  return loadTransactions().map(enrichTransaction);
}
