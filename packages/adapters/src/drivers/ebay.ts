/**
 * eBay Connector Driver
 *
 * eBay marketplace integration
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
  NormalizedPayout,
  NormalizedTransaction,
  ConnectorError,
} from "../connector-driver";

export class EbayDriver implements ConnectorDriver {
  readonly metadata: ConnectorMetadata = {
    id: "ebay",
    displayName: "eBay",
    category: "marketplace",
    authType: "oauth2",
    description: "Sync eBay sales, payouts, and transactions",
    icon: "🏪",
    documentationUrl: "https://developer.ebay.com",
    supportsWebhooks: true,
    supportsPolling: true,
    requiredConfig: ["client_id", "client_secret", "environment"],
    optionalConfig: ["redirect_uri", "webhook_secret"],
  };

  private getApiUrl(environment: string): string {
    const env = environment || "sandbox";
    const urls: Record<string, string> = {
      sandbox: "https://api.sandbox.ebay.com",
      production: "https://api.ebay.com",
    };
    return (urls[env] ?? urls.sandbox) as string;
  }

  async getAuthUrl(options: AuthUrlOptions): Promise<string> {
    const config = options as unknown as {
      clientId: string;
      redirectUri: string;
      environment: string;
    };
    const apiUrl = this.getApiUrl(config.environment);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: config.redirectUri || options.redirectUri,
      scope: options.scopes?.join(" ") || "https://api.ebay.com/oauth/api_scope/sell.finances",
      state: options.state || "",
    });

    return `${apiUrl}/identity/v1/oauth2/authorize?${params.toString()}`;
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
      environment: string;
    };
    const apiUrl = this.getApiUrl(config.environment);

    const response = await fetch(`${apiUrl}/identity/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: config.redirectUri || options.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ConnectorError(
        `Failed to exchange eBay token: ${error.error || error.error_description}`,
        "EBAY_TOKEN_EXCHANGE_FAILED",
        "ebay"
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

  async refreshToken(
    refreshToken: string,
    config?: Record<string, unknown>
  ): Promise<AuthCallbackResult> {
    const clientId = config?.client_id as string;
    const clientSecret = config?.client_secret as string;
    const env = (config?.environment as string) || "sandbox";
    const apiUrl = this.getApiUrl(env);

    const response = await fetch(`${apiUrl}/identity/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        scope: "https://api.ebay.com/oauth/api_scope/sell.finances",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ConnectorError(
        `Failed to refresh eBay token: ${error.error || error.error_description}`,
        "EBAY_REFRESH_FAILED",
        "ebay"
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
    // eBay doesn't have explicit revoke endpoint
  }

  async testConnection(options: TestConnectionOptions): Promise<TestConnectionResult> {
    const { credentials, config } = options;
    const accessToken = credentials.access_token as string;
    const env = (config?.environment as string) || "sandbox";
    const apiUrl = this.getApiUrl(env);

    try {
      const response = await fetch(`${apiUrl}/sell/account/v1/privilege`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || "Connection test failed",
          message: `Connection test failed: ${error.error}`,
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
      payouts?: NormalizedPayout[];
      transactions?: NormalizedTransaction[];
      rawPayloads?: Array<{ type: string; payload: unknown }>;
    }
  > {
    const accessToken = credentials.access_token as string;
    const config = (credentials.config as Record<string, unknown>) || {};
    const env = (config.environment as string) || "sandbox";
    const apiUrl = this.getApiUrl(env);

    const payouts: NormalizedPayout[] = [];
    const transactions: NormalizedTransaction[] = [];
    const rawPayloads: Array<{ type: string; payload: unknown }> = [];

    try {
      // Get payouts
      const payoutsResponse = await fetch(`${apiUrl}/sell/finances/v1/payout`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (payoutsResponse.ok) {
        const payoutsData = await payoutsResponse.json();
        rawPayloads.push({ type: "payouts", payload: payoutsData });

        for (const payout of payoutsData.payouts || []) {
          payouts.push({
            externalId: payout.payoutId,
            amountCents: Math.round((payout.amount?.value || 0) * 100),
            currency: payout.amount?.currency || "USD",
            status: payout.payoutStatus,
            initiatedAt: payout.payoutDate ? new Date(payout.payoutDate) : new Date(),
            providerMetadata: {
              payout_id: payout.payoutId,
            },
            idempotencyKey: `${payout.payoutId}-${payout.payoutDate || Date.now()}`,
          });
        }
      }

      // Get transactions
      const transactionsResponse = await fetch(`${apiUrl}/sell/finances/v1/transaction`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        rawPayloads.push({ type: "transactions", payload: transactionsData });

        for (const tx of transactionsData.transactions || []) {
          transactions.push({
            externalId: tx.transactionId,
            transactionType: tx.transactionType === "DEBIT" ? "debit" : "credit",
            amountCents: Math.round((tx.amount?.value || 0) * 100),
            currency: tx.amount?.currency || "USD",
            occurredAt: tx.transactionDate ? new Date(tx.transactionDate) : new Date(),
            description: tx.transactionMemo || `eBay transaction ${tx.transactionId}`,
            providerMetadata: {
              transaction_id: tx.transactionId,
              order_id: tx.orderId,
            },
            idempotencyKey: `${tx.transactionId}-${tx.transactionDate || Date.now()}`,
          });
        }
      }

      return {
        hasMore: false,
        counts: {
          payouts: payouts.length,
          transactions: transactions.length,
        },
        payouts,
        transactions,
        rawPayloads,
      };
    } catch (error) {
      if (error instanceof ConnectorError) {
        throw error;
      }
      throw new ConnectorError(
        `eBay sync failed: ${error instanceof Error ? error.message : String(error)}`,
        "EBAY_SYNC_FAILED",
        "ebay",
        error instanceof Error ? error : undefined
      );
    }
  }
}
