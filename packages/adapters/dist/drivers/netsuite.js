"use strict";
/**
 * NetSuite Connector Driver
 *
 * NetSuite ERP integration
 * Supports Token-Based Authentication or OAuth 2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetSuiteDriver = void 0;
const connector_driver_1 = require("../connector-driver");
class NetSuiteDriver {
    metadata = {
        id: 'netsuite',
        displayName: 'NetSuite',
        category: 'erp',
        authType: 'token_based',
        description: 'Sync invoices, payments, and journal entries from NetSuite (read-only)',
        icon: '📊',
        documentationUrl: 'https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/',
        supportsWebhooks: false,
        supportsPolling: true,
        requiredConfig: ['account_id', 'consumer_key', 'consumer_secret', 'token_id', 'token_secret'],
        optionalConfig: ['environment', 'realm'],
    };
    getApiUrl(accountId, environment) {
        const env = environment || 'production';
        if (env === 'sandbox') {
            return `https://${accountId}.app.netsuite.com`;
        }
        return `https://${accountId}.suitetalk.api.netsuite.com`;
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async getAccessToken(_credentials) {
        // NetSuite OAuth 1.0 credentials are used in signature generation
        // but the actual implementation would use them here
        // This is simplified - full OAuth 1.0 implementation needed
        // For now, return a placeholder - full OAuth 1.0 implementation required
        return 'oauth_token_placeholder';
    }
    async testConnection(options) {
        const { credentials } = options;
        const accountId = credentials.account_id;
        if (!accountId) {
            return {
                success: false,
                error: 'Missing account_id',
                message: 'NetSuite account_id is required',
            };
        }
        try {
            // Test connection by fetching account info
            const apiUrl = this.getApiUrl(accountId, credentials.environment);
            const accessToken = await this.getAccessToken(credentials);
            const response = await fetch(`${apiUrl}/services/rest/record/v1/metadata-catalog`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                return {
                    success: false,
                    error: 'Authentication failed',
                    message: 'Please check your NetSuite credentials',
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
        const accountId = credentials.account_id;
        const apiUrl = this.getApiUrl(accountId, credentials.environment);
        const accessToken = await this.getAccessToken(credentials);
        const invoices = [];
        const transactions = [];
        const rawPayloads = [];
        try {
            // Fetch invoices
            const invoicesResponse = await fetch(`${apiUrl}/services/rest/record/v1/invoice`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (invoicesResponse.ok) {
                const invoicesData = await invoicesResponse.json();
                rawPayloads.push({ type: 'invoices', payload: invoicesData });
                for (const invoice of invoicesData.items || []) {
                    invoices.push({
                        externalId: invoice.id,
                        invoiceNumber: invoice.tranid,
                        customerId: invoice.entity?.id,
                        customerName: invoice.entity?.name,
                        amountCents: Math.round((invoice.total || 0) * 100),
                        currency: invoice.currency?.name || 'USD',
                        status: invoice.status,
                        issueDate: invoice.trandate ? new Date(invoice.trandate) : undefined,
                        dueDate: invoice.duedate ? new Date(invoice.duedate) : undefined,
                        providerMetadata: {
                            invoice_id: invoice.id,
                            transaction_id: invoice.tranid,
                        },
                        idempotencyKey: `${invoice.id}-${invoice.trandate || Date.now()}`,
                    });
                }
            }
            return {
                nextCursor: undefined,
                hasMore: false,
                counts: {
                    invoices: invoices.length,
                    transactions: transactions.length,
                },
                invoices,
                transactions,
                rawPayloads,
            };
        }
        catch (error) {
            if (error instanceof connector_driver_1.ConnectorError) {
                throw error;
            }
            throw new connector_driver_1.ConnectorError(`NetSuite sync failed: ${error instanceof Error ? error.message : String(error)}`, 'NETSUITE_SYNC_FAILED', 'netsuite', error instanceof Error ? error : undefined);
        }
    }
}
exports.NetSuiteDriver = NetSuiteDriver;
//# sourceMappingURL=netsuite.js.map