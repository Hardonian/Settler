"use strict";
/**
 * Avalara Connector Driver
 *
 * Avalara tax integration
 * Supports API key authentication
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvalaraDriver = void 0;
const connector_driver_1 = require("../connector-driver");
class AvalaraDriver {
    metadata = {
        id: "avalara",
        displayName: "Avalara",
        category: "tax",
        authType: "api_key",
        description: "Sync tax estimates, transactions, and filings from Avalara",
        icon: "📋",
        documentationUrl: "https://developer.avalara.com",
        supportsWebhooks: true,
        supportsPolling: true,
        requiredConfig: ["account_id", "license_key", "environment"],
        optionalConfig: ["company_id"],
    };
    getApiUrl(environment) {
        const env = environment || "sandbox";
        const urls = {
            sandbox: "https://sandbox-rest.avatax.com",
            production: "https://rest.avatax.com",
        };
        return urls[env] ?? urls.sandbox;
    }
    async testConnection(options) {
        const { credentials, config } = options;
        const accountId = credentials.account_id;
        const licenseKey = credentials.license_key;
        const env = config?.environment || "sandbox";
        const apiUrl = this.getApiUrl(env);
        if (!accountId || !licenseKey) {
            return {
                success: false,
                error: "Missing credentials",
                message: "Avalara account_id and license_key are required",
            };
        }
        try {
            const authHeader = Buffer.from(`${accountId}:${licenseKey}`).toString("base64");
            const response = await fetch(`${apiUrl}/api/v2/utilities/ping`, {
                method: "GET",
                headers: {
                    Authorization: `Basic ${authHeader}`,
                },
            });
            if (!response.ok) {
                return {
                    success: false,
                    error: "Authentication failed",
                    message: "Please check your Avalara credentials",
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
        const accountId = credentials.account_id;
        const licenseKey = credentials.license_key;
        const config = credentials.config || {};
        const env = config.environment || "sandbox";
        const apiUrl = this.getApiUrl(env);
        const taxEstimates = [];
        const rawPayloads = [];
        const authHeader = Buffer.from(`${accountId}:${licenseKey}`).toString("base64");
        try {
            // Fetch transactions (which include tax estimates)
            const transactionsResponse = await fetch(`${apiUrl}/api/v2/transactions`, {
                method: "GET",
                headers: {
                    Authorization: `Basic ${authHeader}`,
                    "Content-Type": "application/json",
                },
            });
            if (transactionsResponse.ok) {
                const transactionsData = await transactionsResponse.json();
                rawPayloads.push({ type: "transactions", payload: transactionsData });
                for (const tx of transactionsData.value || []) {
                    if (tx.totalTax && tx.totalTax > 0) {
                        taxEstimates.push({
                            externalId: tx.id?.toString() || crypto.randomUUID(),
                            transactionId: tx.id?.toString(),
                            transactionType: "sale",
                            amountCents: Math.round((tx.totalAmount || 0) * 100),
                            currency: tx.currencyCode || "USD",
                            taxAmountCents: Math.round((tx.totalTax || 0) * 100),
                            taxRate: tx.totalTax / (tx.totalAmount || 1),
                            jurisdiction: tx.addresses?.shipTo?.region || tx.addresses?.shipTo?.country,
                            taxType: "sales_tax",
                            occurredAt: tx.date ? new Date(tx.date) : new Date(),
                            providerMetadata: {
                                transaction_id: tx.id,
                                company_id: tx.companyId,
                            },
                            idempotencyKey: `${tx.id}-${tx.date || Date.now()}`,
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
            throw new connector_driver_1.ConnectorError(`Avalara sync failed: ${error instanceof Error ? error.message : String(error)}`, "AVALARA_SYNC_FAILED", "avalara", error instanceof Error ? error : undefined);
        }
    }
}
exports.AvalaraDriver = AvalaraDriver;
//# sourceMappingURL=avalara.js.map