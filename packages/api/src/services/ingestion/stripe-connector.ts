/**
 * Stripe Connector
 * Fetches transactions from Stripe API and normalizes them
 */

import { query } from "../../db";
import { logError, logInfo } from "../../utils/logger";
import { NormalizedTransactionInput } from "./types";
import { StripeConnectorConfig } from "./types";
import { retryWithBackoff } from "../../utils/retry-with-backoff";

// Stripe SDK types (we'll install stripe package)
// For now, using basic types
interface StripeBalanceTransaction {
  id: string;
  amount: number; // In cents
  currency: string;
  created: number; // Unix timestamp
  description: string | null;
  type: string;
  fee: number;
  net: number;
  available_on: number; // Unix timestamp
  status: string;
}

interface StripePayout {
  id: string;
  amount: number; // In cents
  currency: string;
  created: number; // Unix timestamp
  arrival_date: number; // Unix timestamp
  status: string;
  description: string | null;
}

/**
 * Encrypt connector config (in production, use proper encryption)
 * For now, storing as-is but should be encrypted at rest
 */
async function encryptConfig(config: StripeConnectorConfig): Promise<string> {
  // TODO: Implement proper encryption using SecretsManager or similar
  // For now, storing JSON (should be encrypted in production)
  return JSON.stringify(config);
}

/**
 * Decrypt connector config
 */
async function decryptConfig(encrypted: string): Promise<StripeConnectorConfig> {
  // TODO: Implement proper decryption
  return JSON.parse(encrypted) as StripeConnectorConfig;
}

/**
 * Get Stripe client (lazy load to avoid requiring stripe package if not used)
 */
async function getStripeClient(config: StripeConnectorConfig): Promise<any> {
  try {
    // Dynamic import to avoid requiring stripe package if not installed
    const stripeModule = await import("stripe");
    const Stripe = stripeModule.default || stripeModule;
    return new Stripe(config.apiKey, {
      apiVersion: "2024-11-20.acacia",
    });
  } catch (error) {
    logError("Failed to load Stripe SDK", error);
    throw new Error(
      "Stripe SDK not available. Install with: npm install stripe"
    );
  }
}

/**
 * Fetch Stripe balance transactions for date range
 */
export async function fetchStripeTransactions(
  config: StripeConnectorConfig,
  dateRange: { start: Date; end: Date }
): Promise<StripeBalanceTransaction[]> {
  const stripe = await getStripeClient(config);

  const transactions: StripeBalanceTransaction[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Record<string, unknown> = {
      limit: 100,
      created: {
        gte: Math.floor(dateRange.start.getTime() / 1000),
        lte: Math.floor(dateRange.end.getTime() / 1000),
      },
    };

    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const response = await retryWithBackoff(
      async () => {
        return await stripe.balanceTransactions.list(params);
      },
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
      }
    );

    transactions.push(...(response.data as StripeBalanceTransaction[]));

    hasMore = response.has_more;
    if (hasMore && response.data.length > 0) {
      const lastTransaction = response.data[response.data.length - 1] as StripeBalanceTransaction;
      startingAfter = lastTransaction.id;
    }
  }

  logInfo("Fetched Stripe transactions", {
    count: transactions.length,
    dateRange,
  });

  return transactions;
}

/**
 * Fetch Stripe payouts for date range
 */
export async function fetchStripePayouts(
  config: StripeConnectorConfig,
  dateRange: { start: Date; end: Date }
): Promise<StripePayout[]> {
  const stripe = await getStripeClient(config);

  const payouts: StripePayout[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Record<string, unknown> = {
      limit: 100,
      created: {
        gte: Math.floor(dateRange.start.getTime() / 1000),
        lte: Math.floor(dateRange.end.getTime() / 1000),
      },
    };

    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const response = await retryWithBackoff(
      async () => {
        return await stripe.payouts.list(params);
      },
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
      }
    );

    payouts.push(...(response.data as StripePayout[]));

    hasMore = response.has_more;
    if (hasMore && response.data.length > 0) {
      const lastPayout = response.data[response.data.length - 1] as StripePayout;
      startingAfter = lastPayout.id;
    }
  }

  logInfo("Fetched Stripe payouts", {
    count: payouts.length,
    dateRange,
  });

  return payouts;
}

