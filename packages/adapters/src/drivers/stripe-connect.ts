/**
 * Stripe Connect Connector Driver
 * 
 * Stripe Connect integration for connected accounts
 * Supports OAuth2 flow for connected accounts
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
  NormalizedAccount,
  NormalizedPayout,
  NormalizedBalance,
  ConnectorError,
} from '../connector-driver';

export class StripeConnectDriver implements ConnectorDriver {
  readonly metadata: ConnectorMetadata = {
    id: 'stripe-connect',
    displayName: 'Stripe Connect',
    category: 'marketplace',
    authType: 'oauth2',
    description: 'Sync payouts and balances from Stripe Connect connected accounts',
    icon: '💳',
    documentationUrl: 'https://stripe.com/docs/connect',
    supportsWebhooks: true,
    supportsPolling: true,
    requiredConfig: ['client_id', 'client_secret'],
    optionalConfig: ['redirect_uri', 'webhook_secret'],
  };

  async getAuthUrl(options: AuthUrlOptions): Promise<string> {
    const config = options as unknown as { clientId: string; redirectUri: string };
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri || options.redirectUri,
      scope: options.scopes?.join(' ') || 'read_write',
      state: options.state || '',
    });

    return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(
    code: string,
    state: string,
    options: AuthUrlOptions
  ): Promise<AuthCallbackResult> {
    const config = options as unknown as {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };

    const response = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code,
        redirect_uri: config.redirectUri || options.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ConnectorError(
        `Failed to exchange Stripe Connect token: ${error.error || error.error_description}`,
        'STRIPE_CONNECT_TOKEN_EXCHANGE_FAILED',
        'stripe-connect'
      );
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      metadata: {
        stripe_user_id: data.stripe_user_id,
        stripe_publishable_key: data.stripe_publishable_key,
      },
    };
  }

  async refreshToken(
    refreshToken: string,
    config?: Record<string, unknown>
  ): Promise<AuthCallbackResult> {
    const clientId = config?.client_id as string;
    const clientSecret = config?.client_secret as string;

    const response = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ConnectorError(
        `Failed to refresh Stripe Connect token: ${error.error || error.error_description}`,
        'STRIPE_CONNECT_REFRESH_FAILED',
        'stripe-connect'
      );
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  async revoke(accessToken: string, config?: Record<string, unknown>): Promise<void> {
    // Stripe Connect doesn't have explicit revoke endpoint
    // Deauthorize via Stripe Dashboard or API
  }

  async testConnection(options: TestConnectionOptions): Promise<TestConnectionResult> {
    const { credentials } = options;
    const accessToken = credentials.access_token as string;

    try {
      const response = await fetch('https://api.stripe.com/v1/account', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || 'Connection test failed',
          message: `Connection test failed: ${error.error?.message}`,
        };
      }

      return {
        success: true,
        message: 'Connection successful',
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
    options: SyncOptions
  ): Promise<SyncResult & {
    accounts?: NormalizedAccount[];
    payouts?: NormalizedPayout[];
    balances?: NormalizedBalance[];
    rawPayloads?: Array<{ type: string; payload: unknown }>;
  }> {
    const accessToken = credentials.access_token as string;
    const connectedAccountId = (credentials.metadata as Record<string, unknown>)?.stripe_user_id as string;

    const accounts: NormalizedAccount[] = [];
    const payouts: NormalizedPayout[] = [];
    const balances: NormalizedBalance[] = [];
    const rawPayloads: Array<{ type: string; payload: unknown }> = [];

    try {
      // Get account info
      const accountResponse = await fetch('https://api.stripe.com/v1/account', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!accountResponse.ok) {
        const error = await accountResponse.json();
        throw new ConnectorError(
          `Failed to fetch account: ${error.error?.message}`,
          'STRIPE_CONNECT_ACCOUNT_FAILED',
          'stripe-connect'
        );
      }

      const accountData = await accountResponse.json();
      rawPayloads.push({ type: 'account', payload: accountData });

      accounts.push({
        providerAccountId: accountData.id,
        accountName: accountData.business_profile?.name || accountData.email || 'Stripe Account',
        accountType: 'connected_account',
        currency: accountData.default_currency || 'USD',
        institutionName: 'Stripe',
        institutionId: 'stripe',
        metadata: {
          country: accountData.country,
          type: accountData.type,
        },
      });

      // Get balance
      const balanceResponse = await fetch('https://api.stripe.com/v1/balance', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        rawPayloads.push({ type: 'balance', payload: balanceData });

        for (const balance of balanceData.available || []) {
          balances.push({
            accountId: accountData.id,
            balanceCents: balance.amount,
            currency: balance.currency.toUpperCase(),
            snapshotAt: new Date(),
            providerMetadata: {
              account_id: accountData.id,
              source_types: balance.source_types,
            },
          });
        }
      }

      // Get payouts
      const payoutsParams = new URLSearchParams();
      if (options.since) {
        payoutsParams.append('created[gte]', Math.floor(options.since.getTime() / 1000).toString());
      }
      if (options.limit) {
        payoutsParams.append('limit', options.limit.toString());
      }

      const payoutsResponse = await fetch(
        `https://api.stripe.com/v1/payouts?${payoutsParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (payoutsResponse.ok) {
        const payoutsData = await payoutsResponse.json();
        rawPayloads.push({ type: 'payouts', payload: payoutsData });

        for (const payout of payoutsData.data || []) {
          payouts.push({
            externalId: payout.id,
            amountCents: payout.amount,
            currency: payout.currency.toUpperCase(),
            status: payout.status,
            initiatedAt: new Date(payout.created * 1000),
            completedAt: payout.arrival_date ? new Date(payout.arrival_date * 1000) : undefined,
            feeCents: payout.fees || 0,
            netAmountCents: payout.amount - (payout.fees || 0),
            destinationType: payout.destination?.object,
            destinationId: payout.destination?.id,
            description: payout.description,
            providerMetadata: {
              payout_id: payout.id,
              method: payout.method,
            },
            idempotencyKey: `${payout.id}-${payout.created}`,
          });
        }
      }

      return {
        nextCursor: undefined,
        hasMore: false,
        counts: {
          accounts: accounts.length,
          payouts: payouts.length,
          balances: balances.length,
        },
        accounts,
        payouts,
        balances,
        rawPayloads,
      };
    } catch (error) {
      if (error instanceof ConnectorError) {
        throw error;
      }
      throw new ConnectorError(
        `Stripe Connect sync failed: ${error instanceof Error ? error.message : String(error)}`,
        'STRIPE_CONNECT_SYNC_FAILED',
        'stripe-connect',
        error instanceof Error ? error : undefined
      );
    }
  }

  async handleWebhook(
    payload: { eventId: string; eventType: string; payload: unknown; signature?: string },
    credentials: Record<string, unknown>
  ): Promise<{
    accounts?: NormalizedAccount[];
    payouts?: NormalizedPayout[];
    balances?: NormalizedBalance[];
  }> {
    // Stripe webhooks indicate when to sync
    return {
      accounts: [],
      payouts: [],
      balances: [],
    };
  }
}
