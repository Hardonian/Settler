/**
 * Wave Connector Driver
 *
 * Accounting system integration
 * Supports OAuth2 flow (if available) or manual upload
 */

import {
  ConnectorDriver,
  ConnectorMetadata,
  TestConnectionOptions,
  TestConnectionResult,
  SyncOptions,
  SyncResult,
  NormalizedInvoice,
  ConnectorError,
} from "../connector-driver";

export class WaveDriver implements ConnectorDriver {
  readonly metadata: ConnectorMetadata = {
    id: "wave",
    displayName: "Wave Accounting",
    category: "accounting",
    authType: "api_key", // Wave uses API key or manual CSV upload
    description: "Sync invoices and transactions from Wave Accounting via API or CSV import",
    icon: "📊",
    documentationUrl: "https://developer.waveapps.com",
    supportsWebhooks: false,
    supportsPolling: true,
    requiredConfig: ["api_key", "business_id"],
    optionalConfig: [],
  };

  private readonly apiUrl = "https://api.waveapps.com";

  async testConnection(options: TestConnectionOptions): Promise<TestConnectionResult> {
    const { credentials } = options;
    const apiKey = credentials.api_key as string;
    const businessId = credentials.business_id as string;

    try {
      const response = await fetch(`${this.apiUrl}/businesses/${businessId}`, {
        method: "GET",
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
      rawPayloads?: Array<{ type: string; payload: unknown }>;
    }
  > {
    const apiKey = credentials.api_key as string;
    const businessId = credentials.business_id as string;

    const invoices: NormalizedInvoice[] = [];
    const rawPayloads: Array<{ type: string; payload: unknown }> = [];

    try {
      // Fetch invoices
      const invoicesResponse = await fetch(`${this.apiUrl}/businesses/${businessId}/invoices`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!invoicesResponse.ok) {
        const error = await invoicesResponse.json();
        throw new ConnectorError(
          `Failed to fetch invoices: ${error.error || error.message}`,
          "WAVE_INVOICES_FAILED",
          "wave"
        );
      }

      const invoicesData = await invoicesResponse.json();
      rawPayloads.push({ type: "invoices", payload: invoicesData });

      // Normalize invoices
      for (const invoice of invoicesData.invoices || []) {
        invoices.push({
          externalId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          customerId: invoice.customer?.id,
          customerName: invoice.customer?.name,
          amountCents: Math.round((invoice.total?.value || 0) * 100),
          currency: invoice.total?.currency || "USD",
          status: invoice.status,
          ...(invoice.invoice_date ? { issueDate: new Date(invoice.invoice_date) } : {}),
          ...(invoice.due_date ? { dueDate: new Date(invoice.due_date) } : {}),
          ...(invoice.modified_at && invoice.status === "PAID"
            ? { paidAt: new Date(invoice.modified_at) }
            : {}),
          lineItems: invoice.items?.map((item: any) => ({
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
        hasMore: false,
        counts: {
          invoices: invoices.length,
        },
        invoices,
        rawPayloads,
      };
    } catch (error) {
      if (error instanceof ConnectorError) {
        throw error;
      }
      throw new ConnectorError(
        `Wave sync failed: ${error instanceof Error ? error.message : String(error)}`,
        "WAVE_SYNC_FAILED",
        "wave",
        error instanceof Error ? error : undefined
      );
    }
  }
}
