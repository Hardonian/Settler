"use strict";
/**
 * FreshBooks Connector Driver
 *
 * Accounting system integration
 * Supports OAuth2 flow
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreshBooksDriver = void 0;
const connector_driver_1 = require("../connector-driver");
class FreshBooksDriver {
    metadata = {
        id: "freshbooks",
        displayName: "FreshBooks",
        category: "accounting",
        authType: "oauth2",
        description: "Sync invoices, payments, and expenses from FreshBooks",
        icon: "📊",
        documentationUrl: "https://www.freshbooks.com/api",
        supportsWebhooks: true,
        supportsPolling: true,
        requiredConfig: ["client_id", "client_secret"],
        optionalConfig: ["redirect_uri"],
    };
    apiUrl = "https://api.freshbooks.com";
    // eslint-disable-next-line @typescript-eslint/require-await
    async getAuthUrl(options) {
        const config = options;
        const params = new URLSearchParams({
            response_type: "code",
            client_id: config.clientId,
            redirect_uri: config.redirectUri || options.redirectUri,
            scope: options.scopes?.join(" ") ||
                "user:profile:read accounting:invoices:read accounting:expenses:read",
            state: options.state || "",
        });
        return `https://my.freshbooks.com/service/auth/oauth/authorize?${params.toString()}`;
    }
    async handleCallback(code, _state, options) {
        const config = options;
        const response = await fetch("https://api.freshbooks.com/auth/oauth/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                grant_type: "authorization_code",
                client_id: config.clientId,
                client_secret: config.clientSecret,
                redirect_uri: config.redirectUri || options.redirectUri,
                code: code,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new connector_driver_1.ConnectorError(`Failed to exchange FreshBooks token: ${error.error || error.error_description}`, "FRESHBOOKS_TOKEN_EXCHANGE_FAILED", "freshbooks");
        }
        const data = await response.json();
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            tokenType: data.token_type,
            metadata: {
                account_id: data.accountid,
            },
        };
    }
    async refreshToken(refreshToken, config) {
        const clientId = config?.client_id;
        const clientSecret = config?.client_secret;
        const response = await fetch("https://api.freshbooks.com/auth/oauth/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                grant_type: "refresh_token",
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new connector_driver_1.ConnectorError(`Failed to refresh FreshBooks token: ${error.error || error.error_description}`, "FRESHBOOKS_REFRESH_FAILED", "freshbooks");
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
        // FreshBooks doesn't have explicit revoke endpoint
        // Token will expire naturally
    }
    async testConnection(options) {
        const { credentials } = options;
        const accessToken = credentials.access_token;
        try {
            const response = await fetch(`${this.apiUrl}/auth/api/v1/users/me`, {
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
    async sync(credentials, _options) {
        const accessToken = credentials.access_token;
        const accountId = credentials.metadata?.account_id;
        const invoices = [];
        const rawPayloads = [];
        try {
            // Fetch invoices
            const invoicesResponse = await fetch(`${this.apiUrl}/accounting/account/${accountId}/invoices/invoices`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!invoicesResponse.ok) {
                const error = await invoicesResponse.json();
                throw new connector_driver_1.ConnectorError(`Failed to fetch invoices: ${error.error || error.error_description}`, "FRESHBOOKS_INVOICES_FAILED", "freshbooks");
            }
            const invoicesData = await invoicesResponse.json();
            rawPayloads.push({ type: "invoices", payload: invoicesData });
            // Normalize invoices
            for (const invoice of invoicesData.response?.result?.invoices || []) {
                invoices.push({
                    externalId: invoice.invoiceid,
                    invoiceNumber: invoice.invoice_number,
                    customerId: invoice.customerid,
                    customerName: invoice.customer_name,
                    amountCents: Math.round((invoice.amount?.amount || 0) * 100),
                    currency: invoice.amount?.code || "USD",
                    status: invoice.status,
                    ...(invoice.date ? { issueDate: new Date(invoice.date) } : {}),
                    ...(invoice.due_date ? { dueDate: new Date(invoice.due_date) } : {}),
                    ...(invoice.paid_date ? { paidAt: new Date(invoice.paid_date) } : {}),
                    lineItems: invoice.lines?.map((line) => ({
                        description: line.description,
                        quantity: line.qty || 1,
                        unitPriceCents: Math.round((line.amount?.amount || 0) * 100),
                        totalCents: Math.round((line.amount?.amount || 0) * 100),
                    })),
                    providerMetadata: {
                        invoiceid: invoice.invoiceid,
                        po_number: invoice.po_number,
                    },
                    idempotencyKey: `${invoice.invoiceid}-${invoice.date || Date.now()}`,
                });
            }
            return {
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
            throw new connector_driver_1.ConnectorError(`FreshBooks sync failed: ${error instanceof Error ? error.message : String(error)}`, "FRESHBOOKS_SYNC_FAILED", "freshbooks", error instanceof Error ? error : undefined);
        }
    }
}
exports.FreshBooksDriver = FreshBooksDriver;
//# sourceMappingURL=freshbooks.js.map