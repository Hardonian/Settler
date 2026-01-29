"use strict";
/**
 * TaxJar Connector Driver
 *
 * TaxJar tax integration
 * Supports API key authentication
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxJarDriver = void 0;
const connector_driver_1 = require("../connector-driver");
class TaxJarDriver {
    metadata = {
        id: "taxjar",
        displayName: "TaxJar",
        category: "tax",
        authType: "api_key",
        description: "Sync tax estimates, transactions, and filings from TaxJar",
        icon: "📋",
        documentationUrl: "https://developers.taxjar.com",
        supportsWebhooks: false,
        supportsPolling: true,
        requiredConfig: ["api_key", "environment"],
        optionalConfig: [],
    };
    getApiUrl(environment) {
        const env = environment || "sandbox";
        const urls = {
            sandbox: "https://api.sandbox.taxjar.com",
            production: "https://api.taxjar.com",
        };
        return (urls[env] || urls.sandbox);
    }
    async testConnection(options) {
        const { credentials, config } = options;
        const apiKey = credentials.api_key;
        const env = config?.environment || "sandbox";
        const apiUrl = this.getApiUrl(env);
        if (!apiKey) {
            return {
                success: false,
                error: "Missing API key",
                message: "TaxJar API key is required",
            };
        }
        try {
            const response = await fetch(`${apiUrl}/v2/categories`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            });
            if (!response.ok) {
                return {
                    success: false,
                    error: "Authentication failed",
                    message: "Please check your TaxJar API key",
                };
            }
            return {
                success: true,
                message: "Connection successful",
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                message: `Connection test failed: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }
    async sync(credentials, _options) {
        const apiKey = credentials.api_key;
        const config = credentials.config || {};
        const env = config.environment || "sandbox";
        const apiUrl = this.getApiUrl(env);
        const taxEstimates = [];
        const rawPayloads = [];
        try {
            // Fetch transactions
            const transactionsResponse = await fetch(`${apiUrl}/v2/transactions/orders`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            });
            if (transactionsResponse.ok) {
                const transactionsData = await transactionsResponse.json();
                rawPayloads.push({ type: "transactions", payload: transactionsData });
                for (const tx of transactionsData.orders || []) {
                    if (tx.amount_to_collect && tx.amount_to_collect > 0) {
                        taxEstimates.push({
                            externalId: tx.transaction_id,
                            transactionId: tx.transaction_id,
                            transactionType: "sale",
                            amountCents: Math.round((tx.amount || 0) * 100),
                            currency: tx.currency || "USD",
                            taxAmountCents: Math.round((tx.amount_to_collect || 0) * 100),
                            taxRate: tx.rate || 0,
                            jurisdiction: tx.to_state || tx.to_country,
                            taxType: "sales_tax",
                            occurredAt: tx.transaction_date ? new Date(tx.transaction_date) : new Date(),
                            providerMetadata: {
                                transaction_id: tx.transaction_id,
                                order_id: tx.transaction_id,
                            },
                            idempotencyKey: `${tx.transaction_id}-${tx.transaction_date || Date.now()}`,
                        });
                    }
                }
            }
            return {
                hasMore: false,
                counts: {
                    taxEstimates: taxEstimates.length,
                },
                taxEstimates,
                rawPayloads,
            };
        }
        catch (error) {
            if (error instanceof connector_driver_1.ConnectorError) {
                throw error;
            }
            throw new connector_driver_1.ConnectorError(`TaxJar sync failed: ${error instanceof Error ? error.message : String(error)}`, "TAXJAR_SYNC_FAILED", "taxjar", error instanceof Error ? error : undefined);
        }
    }
}
exports.TaxJarDriver = TaxJarDriver;
//# sourceMappingURL=taxjar.js.map