/**
 * Normalize Stripe balance transaction to internal format
 */
export function normalizeStripeTransaction(
  transaction: StripeBalanceTransaction
): NormalizedTransactionInput {
  return {
    amount: Math.abs(transaction.amount) / 100, // Convert cents to dollars
    currency: transaction.currency.toUpperCase(),
    date: new Date(transaction.created * 1000),
    description: transaction.description || undefined,
    externalId: transaction.id,
    category: transaction.type,
    paymentMethod: "stripe",
    reference: transaction.id,
    metadata: {
      stripe_type: transaction.type,
      stripe_fee: transaction.fee / 100,
      stripe_net: transaction.net / 100,
      stripe_status: transaction.status,
      stripe_available_on: new Date(transaction.available_on * 1000).toISOString(),
    },
  };
}

/**
 * Normalize Stripe payout to internal format
 */
export function normalizeStripePayout(
  payout: StripePayout
): NormalizedTransactionInput {
  return {
    amount: Math.abs(payout.amount) / 100, // Convert cents to dollars
    currency: payout.currency.toUpperCase(),
    date: new Date(payout.arrival_date * 1000), // Use arrival_date for payout
    description: payout.description || `Stripe Payout ${payout.id}`,
    externalId: payout.id,
    category: "payout",
    paymentMethod: "stripe",
    reference: payout.id,
    metadata: {
      stripe_status: payout.status,
      stripe_created: new Date(payout.created * 1000).toISOString(),
    },
  };
}

/**
 * Create or update Stripe connector source
 */
export async function createStripeSource(
  tenantId: string,
  userId: string,
  name: string,
  config: StripeConnectorConfig
): Promise<string> {
  const sourceId = require("uuid").v4();
  const encryptedConfig = await encryptConfig(config);

  try {
    await query(
      `INSERT INTO ingestion_sources (
        id, tenant_id, user_id, name, type, connector_type,
        config_encrypted, config_metadata, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id`,
      [
        sourceId,
        tenantId,
        userId,
        name,
        "stripe",
        "stripe",
        encryptedConfig,
        JSON.stringify({
          connectorName: "Stripe",
          accountId: config.accountId,
        }),
        "active",
      ]
    );

    logInfo("Created Stripe connector source", { sourceId, tenantId });
    return sourceId;
  } catch (error) {
    logError("Failed to create Stripe source", error, { tenantId });
    throw error;
  }
}

/**
 * Get Stripe connector config from source
 */
export async function getStripeConfig(sourceId: string): Promise<StripeConnectorConfig> {
  const results = await query(
    `SELECT config_encrypted FROM ingestion_sources WHERE id = $1`,
    [sourceId]
  );

  if (results.length === 0) {
    throw new Error(`Source ${sourceId} not found`);
  }

  const row = results[0] as { config_encrypted: string };
  return await decryptConfig(row.config_encrypted);
}

/**
 * Sync Stripe data for a source
 */
export async function syncStripeSource(
  sourceId: string,
  dateRange: { start: Date; end: Date }
): Promise<{
  transactions: NormalizedTransactionInput[];
  payouts: NormalizedTransactionInput[];
}> {
  const config = await getStripeConfig(sourceId);

  // Fetch both transactions and payouts
  const [stripeTransactions, stripePayouts] = await Promise.all([
    fetchStripeTransactions(config, dateRange),
    fetchStripePayouts(config, dateRange),
  ]);

  // Normalize
  const transactions = stripeTransactions.map(normalizeStripeTransaction);
  const payouts = stripePayouts.map(normalizeStripePayout);

  return {
    transactions,
    payouts,
  };
}
