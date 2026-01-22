/**
 * SAP Connector Driver
 *
 * SAP ERP integration
 * Supports generic OData endpoint configuration
 */

import {
  ConnectorDriver,
  ConnectorMetadata,
  TestConnectionOptions,
  TestConnectionResult,
  SyncOptions,
  SyncResult,
  NormalizedInvoice,
  NormalizedTransaction,
  ConnectorError,
} from "../connector-driver";

export class SapDriver implements ConnectorDriver {
  readonly metadata: ConnectorMetadata = {
    id: "sap",
    displayName: "SAP",
    category: "erp",
    authType: "oauth2",
    description:
      "Sync invoices, payments, and journal entries from SAP via OData endpoints (read-only)",
    icon: "🏢",
    documentationUrl: "https://help.sap.com/docs/SAP_S4HANA_ON_PREMISE",
    supportsWebhooks: false,
    supportsPolling: true,
    requiredConfig: ["odata_url", "username", "password"],
    optionalConfig: ["client", "system_number", "application_server"],
  };

  async testConnection(options: TestConnectionOptions): Promise<TestConnectionResult> {
    const { credentials } = options;
    const odataUrl = credentials.odata_url as string;
    const username = credentials.username as string;
    const password = credentials.password as string;

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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: `Connection test failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async sync(
    credentials: Record<string, unknown>,
    _options: SyncOptions
  ): Promise<
    SyncResult & {
      invoices?: NormalizedInvoice[];
      transactions?: NormalizedTransaction[];
      rawPayloads?: Array<{ type: string; payload: unknown }>;
    }
  > {
    const odataUrl = credentials.odata_url as string;
    const username = credentials.username as string;
    const password = credentials.password as string;
    const config = (credentials.config as Record<string, unknown>) || {};

    const invoices: NormalizedInvoice[] = [];
    const transactions: NormalizedTransaction[] = [];
    const rawPayloads: Array<{ type: string; payload: unknown }> = [];

    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

    try {
      // Map endpoints from config (connector wizard should set these)
      const invoiceEndpoint = (config.invoice_endpoint as string) || "InvoiceSet";
      const transactionEndpoint = (config.transaction_endpoint as string) || "TransactionSet";

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
            issueDate: invoice.InvoiceDate ? new Date(invoice.InvoiceDate) : undefined,
            dueDate: invoice.DueDate ? new Date(invoice.DueDate) : undefined,
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
    } catch (error) {
      if (error instanceof ConnectorError) {
        throw error;
      }
      throw new ConnectorError(
        `SAP sync failed: ${error instanceof Error ? error.message : String(error)}`,
        "SAP_SYNC_FAILED",
        "sap",
        error instanceof Error ? error : undefined
      );
    }
  }
}
