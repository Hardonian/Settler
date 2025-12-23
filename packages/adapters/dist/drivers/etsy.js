"use strict";
/**
 * Etsy Connector Driver
 *
 * Etsy marketplace integration
 * Supports OAuth2 flow
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EtsyDriver = void 0;
const connector_driver_1 = require("../connector-driver");
class EtsyDriver {
    metadata = {
        id: 'etsy',
        displayName: 'Etsy',
        category: 'marketplace',
        authType: 'oauth2',
        description: 'Sync Etsy shop sales, payouts, and transactions',
        icon: '🛍️',
        documentationUrl: 'https://developers.etsy.com/documentation',
        supportsWebhooks: true,
        supportsPolling: true,
        requiredConfig: ['client_id', 'client_secret'],
        optionalConfig: ['redirect_uri', 'webhook_secret'],
    };
    async getAuthUrl(options) {
        const config = options;
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: config.clientId,
            redirect_uri: config.redirectUri || options.redirectUri,
            scope: options.scopes?.join(' ') || 'listings_r transactions_r shops_r',
            state: options.state || '',
        });
        return `https://www.etsy.com/oauth/connect?${params.toString()}`;
    }
    async handleCallback(code, _state, options) {
        const config = options;
        const response = await fetch('https://api.etsy.com/v3/public/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: config.clientId,
                client_secret: config.clientSecret,
                code: code,
                redirect_uri: config.redirectUri || options.redirectUri,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new connector_driver_1.ConnectorError(`Failed to exchange Etsy token: ${error.error || error.error_description}`, 'ETSY_TOKEN_EXCHANGE_FAILED', 'etsy');
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
        const response = await fetch('https://api.etsy.com/v3/public/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new connector_driver_1.ConnectorError(`Failed to refresh Etsy token: ${error.error || error.error_description}`, 'ETSY_REFRESH_FAILED', 'etsy');
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
        // Etsy doesn't have explicit revoke endpoint
    }
    async testConnection(options) {
        const { credentials } = options;
        const accessToken = credentials.access_token;
        try {
            const response = await fetch('https://api.etsy.com/v3/application/shops', {
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
        const payouts = [];
        const transactions = [];
        const rawPayloads = [];
        try {
            // Get shops
            const shopsResponse = await fetch('https://api.etsy.com/v3/application/shops', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!shopsResponse.ok) {
                const error = await shopsResponse.json();
                throw new connector_driver_1.ConnectorError(`Failed to fetch shops: ${error.error || error.message}`, 'ETSY_SHOPS_FAILED', 'etsy');
            }
            const shopsData = await shopsResponse.json();
            rawPayloads.push({ type: 'shops', payload: shopsData });
            // Get receipts (transactions)
            for (const shop of shopsData.results || []) {
                const shopId = shop.shop_id;
                const receiptsResponse = await fetch(`https://api.etsy.com/v3/application/shops/${shopId}/receipts`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (receiptsResponse.ok) {
                    const receiptsData = await receiptsResponse.json();
                    rawPayloads.push({ type: 'receipts', payload: receiptsData });
                    for (const receipt of receiptsData.results || []) {
                        transactions.push({
                            externalId: receipt.receipt_id.toString(),
                            transactionType: 'credit',
                            amountCents: Math.round((receipt.total_tax_cost?.amount || 0) * 100),
                            currency: receipt.total_tax_cost?.currency_code || 'USD',
                            occurredAt: new Date(receipt.creation_timestamp * 1000),
                            description: `Etsy order ${receipt.receipt_id}`,
                            referenceId: receipt.receipt_id.toString(),
                            referenceType: 'order',
                            providerMetadata: {
                                shop_id: shopId,
                                buyer_email: receipt.buyer_email,
                            },
                            idempotencyKey: `${receipt.receipt_id}-${receipt.creation_timestamp}`,
                        });
                    }
                }
            }
            return {
                nextCursor: undefined,
                hasMore: false,
                counts: {
                    transactions: transactions.length,
                    payouts: payouts.length,
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
            throw new connector_driver_1.ConnectorError(`Etsy sync failed: ${error instanceof Error ? error.message : String(error)}`, 'ETSY_SYNC_FAILED', 'etsy', error instanceof Error ? error : undefined);
        }
    }
}
exports.EtsyDriver = EtsyDriver;
//# sourceMappingURL=etsy.js.map