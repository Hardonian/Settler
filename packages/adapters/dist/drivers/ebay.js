"use strict";
/**
 * eBay Connector Driver
 *
 * eBay marketplace integration
 * Supports OAuth2 flow
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EbayDriver = void 0;
const connector_driver_1 = require("../connector-driver");
class EbayDriver {
    metadata = {
        id: 'ebay',
        displayName: 'eBay',
        category: 'marketplace',
        authType: 'oauth2',
        description: 'Sync eBay sales, payouts, and transactions',
        icon: '🏪',
        documentationUrl: 'https://developer.ebay.com',
        supportsWebhooks: true,
        supportsPolling: true,
        requiredConfig: ['client_id', 'client_secret', 'environment'],
        optionalConfig: ['redirect_uri', 'webhook_secret'],
    };
    getApiUrl(environment) {
        const env = environment || 'sandbox';
        const urls = {
            sandbox: 'https://api.sandbox.ebay.com',
            production: 'https://api.ebay.com',
        };
        return (urls[env] ?? urls.sandbox);
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async getAuthUrl(options) {
        const config = options;
        const apiUrl = this.getApiUrl(config.environment);
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: config.clientId,
            redirect_uri: config.redirectUri || options.redirectUri,
            scope: options.scopes?.join(' ') || 'https://api.ebay.com/oauth/api_scope/sell.finances',
            state: options.state || '',
        });
        return `${apiUrl}/identity/v1/oauth2/authorize?${params.toString()}`;
    }
    async handleCallback(code, _state, options) {
        const config = options;
        const apiUrl = this.getApiUrl(config.environment);
        const response = await fetch(`${apiUrl}/identity/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: config.redirectUri || options.redirectUri,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new connector_driver_1.ConnectorError(`Failed to exchange eBay token: ${error.error || error.error_description}`, 'EBAY_TOKEN_EXCHANGE_FAILED', 'ebay');
        }
        const data = await response.json();
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            tokenType: data.token_type,
        };
    }
    async refreshToken(refreshToken, config) {
        const clientId = config?.client_id;
        const clientSecret = config?.client_secret;
        const env = config?.environment || 'sandbox';
        const apiUrl = this.getApiUrl(env);
        const response = await fetch(`${apiUrl}/identity/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                scope: 'https://api.ebay.com/oauth/api_scope/sell.finances',
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new connector_driver_1.ConnectorError(`Failed to refresh eBay token: ${error.error || error.error_description}`, 'EBAY_REFRESH_FAILED', 'ebay');
        }
        const data = await response.json();
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            tokenType: data.token_type,
        };
    }
    async revoke(_accessToken, _config) {
        // eBay doesn't have explicit revoke endpoint
    }
    async testConnection(options) {
        const { credentials, config } = options;
        const accessToken = credentials.access_token;
        const env = config?.environment || 'sandbox';
        const apiUrl = this.getApiUrl(env);
        try {
            const response = await fetch(`${apiUrl}/sell/account/v1/privilege`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                const error = await response.json();
                return {
                    success: false,
                    error: error.error || 'Connection test failed',
                    message: `Connection test failed: ${error.error}`,
                };
            }
            return {
                success: true,
                message: 'Connection successful',
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
        const accessToken = credentials.access_token;
        const config = credentials.config || {};
        const env = config.environment || 'sandbox';
        const apiUrl = this.getApiUrl(env);
        const payouts = [];
        const transactions = [];
        const rawPayloads = [];
        try {
            // Get payouts
            const payoutsResponse = await fetch(`${apiUrl}/sell/finances/v1/payout`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (payoutsResponse.ok) {
                const payoutsData = await payoutsResponse.json();
                rawPayloads.push({ type: 'payouts', payload: payoutsData });
                for (const payout of payoutsData.payouts || []) {
                    payouts.push({
                        externalId: payout.payoutId,
                        amountCents: Math.round((payout.amount?.value || 0) * 100),
                        currency: payout.amount?.currency || 'USD',
                        status: payout.payoutStatus,
                        initiatedAt: payout.payoutDate ? new Date(payout.payoutDate) : new Date(),
                        providerMetadata: {
                            payout_id: payout.payoutId,
                        },
                        idempotencyKey: `${payout.payoutId}-${payout.payoutDate || Date.now()}`,
                    });
                }
            }
            // Get transactions
            const transactionsResponse = await fetch(`${apiUrl}/sell/finances/v1/transaction`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (transactionsResponse.ok) {
                const transactionsData = await transactionsResponse.json();
                rawPayloads.push({ type: 'transactions', payload: transactionsData });
                for (const tx of transactionsData.transactions || []) {
                    transactions.push({
                        externalId: tx.transactionId,
                        transactionType: tx.transactionType === 'DEBIT' ? 'debit' : 'credit',
                        amountCents: Math.round((tx.amount?.value || 0) * 100),
                        currency: tx.amount?.currency || 'USD',
                        occurredAt: tx.transactionDate ? new Date(tx.transactionDate) : new Date(),
                        description: tx.transactionMemo || `eBay transaction ${tx.transactionId}`,
                        providerMetadata: {
                            transaction_id: tx.transactionId,
                            order_id: tx.orderId,
                        },
                        idempotencyKey: `${tx.transactionId}-${tx.transactionDate || Date.now()}`,
                    });
                }
            }
            return {
                nextCursor: undefined,
                hasMore: false,
                counts: {
                    payouts: payouts.length,
                    transactions: transactions.length,
                },
                payouts,
                transactions,
                rawPayloads,
            };
        }
        catch (error) {
            if (error instanceof connector_driver_1.ConnectorError) {
                throw error;
            }
            throw new connector_driver_1.ConnectorError(`eBay sync failed: ${error instanceof Error ? error.message : String(error)}`, 'EBAY_SYNC_FAILED', 'ebay', error instanceof Error ? error : undefined);
        }
    }
}
exports.EbayDriver = EbayDriver;
//# sourceMappingURL=ebay.js.map