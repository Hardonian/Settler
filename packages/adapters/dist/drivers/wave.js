"use strict";
/**
 * Wave Connector Driver
 *
 * Accounting system integration
 * Supports OAuth2 flow (if available) or manual upload
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaveDriver = void 0;
const connector_driver_1 = require("../connector-driver");
class WaveDriver {
    metadata = {
        id: 'wave',
        displayName: 'Wave Accounting',
        category: 'accounting',
        authType: 'api_key', // Wave uses API key or manual CSV upload
        description: 'Sync invoices and transactions from Wave Accounting via API or CSV import',
        icon: '📊',
        documentationUrl: 'https://developer.waveapps.com',
        supportsWebhooks: false,
        supportsPolling: true,
        requiredConfig: ['api_key', 'business_id'],
        optionalConfig: [],
    };
    apiUrl = 'https://api.waveapps.com';
    async testConnection(options) {
        const { credentials } = options;
        const apiKey = credentials.api_key;
        const businessId = credentials.business_id;
        try {
            const response = await fetch(`${this.apiUrl}/businesses/${businessId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            });
            if (!response.ok) {
                const error = await response.json();
                return {
                    success: false,
                    error: error.error || error.message,
                    message: `Connection test failed: ${error.error || error.message}`,
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
        const apiKey = credentials.api_key;
        const businessId = credentials.business_id;
        const invoices = [];
        const rawPayloads = [];
        try {
            // Fetch invoices
            const invoicesResponse = await fetch(`${this.apiUrl}/businesses/${businessId}/invoices`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            });
            if (!invoicesResponse.ok) {
                const error = await invoicesResponse.json();
                throw new connector_driver_1.ConnectorError(`Failed to fetch invoices: ${error.error || error.message}`, 'WAVE_INVOICES_FAILED', 'wave');
            }
            const invoicesData = await invoicesResponse.json();
            rawPayloads.push({ type: 'invoices', payload: invoicesData });
            // Normalize invoices
            for (const invoice of invoicesData.invoices || []) {
                invoices.push({
                    externalId: invoice.id,
                    invoiceNumber: invoice.invoice_number,
                    customerId: invoice.customer?.id,
                    customerName: invoice.customer?.name,
                    amountCents: Math.round((invoice.total?.value || 0) * 100),
                    currency: invoice.total?.currency || 'USD',
                    status: invoice.status,
                    issueDate: invoice.invoice_date ? new Date(invoice.invoice_date) : undefined,
                    dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
                    paidAt: invoice.modified_at && invoice.status === 'PAID' ? new Date(invoice.modified_at) : undefined,
                    lineItems: invoice.items?.map((item) => ({
                        description: item.description,
                        quantity: item.quantity || 1,
                        unitPriceCents: Math.round((item.price?.value || 0) * 100),
                        totalCents: Math.round((item.amount?.value || 0) * 100),
                    })),
                    providerMetadata: {
                        invoice_id: invoice.id,
                        po_number: invoice.po_number,
                    },
                    idempotencyKey: `${invoice.id}-${invoice.invoice_date || Date.now()}`,
                });
            }
            return {
                nextCursor: undefined,
                hasMore: false,
                counts: {
                    invoices: invoices.length,
                },
                invoices,
                rawPayloads,
            };
        }
        catch (error) {
            if (error instanceof connector_driver_1.ConnectorError) {
                throw error;
            }
            throw new connector_driver_1.ConnectorError(`Wave sync failed: ${error instanceof Error ? error.message : String(error)}`, 'WAVE_SYNC_FAILED', 'wave', error instanceof Error ? error : undefined);
        }
    }
}
exports.WaveDriver = WaveDriver;
//# sourceMappingURL=wave.js.map