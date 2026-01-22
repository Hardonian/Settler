/**
 * FreshBooks Connector Driver
 *
 * Accounting system integration
 * Supports OAuth2 flow
 */

import {
  ConnectorDriver,
  ConnectorMetadata,
  AuthUrlOptions,
  AuthCallbackResult,
  TestConnectionOptions,
  TestConnectionResult,
  SyncOptions,
  SyncResult,
  NormalizedInvoice,
  ConnectorError,
} from "../connector-driver";

export class FreshBooksDriver implements ConnectorDriver {
  readonly metadata: ConnectorMetadata = {
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

  private readonly apiUrl = "https://api.freshbooks.com";

  async getAuthUrl(options: AuthUrlOptions): Promise<string> {
    const config = options as unknown as { clientId: string; redirectUri: string };
    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: config.redirectUri || options.redirectUri,
      scope:
        options.scopes?.join(" ") ||
        "user:profile:read accounting:invoices:read accounting:expenses:read",
      state: options.state || "",
    });

    return await Promise.resolve(
      `https://my.freshbooks.com/service/auth/oauth/authorize?${params.toString()}`
    );
  }

  async handleCallback(
    code: string,
    _state: string,
    options: AuthUrlOptions
  ): Promise<AuthCallbackResult> {
    const config = options as unknown as {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };

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
      throw new ConnectorError(
        `Failed to exchange FreshBooks token: ${error.error || error.error_description}`,
        "FRESHBOOKS_TOKEN_EXCHANGE_FAILED",
        "freshbooks"
      );
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

  async refreshToken(
    refreshToken: string,
    config?: Record<string, unknown>
  ): Promise<AuthCallbackResult> {
    const clientId = config?.client_id as string;
    const clientSecret = config?.client_secret as string;

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
      throw new ConnectorError(
        `Failed to refresh FreshBooks token: ${error.error || error.error_description}`,
        "FRESHBOOKS_REFRESH_FAILED",
        "freshbooks"
      );
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };
  }

  async revoke(_accessToken: string, _config?: Record<string, unknown>): Promise<void> {
    // FreshBooks doesn't have explicit revoke endpoint
    // Token will expire naturally
  }

  async testConnection(options: TestConnectionOptions): Promise<TestConnectionResult> {
    const { credentials } = options;
    const accessToken = credentials.access_token as string;

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
    const accessToken = credentials.access_token as string;
    const accountId = (credentials.metadata as Record<string, unknown>)?.account_id as string;

    const invoices: NormalizedInvoice[] = [];
    const rawPayloads: Array<{ type: string; payload: unknown }> = [];

    try {
      // Fetch invoices
      const invoicesResponse = await fetch(
        `${this.apiUrl}/accounting/account/${accountId}/invoices/invoices`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!invoicesResponse.ok) {
        const error = await invoicesResponse.json();
        throw new ConnectorError(
          `Failed to fetch invoices: ${error.error || error.error_description}`,
          "FRESHBOOKS_INVOICES_FAILED",
          "freshbooks"
        );
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
          issueDate: invoice.date ? new Date(invoice.date) : undefined,
          dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
          paidAt: invoice.paid_date ? new Date(invoice.paid_date) : undefined,
          lineItems: invoice.lines?.map(
            (line: { description?: string; qty?: number; amount?: { amount?: number } }) => ({
              description: line.description,
              quantity: line.qty || 1,
              unitPriceCents: Math.round((line.amount?.amount || 0) * 100),
              totalCents: Math.round((line.amount?.amount || 0) * 100),
            })
          ),
          providerMetadata: {
            invoiceid: invoice.invoiceid,
            po_number: invoice.po_number,
          },
          idempotencyKey: `${invoice.invoiceid}-${invoice.date || Date.now()}`,
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
    } catch (error) {
      if (error instanceof ConnectorError) {
        throw error;
      }
      throw new ConnectorError(
        `FreshBooks sync failed: ${error instanceof Error ? error.message : String(error)}`,
        "FRESHBOOKS_SYNC_FAILED",
        "freshbooks",
        error instanceof Error ? error : undefined
      );
    }
  }
}
