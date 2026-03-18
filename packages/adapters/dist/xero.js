"use strict";
/**
 * Xero Adapter
 * E6: Xero integration for accounting reconciliation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.XeroAdapter = void 0;
class XeroAdapter {
    name = "xero";
    version = "1.0.0";
    config;
    baseUrl = "https://api.xero.com/api.xro/2.0";
    constructor(config) {
        this.config = config;
    }
    async fetch(options) {
        // Get access token (refresh if needed)
        const accessToken = await this.getAccessToken();
        // Fetch transactions from Xero
        const startDate = options.dateRange.start.toISOString().split('T')[0];
        const endDate = options.dateRange.end.toISOString().split('T')[0];
        const response = await fetch(`${this.baseUrl}/BankTransactions?where=Date>=DateTime(${startDate})&where=Date<=DateTime(${endDate})`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Xero-tenant-id": this.config.tenantId,
            },
        });
        if (!response.ok) {
            throw new Error(`Xero API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const transactions = data.BankTransactions || [];
        return transactions.map((tx) => this.normalize(tx));
    }
    normalize(transaction) {
        const tx = transaction;
        return {
            id: tx.BankTransactionID,
            amount: Math.abs(tx.Total),
            currency: tx.CurrencyCode,
            date: new Date(tx.Date),
            metadata: {
                description: tx.LineItems?.[0]?.Description || "Xero Transaction",
                contact: tx.Contact?.Name,
                lineItems: tx.LineItems,
            },
            sourceId: tx.BankTransactionID,
        };
    }
    validate(data) {
        const errors = [];
        if (!data.id) {
            errors.push("Transaction ID is required");
        }
        if (!data.amount || data.amount <= 0) {
            errors.push("Valid amount is required");
        }
        if (!data.currency) {
            errors.push("Currency is required");
        }
        if (!data.date || !(data.date instanceof Date)) {
            errors.push("Valid date is required");
        }
        const result = {
            valid: errors.length === 0,
        };
        if (errors.length > 0) {
            result.errors = errors;
        }
        return result;
    }
    async getAccessToken() {
        if (this.config.accessToken) {
            // TODO: Verify token is still valid, refresh if needed
            return this.config.accessToken;
        }
        // OAuth flow to get access token
        // This should be handled by the user during initial setup
        throw new Error("Xero access token required. Please complete OAuth flow.");
    }
    async refreshAccessToken() {
        if (!this.config.refreshToken) {
            throw new Error("Refresh token required");
        }
        const response = await fetch("https://identity.xero.com/connect/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: this.config.refreshToken,
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to refresh Xero token: ${response.status}`);
        }
        const data = await response.json();
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
        };
    }
    async syncTransaction(transaction) {
        const accessToken = await this.getAccessToken();
        // Create bank transaction in Xero
        const description = typeof transaction.metadata?.description === 'string'
            ? transaction.metadata.description
            : "Settler Transaction";
        const contact = typeof transaction.metadata?.contact === 'string'
            ? transaction.metadata.contact
            : "Settler";
        const xeroTransaction = {
            Type: transaction.amount > 0 ? "RECEIVE" : "SPEND",
            Contact: {
                Name: contact,
            },
            Date: transaction.date.toISOString().split('T')[0],
            LineItems: [
                {
                    Description: description,
                    LineAmount: transaction.amount,
                    AccountCode: "200", // Default account code
                },
            ],
        };
        const response = await fetch(`${this.baseUrl}/BankTransactions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Xero-tenant-id": this.config.tenantId,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(xeroTransaction),
        });
        if (!response.ok) {
            throw new Error(`Failed to sync transaction to Xero: ${response.status}`);
        }
    }
}
exports.XeroAdapter = XeroAdapter;
//# sourceMappingURL=xero.js.map