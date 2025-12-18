/**
 * Stripe Connector
 * Fetches transactions from Stripe API and normalizes them
 */
import { NormalizedTransactionInput } from "./types";
import { StripeConnectorConfig } from "./types";
interface StripeBalanceTransaction {
    id: string;
    amount: number;
    currency: string;
    created: number;
    description: string | null;
    type: string;
    fee: number;
    net: number;
    available_on: number;
    status: string;
}
interface StripePayout {
    id: string;
    amount: number;
    currency: string;
    created: number;
    arrival_date: number;
    status: string;
    description: string | null;
}
/**
 * Fetch Stripe balance transactions for date range
 */
export declare function fetchStripeTransactions(config: StripeConnectorConfig, dateRange: {
    start: Date;
    end: Date;
}): Promise<StripeBalanceTransaction[]>;
/**
 * Fetch Stripe payouts for date range
 */
export declare function fetchStripePayouts(config: StripeConnectorConfig, dateRange: {
    start: Date;
    end: Date;
}): Promise<StripePayout[]>;
/**
 * Normalize Stripe balance transaction to internal format
 */
export declare function normalizeStripeTransaction(transaction: StripeBalanceTransaction): NormalizedTransactionInput;
/**
 * Normalize Stripe payout to internal format
 */
export declare function normalizeStripePayout(payout: StripePayout): NormalizedTransactionInput;
/**
 * Create or update Stripe connector source
 */
export declare function createStripeSource(tenantId: string, userId: string, name: string, config: StripeConnectorConfig): Promise<string>;
/**
 * Get Stripe connector config from source
 */
export declare function getStripeConfig(sourceId: string): Promise<StripeConnectorConfig>;
/**
 * Sync Stripe data for a source
 */
export declare function syncStripeSource(sourceId: string, dateRange: {
    start: Date;
    end: Date;
}): Promise<{
    transactions: NormalizedTransactionInput[];
    payouts: NormalizedTransactionInput[];
}>;
export {};
//# sourceMappingURL=stripe-connector.d.ts.map