"use strict";
/**
 * Stripe Connector
 * Fetches transactions from Stripe API and normalizes them
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchStripeTransactions = fetchStripeTransactions;
exports.fetchStripePayouts = fetchStripePayouts;
exports.normalizeStripeTransaction = normalizeStripeTransaction;
exports.normalizeStripePayout = normalizeStripePayout;
exports.createStripeSource = createStripeSource;
exports.getStripeConfig = getStripeConfig;
exports.syncStripeSource = syncStripeSource;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const retry_with_backoff_1 = require("../../utils/retry-with-backoff");
/**
 * Encrypt connector config (in production, use proper encryption)
 * For now, storing as-is but should be encrypted at rest
 */
async function encryptConfig(config) {
    // TODO: Implement proper encryption using SecretsManager or similar
    // For now, storing JSON (should be encrypted in production)
    return JSON.stringify(config);
}
/**
 * Decrypt connector config
 */
async function decryptConfig(encrypted) {
    // TODO: Implement proper decryption
    return JSON.parse(encrypted);
}
/**
 * Get Stripe client (lazy load to avoid requiring stripe package if not used)
 */
async function getStripeClient(config) {
    try {
        // Dynamic import to avoid requiring stripe package if not installed
        const stripeModule = await Promise.resolve().then(() => __importStar(require("stripe")));
        const Stripe = stripeModule.default || stripeModule;
        return new Stripe(config.apiKey, {
            apiVersion: "2023-10-16",
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to load Stripe SDK", error);
        throw new Error("Stripe SDK not available. Install with: npm install stripe");
    }
}
/**
 * Fetch Stripe balance transactions for date range
 */
async function fetchStripeTransactions(config, dateRange) {
    const stripe = await getStripeClient(config);
    const transactions = [];
    let hasMore = true;
    let startingAfter;
    while (hasMore) {
        const params = {
            limit: 100,
            created: {
                gte: Math.floor(dateRange.start.getTime() / 1000),
                lte: Math.floor(dateRange.end.getTime() / 1000),
            },
        };
        if (startingAfter) {
            params.starting_after = startingAfter;
        }
        const response = await (0, retry_with_backoff_1.retryWithBackoff)(async () => {
            return await stripe.balanceTransactions.list(params);
        }, {
            maxAttempts: 3,
            initialDelayMs: 1000,
        });
        transactions.push(...response.data);
        hasMore = response.has_more;
        if (hasMore && response.data.length > 0) {
            const lastTransaction = response.data[response.data.length - 1];
            startingAfter = lastTransaction.id;
        }
    }
    (0, logger_1.logInfo)("Fetched Stripe transactions", {
        count: transactions.length,
        dateRange,
    });
    return transactions;
}
/**
 * Fetch Stripe payouts for date range
 */
async function fetchStripePayouts(config, dateRange) {
    const stripe = await getStripeClient(config);
    const payouts = [];
    let hasMore = true;
    let startingAfter;
    while (hasMore) {
        const params = {
            limit: 100,
            created: {
                gte: Math.floor(dateRange.start.getTime() / 1000),
                lte: Math.floor(dateRange.end.getTime() / 1000),
            },
        };
        if (startingAfter) {
            params.starting_after = startingAfter;
        }
        const response = await (0, retry_with_backoff_1.retryWithBackoff)(async () => {
            return await stripe.payouts.list(params);
        }, {
            maxAttempts: 3,
            initialDelayMs: 1000,
        });
        payouts.push(...response.data);
        hasMore = response.has_more;
        if (hasMore && response.data.length > 0) {
            const lastPayout = response.data[response.data.length - 1];
            startingAfter = lastPayout.id;
        }
    }
    (0, logger_1.logInfo)("Fetched Stripe payouts", {
        count: payouts.length,
        dateRange,
    });
    return payouts;
}
/**
 * Normalize Stripe balance transaction to internal format
 */
function normalizeStripeTransaction(transaction) {
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
function normalizeStripePayout(payout) {
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
async function createStripeSource(tenantId, userId, name, config) {
    const sourceId = require("uuid").v4();
    const encryptedConfig = await encryptConfig(config);
    try {
        await (0, db_1.query)(`INSERT INTO ingestion_sources (
        id, tenant_id, user_id, name, type, connector_type,
        config_encrypted, config_metadata, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id`, [
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
        ]);
        (0, logger_1.logInfo)("Created Stripe connector source", { sourceId, tenantId });
        return sourceId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to create Stripe source", error, { tenantId });
        throw error;
    }
}
/**
 * Get Stripe connector config from source
 */
async function getStripeConfig(sourceId) {
    const results = await (0, db_1.query)(`SELECT config_encrypted FROM ingestion_sources WHERE id = $1`, [sourceId]);
    if (results.length === 0) {
        throw new Error(`Source ${sourceId} not found`);
    }
    const row = results[0];
    return await decryptConfig(row.config_encrypted);
}
/**
 * Sync Stripe data for a source
 */
async function syncStripeSource(sourceId, dateRange) {
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
//# sourceMappingURL=stripe-connector.js.map