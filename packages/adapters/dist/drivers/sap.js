"use strict";
/**
 * SAP Connector Driver
 *
 * SAP ERP integration
 * Supports generic OData endpoint configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SapDriver = void 0;
const connector_driver_1 = require("../connector-driver");
class SapDriver {
    metadata = {
        id: "sap",
        displayName: "SAP",
        category: "erp",
        authType: "oauth2",
        description: "Sync invoices, payments, and journal entries from SAP via OData endpoints (read-only)",
        icon: "🏢",
        documentationUrl: "https://help.sap.com/docs/SAP_S4HANA_ON_PREMISE",
        supportsWebhooks: false,
        supportsPolling: true,
        requiredConfig: ["odata_url", "username", "password"],
        optionalConfig: ["client", "system_number", "application_server"],
    };
    async testConnection(options) {
        const { credentials } = options;
        const odataUrl = credentials.odata_url;
        const username = credentials.username;
        const password = credentials.password;
        if (!odataUrl || !username || !password) {
            return {
                success: false,
                error: "Missing required configuration",
                message: "OData URL, username, and password are required",
            };
        }
        try {
            // Test connection by fetching service document
            const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
            const response = await fetch(`${odataUrl}/$metadata`, {
                method: "GET",
                headers: {
                    Authorization: authHeader,
                    "Content-Type": "application/xml",
                },
            });
            if (!response.ok) {
                return {
                    success: false,
                    error: "Authentication failed",
                    message: "Please check your SAP credentials",
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
        const odataUrl = credentials.odata_url;
        const username = credentials.username;
        const password = credentials.password;
        const config = credentials.config || {};
        const invoices = [];
        const transactions = [];
        const rawPayloads = [];
        const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
        try {
            // Map endpoints from config (connector wizard should set these)
            const invoiceEndpoint = config.invoice_endpoint || "InvoiceSet";
            const transactionEndpoint = config.transaction_endpoint || "TransactionSet";
            // Fetch invoices
            const invoicesResponse = await fetch(`${odataUrl}/${invoiceEndpoint}`, {
                method: "GET",
                headers: {
                    Authorization: authHeader,
                    "Content-Type": "application/json",
                },
            });
            if (invoicesResponse.ok) {
                const invoicesData = await invoicesResponse.json();
                rawPayloads.push({ type: "invoices", payload: invoicesData });
                for (const invoice of invoicesData.value || []) {
                    invoices.push({
                        externalId: invoice.InvoiceNumber || invoice.Id,
                        invoiceNumber: invoice.InvoiceNumber,
                        customerId: invoice.CustomerId,
                        customerName: invoice.CustomerName,
                        amountCents: Math.round((invoice.Amount || 0) * 100),
                        currency: invoice.Currency || "USD",
                        status: invoice.Status,
                        ...(invoice.InvoiceDate ? { issueDate: new Date(invoice.InvoiceDate) } : {}),
                        ...(invoice.DueDate ? { dueDate: new Date(invoice.DueDate) } : {}),
                        providerMetadata: {
                            invoice_id: invoice.Id,
                        },
                        idempotencyKey: `${invoice.Id}-${invoice.InvoiceDate || Date.now()}`,
                    });
                }
            }
            // Fetch transactions
            const transactionsResponse = await fetch(`${odataUrl}/${transactionEndpoint}`, {
                method: "GET",
                headers: {
                    Authorization: authHeader,
                    "Content-Type": "application/json",
                },
            });
            if (transactionsResponse.ok) {
                const transactionsData = await transactionsResponse.json();
                rawPayloads.push({ type: "transactions", payload: transactionsData });
                for (const tx of transactionsData.value || []) {
                    transactions.push({
                        externalId: tx.TransactionId || tx.Id,
                        transactionType: tx.Amount >= 0 ? "credit" : "debit",
                        amountCents: Math.round(Math.abs(tx.Amount || 0) * 100),
                        currency: tx.Currency || "USD",
                        occurredAt: tx.TransactionDate ? new Date(tx.TransactionDate) : new Date(),
                        description: tx.Description || `SAP transaction ${tx.TransactionId}`,
                        providerMetadata: {
                            transaction_id: tx.Id,
                        },
                        idempotencyKey: `${tx.TransactionId || tx.Id}-${tx.TransactionDate || Date.now()}`,
                    });
                }
            }
            return {
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
            throw new connector_driver_1.ConnectorError(`SAP sync failed: ${error instanceof Error ? error.message : String(error)}`, "SAP_SYNC_FAILED", "sap", error instanceof Error ? error : undefined);
        }
    }
}
exports.SapDriver = SapDriver;
//# sourceMappingURL=sap.js.map