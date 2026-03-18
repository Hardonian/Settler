"use strict";
/**
 * TrueLayer Connector Driver
 *
 * Bank aggregation for EU/UK (PSD2)
 * Supports OAuth2 flow
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrueLayerDriver = void 0;
const connector_driver_1 = require("../connector-driver");
class TrueLayerDriver {
    metadata = {
        id: "truelayer",
        displayName: "TrueLayer",
        category: "bank_feed",
        authType: "oauth2",
        description: "Connect your European/UK bank accounts via TrueLayer for automatic transaction and balance sync",
        icon: "🏦",
        documentationUrl: "https://docs.truelayer.com",
        supportsWebhooks: true,
        supportsPolling: true,
        requiredConfig: ["client_id", "client_secret", "environment"],
        optionalConfig: ["redirect_uri", "webhook_secret"],
    };
    getApiUrl(environment) {
        const env = environment || "sandbox";
        const urls = {
            sandbox: "https://api.truelayer-sandbox.com",
            production: "https://api.truelayer.com",
        };
        return (urls[env] || urls.sandbox);
    }
    async getAuthUrl(options) {
        const config = options;
        const apiUrl = this.getApiUrl(config.environment);
        const params = new URLSearchParams({
            response_type: "code",
            client_id: config.clientId,
            redirect_uri: config.redirectUri || options.redirectUri,
            scope: options.scopes?.join(" ") || "accounts transactions balance",
            state: options.state || "",
            nonce: crypto.randomUUID(),
        });
        return `${apiUrl}/connect/v1/authorize?${params.toString()}`;
    }
    async handleCallback(code, _state, options) {
        const config = options;
        const apiUrl = this.getApiUrl(config.environment);
        const response = await fetch(`${apiUrl}/connect/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: config.clientId,
                client_secret: config.clientSecret,
                redirect_uri: config.redirectUri || options.redirectUri,
                code: code,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new connector_driver_1.ConnectorError(`Failed to exchange TrueLayer token: ${error.error || error.error_description}`, "TRUELAYER_TOKEN_EXCHANGE_FAILED", "truelayer");
        }
        const data = await response.json();
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            tokenType: data.token_type,
            scope: data.scope,
        };
    }
    async refreshToken(refreshToken, config) {
        const env = config?.environment || "sandbox";
        const apiUrl = this.getApiUrl(env);
        const clientId = config?.client_id;
        const clientSecret = config?.client_secret;
        const response = await fetch(`${apiUrl}/connect/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new connector_driver_1.ConnectorError(`Failed to refresh TrueLayer token: ${error.error || error.error_description}`, "TRUELAYER_REFRESH_FAILED", "truelayer");
        }
        const data = await response.json();
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            tokenType: data.token_type,
        };
    }
    async revoke(accessToken, config) {
        const env = config?.environment || "sandbox";
        const apiUrl = this.getApiUrl(env);
        const response = await fetch(`${apiUrl}/api/v1/disconnect`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new connector_driver_1.ConnectorError(`Failed to revoke TrueLayer access: ${error.error || error.error_description}`, "TRUELAYER_REVOKE_FAILED", "truelayer");
        }
    }
    async testConnection(options) {
        const { credentials, config } = options;
        const accessToken = credentials.access_token;
        const env = config?.environment || "sandbox";
        const apiUrl = this.getApiUrl(env);
        try {
            const response = await fetch(`${apiUrl}/data/v1/accounts`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                const error = await response.json();
                return {
                    success: false,
                    error: error.error || error.error_description,
                    message: `Connection test failed: ${error.error || error.error_description}`,
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
    async sync(credentials, options) {
        const accessToken = credentials.access_token;
        const config = credentials.config || {};
        const env = config.environment || "sandbox";
        const apiUrl = this.getApiUrl(env);
        const accounts = [];
        const transactions = [];
        const balances = [];
        const rawPayloads = [];
        try {
            // Fetch accounts
            const accountsResponse = await fetch(`${apiUrl}/data/v1/accounts`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!accountsResponse.ok) {
                const error = await accountsResponse.json();
                throw new connector_driver_1.ConnectorError(`Failed to fetch accounts: ${error.error || error.error_description}`, "TRUELAYER_ACCOUNTS_FAILED", "truelayer");
            }
            const accountsData = await accountsResponse.json();
            rawPayloads.push({ type: "accounts", payload: accountsData });
            // Normalize accounts
            for (const account of accountsData.results || []) {
                accounts.push({
                    providerAccountId: account.account_id,
                    accountName: account.display_name,
                    accountType: account.account_type?.type,
                    currency: account.currency || "GBP",
                    institutionName: account.provider?.display_name,
                    institutionId: account.provider?.provider_id,
                    metadata: {
                        account_number: account.account_number,
                        sort_code: account.sort_code,
                        iban: account.iban,
                    },
                });
                // Fetch balance for this account
                try {
                    const balanceResponse = await fetch(`${apiUrl}/data/v1/accounts/${account.account_id}/balance`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });
                    if (balanceResponse.ok) {
                        const balanceData = await balanceResponse.json();
                        const availableBalance = balanceData.results?.[0]?.available;
                        balances.push({
                            accountId: account.account_id,
                            balanceCents: Math.round((balanceData.results?.[0]?.current || 0) * 100),
                            ...(availableBalance !== undefined && availableBalance !== null
                                ? { availableBalanceCents: Math.round(availableBalance * 100) }
                                : {}),
                            currency: account.currency || "GBP",
                            snapshotAt: new Date(),
                            providerMetadata: {
                                account_id: account.account_id,
                            },
                        });
                    }
                }
                catch (err) {
                    // Continue if balance fetch fails
                    console.error(`Failed to fetch balance for account ${account.account_id}:`, err);
                }
            }
            // Fetch transactions for each account
            for (const account of accountsData.results || []) {
                try {
                    const fromDate = options.since
                        ? options.since.toISOString().split("T")[0]
                        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                    const toDate = options.until
                        ? options.until.toISOString().split("T")[0]
                        : new Date().toISOString().split("T")[0];
                    const transactionsResponse = await fetch(`${apiUrl}/data/v1/accounts/${account.account_id}/transactions?from=${fromDate}&to=${toDate}`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });
                    if (transactionsResponse.ok) {
                        const transactionsData = await transactionsResponse.json();
                        rawPayloads.push({ type: "transactions", payload: transactionsData });
                        // Normalize transactions
                        for (const tx of transactionsData.results || []) {
                            const amountCents = Math.round((tx.amount || 0) * 100);
                            transactions.push({
                                externalId: tx.transaction_id,
                                accountId: account.account_id,
                                transactionType: tx.transaction_type === "DEBIT" ? "debit" : "credit",
                                amountCents: Math.abs(amountCents),
                                currency: tx.currency || account.currency || "GBP",
                                occurredAt: new Date(tx.timestamp),
                                description: tx.description || tx.merchant_name,
                                providerMetadata: {
                                    transaction_category: tx.transaction_category,
                                    transaction_classification: tx.transaction_classification,
                                    merchant_name: tx.merchant_name,
                                    running_balance: tx.running_balance,
                                },
                                idempotencyKey: `${tx.transaction_id}-${tx.timestamp}`,
                            });
                        }
                    }
                }
                catch (err) {
                    // Continue if transaction fetch fails for one account
                    console.error(`Failed to fetch transactions for account ${account.account_id}:`, err);
                }
            }
            return {
                hasMore: false,
                counts: {
                    accounts: accounts.length,
                    transactions: transactions.length,
                    balances: balances.length,
                },
                accounts,
                transactions,
                balances,
                rawPayloads,
            };
        }
        catch (error) {
            if (error instanceof connector_driver_1.ConnectorError) {
                throw error;
            }
            throw new connector_driver_1.ConnectorError(`TrueLayer sync failed: ${error instanceof Error ? error.message : String(error)}`, "TRUELAYER_SYNC_FAILED", "truelayer", error instanceof Error ? error : undefined);
        }
    }
    async handleWebhook(_payload, _credentials) {
        // TrueLayer webhooks indicate when to sync
        return {
            accounts: [],
            transactions: [],
            balances: [],
        };
    }
}
exports.TrueLayerDriver = TrueLayerDriver;
//# sourceMappingURL=truelayer.js.map