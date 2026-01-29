/**
 * Avalara Connector Driver
 *
 * Avalara tax integration
 * Supports API key authentication
 */

import {
  ConnectorDriver,
  ConnectorMetadata,
  TestConnectionOptions,
  TestConnectionResult,
  SyncOptions,
  SyncResult,
  NormalizedTaxEstimate,
  ConnectorError,
} from "../connector-driver";

export class AvalaraDriver implements ConnectorDriver {
  readonly metadata: ConnectorMetadata = {
    id: "avalara",
    displayName: "Avalara",
    category: "tax",
    authType: "api_key",
    description: "Sync tax estimates, transactions, and filings from Avalara",
    icon: "📋",
    documentationUrl: "https://developer.avalara.com",
    supportsWebhooks: true,
    supportsPolling: true,
    requiredConfig: ["account_id", "license_key", "environment"],
    optionalConfig: ["company_id"],
  };

  private getApiUrl(environment: string): string {
    const env = environment || "sandbox";
    const urls: Record<string, string> = {
      sandbox: "https://sandbox-rest.avatax.com",
      production: "https://rest.avatax.com",
    };
    return (urls[env] ?? urls.sandbox) as string;
  }

  async testConnection(options: TestConnectionOptions): Promise<TestConnectionResult> {
    const { credentials, config } = options;
    const accountId = credentials.account_id as string;
    const licenseKey = credentials.license_key as string;
    const env = (config?.environment as string) || "sandbox";
    const apiUrl = this.getApiUrl(env);

    if (!accountId || !licenseKey) {
      return {
        success: false,
        error: "Missing credentials",
        message: "Avalara account_id and license_key are required",
      };
    }

    try {
      const authHeader = Buffer.from(`${accountId}:${licenseKey}`).toString("base64");
      const response = await fetch(`${apiUrl}/api/v2/utilities/ping`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: "Authentication failed",
          message: "Please check your Avalara credentials",
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
      taxEstimates?: NormalizedTaxEstimate[];
      rawPayloads?: Array<{ type: string; payload: unknown }>;
    }
  > {
    const accountId = credentials.account_id as string;
    const licenseKey = credentials.license_key as string;
    const config = (credentials.config as Record<string, unknown>) || {};
    const env = (config.environment as string) || "sandbox";
    const apiUrl = this.getApiUrl(env);

    const taxEstimates: NormalizedTaxEstimate[] = [];
    const rawPayloads: Array<{ type: string; payload: unknown }> = [];

    const authHeader = Buffer.from(`${accountId}:${licenseKey}`).toString("base64");

    try {
      // Fetch transactions (which include tax estimates)
      const transactionsResponse = await fetch(`${apiUrl}/api/v2/transactions`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
        },
      });

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        rawPayloads.push({ type: "transactions", payload: transactionsData });

        for (const tx of transactionsData.value || []) {
          if (tx.totalTax && tx.totalTax > 0) {
            taxEstimates.push({
              externalId: tx.id?.toString() || crypto.randomUUID(),
              transactionId: tx.id?.toString(),
              transactionType: "sale",
              amountCents: Math.round((tx.totalAmount || 0) * 100),
              currency: tx.currencyCode || "USD",
              taxAmountCents: Math.round((tx.totalTax || 0) * 100),
              taxRate: tx.totalTax / (tx.totalAmount || 1),
              jurisdiction: tx.addresses?.shipTo?.region || tx.addresses?.shipTo?.country,
              taxType: "sales_tax",
              occurredAt: tx.date ? new Date(tx.date) : new Date(),
              providerMetadata: {
                transaction_id: tx.id,
                company_id: tx.companyId,
              },
              idempotencyKey: `${tx.id}-${tx.date || Date.now()}`,
            });
          }
        }
      }

      return {
        hasMore: false,
        counts: {
          taxEstimates: taxEstimates.length,
        },
        taxEstimates,
        rawPayloads,
      };
    } catch (error) {
      if (error instanceof ConnectorError) {
        throw error;
      }
      throw new ConnectorError(
        `Avalara sync failed: ${error instanceof Error ? error.message : String(error)}`,
        "AVALARA_SYNC_FAILED",
        "avalara",
        error instanceof Error ? error : undefined
      );
    }
  }
}
