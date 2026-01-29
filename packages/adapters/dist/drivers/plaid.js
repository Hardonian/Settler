"use strict";
/**
 * Plaid Connector Driver
 *
 * Bank aggregation for North America
 * Supports OAuth2 flow via Plaid Link
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaidDriver = void 0;
const connector_driver_1 = require("../connector-driver");
class PlaidDriver {
    metadata = {
        id: "plaid",
        displayName: "Plaid",
        category: "bank_feed",
        authType: "oauth2",
        description: "Connect your bank accounts via Plaid for automatic transaction and balance sync",
        icon: "🏦",
        documentationUrl: "https://plaid.com/docs",
        supportsWebhooks: true,
        supportsPolling: true,
        requiredConfig: ["client_id", "secret", "environment"],
        optionalConfig: ["webhook_url"],
    };
    getApiUrl(environment) {
        const env = environment || "sandbox";
        const urls = {
            sandbox: "https://sandbox.plaid.com",
            development: "https://development.plaid.com",
            production: "https://production.plaid.com",
        };
        return urls[env] ?? urls.sandbox;
    }
    async getAuthUrl(options) {
        // Plaid uses Link SDK on frontend, but we can generate a link token
        const config = options;
        const apiUrl = this.getApiUrl(config.environment);
        const response = await fetch(`${apiUrl}/link/token/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: config.clientId,
                secret: config.secret,
                user: {
                    client_user_id: options.tenantId,
                },
                client_name: "Settler",
                products: ["transactions", "auth", "identity"],
                country_codes: ["US", "CA"],
                language: "en",
                redirect_uri: options.redirectUri,
                ...(config.webhook_url && { webhook: config.webhook_url }),
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new connector_driver_1.ConnectorError(`Failed to create Plaid link token: ${error.error_message}`, "PLAID_LINK_TOKEN_FAILED", "plaid");
        }
        const data = (await response.json());
        // Return link token - frontend will use Plaid Link SDK
        return data.link_token;
    }
    async handleCallback(publicToken, _state, options) {
        const config = options;
        const apiUrl = this.getApiUrl(config.environment);
        // Exchange public token for access token
        const response = await fetch(`${apiUrl}/item/public_token/exchange`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: config.clientId,
                secret: config.secret,
                public_token: publicToken,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new connector_driver_1.ConnectorError(`Failed to exchange Plaid token: ${error.error_message}`, "PLAID_TOKEN_EXCHANGE_FAILED", "plaid");
        }
        const data = await response.json();
        return {
            accessToken: data.access_token,
            metadata: {
                item_id: data.item_id,
                institution_id: data.institution_id,
            },
        };
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async refreshToken(_refreshToken, _config) {
        // Plaid doesn't use refresh tokens in the traditional sense
        // Access tokens are long-lived, but we can refresh via item/get
        throw new connector_driver_1.ConnectorError("Plaid does not support token refresh", "PLAID_REFRESH_NOT_SUPPORTED", "plaid");
    }
    async revoke(accessToken, config) {
        const env = config?.environment || "sandbox";
        const apiUrl = this.getApiUrl(env);
        const response = await fetch(`${apiUrl}/item/remove`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: config?.client_id,
                secret: config?.secret,
                access_token: accessToken,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new connector_driver_1.ConnectorError(`Failed to revoke Plaid access: ${error.error_message}`, "PLAID_REVOKE_FAILED", "plaid");
        }
    }
    async testConnection(options) {
        const { credentials, config } = options;
        const accessToken = credentials.access_token;
        const env = config?.environment || "sandbox";
        const apiUrl = this.getApiUrl(env);
        try {
            // Test by fetching accounts
            const response = await fetch(`${apiUrl}/accounts/get`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    client_id: config?.client_id,
                    secret: config?.secret,
                    access_token: accessToken,
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                return {
                    success: false,
                    error: error.error_message,
                    message: `Connection test failed: ${error.error_message}`,
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
        const clientId = config.client_id;
        const secret = config.secret;
        const accounts = [];
        const transactions = [];
        const balances = [];
        const rawPayloads = [];
        try {
            // Fetch accounts
            const accountsResponse = await fetch(`${apiUrl}/accounts/get`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    client_id: clientId,
                    secret: secret,
                    access_token: accessToken,
                }),
            });
            if (!accountsResponse.ok) {
                const error = await accountsResponse.json();
                throw new connector_driver_1.ConnectorError(`Failed to fetch accounts: ${error.error_message}`, "PLAID_ACCOUNTS_FAILED", "plaid");
            }
            const accountsData = await accountsResponse.json();
            rawPayloads.push({ type: "accounts", payload: accountsData });
            // Normalize accounts
            for (const account of accountsData.accounts || []) {
                accounts.push({
                    providerAccountId: account.account_id,
                    accountName: account.name,
                    accountType: account.type,
                    currency: account.balances.iso_currency_code || "USD",
                    institutionName: accountsData.item?.institution_id,
                    institutionId: accountsData.item?.institution_id,
                    metadata: {
                        subtype: account.subtype,
                        mask: account.mask,
                    },
                });
                // Extract balance
                balances.push({
                    balanceCents: Math.round((account.balances.current || 0) * 100),
                    accountId: account.account_id,
                    ...(account.balances.available
                        ? { availableBalanceCents: Math.round(account.balances.available * 100) }
                        : {}),
                    currency: account.balances.iso_currency_code || "USD",
                    snapshotAt: new Date(),
                    providerMetadata: {
                        account_id: account.account_id,
                    },
                });
            }
            // Fetch transactions
            const transactionsResponse = await fetch(`${apiUrl}/transactions/sync`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    client_id: clientId,
                    secret: secret,
                    access_token: accessToken,
                    ...(options.cursor ? { cursor: options.cursor } : {}),
                    count: options.limit || 500,
                }),
            });
            if (!transactionsResponse.ok) {
                const error = await transactionsResponse.json();
                throw new connector_driver_1.ConnectorError(`Failed to fetch transactions: ${error.error_message}`, "PLAID_TRANSACTIONS_FAILED", "plaid");
            }
            const transactionsData = await transactionsResponse.json();
            rawPayloads.push({ type: "transactions", payload: transactionsData });
            // Normalize transactions
            for (const tx of transactionsData.added || []) {
                const amountCents = Math.round((tx.amount || 0) * 100);
                transactions.push({
                    externalId: tx.transaction_id,
                    accountId: tx.account_id,
                    transactionType: amountCents >= 0 ? "credit" : "debit",
                    amountCents: Math.abs(amountCents),
                    currency: tx.iso_currency_code || "USD",
                    occurredAt: new Date(tx.date),
                    description: tx.name || tx.merchant_name,
                    ...(tx.pending_transaction_id ? { referenceId: tx.pending_transaction_id } : {}),
                    ...(tx.pending ? { referenceType: "pending_transaction" } : {}),
                    providerMetadata: {
                        category: tx.category,
                        merchant_name: tx.merchant_name,
                        payment_channel: tx.payment_channel,
                        pending: tx.pending,
                    },
                    idempotencyKey: `${tx.transaction_id}-${tx.date}`,
                });
            }
            return {
                nextCursor: transactionsData.next_cursor,
                hasMore: transactionsData.has_more || false,
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
            throw new connector_driver_1.ConnectorError(`Plaid sync failed: ${error instanceof Error ? error.message : String(error)}`, "PLAID_SYNC_FAILED", "plaid", error instanceof Error ? error : undefined);
        }
    }
    async handleWebhook(_payload, _credentials) {
        // Plaid webhooks indicate when to sync
        // Return empty arrays - sync will be triggered separately
        return {
            accounts: [],
            transactions: [],
            balances: [],
        };
    }
}
exports.PlaidDriver = PlaidDriver;
//# sourceMappingURL=plaid.js.map