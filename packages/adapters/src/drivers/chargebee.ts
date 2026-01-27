/**
 * Chargebee Connector Driver
 *
 * Subscription billing engine
 * Supports API key authentication
 */

import {
  ConnectorDriver,
  ConnectorMetadata,
  TestConnectionOptions,
  TestConnectionResult,
  SyncOptions,
  SyncResult,
  NormalizedSubscription,
  NormalizedInvoice,
  ConnectorError,
} from "../connector-driver";

export class ChargebeeDriver implements ConnectorDriver {
  readonly metadata: ConnectorMetadata = {
    id: "chargebee",
    displayName: "Chargebee",
    category: "subscription_billing",
    authType: "api_key",
    description: "Sync subscriptions, invoices, and customers from Chargebee",
    icon: "💳",
    documentationUrl: "https://apidocs.chargebee.com",
    supportsWebhooks: true,
    supportsPolling: true,
    requiredConfig: ["api_key", "site"],
    optionalConfig: ["webhook_secret"],
  };

  private getApiUrl(site: string): string {
    return `https://${site}.chargebee.com/api/v2`;
  }

  async testConnection(options: TestConnectionOptions): Promise<TestConnectionResult> {
    const { credentials } = options;
    const apiKey = credentials.api_key as string;
    const site = credentials.site as string;
    const apiUrl = this.getApiUrl(site);

    try {
      const response = await fetch(`${apiUrl}/site`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: "Invalid API key or site",
          message: "Connection test failed: Invalid credentials",
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
    options: SyncOptions
  ): Promise<
    SyncResult & {
      subscriptions?: NormalizedSubscription[];
      invoices?: NormalizedInvoice[];
      rawPayloads?: Array<{ type: string; payload: unknown }>;
    }
  > {
    const apiKey = credentials.api_key as string;
    const site = credentials.site as string;
    const apiUrl = this.getApiUrl(site);

    const subscriptions: NormalizedSubscription[] = [];
    const invoices: NormalizedInvoice[] = [];
    const rawPayloads: Array<{ type: string; payload: unknown }> = [];

    const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;

    try {
      // Fetch subscriptions
      let subscriptionsUrl = `${apiUrl}/subscriptions`;
      const subscriptionParams = new URLSearchParams();
      if (options.since) {
        subscriptionParams.append(
          "created_at[after]",
          Math.floor(options.since.getTime() / 1000).toString()
        );
      }
      if (options.limit) {
        subscriptionParams.append("limit", options.limit.toString());
      }
      if (subscriptionParams.toString()) {
        subscriptionsUrl += `?${subscriptionParams.toString()}`;
      }

      const subscriptionsResponse = await fetch(subscriptionsUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      });

      if (!subscriptionsResponse.ok) {
        const error = await subscriptionsResponse.json();
        throw new ConnectorError(
          `Failed to fetch subscriptions: ${error.message || error.error}`,
          "CHARGEBEE_SUBSCRIPTIONS_FAILED",
          "chargebee"
        );
      }

      const subscriptionsData = await subscriptionsResponse.json();
      rawPayloads.push({ type: "subscriptions", payload: subscriptionsData });

      // Normalize subscriptions
      for (const sub of subscriptionsData.list || []) {
        const subscription = sub.subscription;
        subscriptions.push({
          externalId: subscription.id,
          customerId: subscription.customer_id,
          planId: subscription.plan_id,
          planName: subscription.plan_name,
          status: subscription.status,
          billingCycle: subscription.billing_period_unit,
          amountCents: Math.round((subscription.mrr || 0) * 100),
          currency: subscription.currency_code || "USD",
          currentPeriodStart: subscription.current_term_start
            ? new Date(subscription.current_term_start * 1000)
            : undefined,
          currentPeriodEnd: subscription.current_term_end
            ? new Date(subscription.current_term_end * 1000)
            : undefined,
          cancelAtPeriodEnd: subscription.cancel_at_term_end || false,
          cancelledAt: subscription.cancelled_at
            ? new Date(subscription.cancelled_at * 1000)
            : undefined,
          providerMetadata: {
            subscription_id: subscription.id,
            plan_id: subscription.plan_id,
          },
          idempotencyKey: `${subscription.id}-${subscription.created_at || Date.now()}`,
        });
      }

      // Fetch invoices
      let invoicesUrl = `${apiUrl}/invoices`;
      const invoiceParams = new URLSearchParams();
      if (options.since) {
        invoiceParams.append("date[after]", Math.floor(options.since.getTime() / 1000).toString());
      }
      if (options.limit) {
        invoiceParams.append("limit", options.limit.toString());
      }
      if (invoiceParams.toString()) {
        invoicesUrl += `?${invoiceParams.toString()}`;
      }

      const invoicesResponse = await fetch(invoicesUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      });

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        rawPayloads.push({ type: "invoices", payload: invoicesData });

        // Normalize invoices
        for (const inv of invoicesData.list || []) {
          const invoice = inv.invoice;
          invoices.push({
            externalId: invoice.id,
            invoiceNumber: invoice.number,
            customerId: invoice.customer_id,
            amountCents: Math.round((invoice.total || 0) * 100),
            currency: invoice.currency_code || "USD",
            status: invoice.status,
            issueDate: invoice.date ? new Date(invoice.date * 1000) : undefined,
            paidAt: invoice.paid_at ? new Date(invoice.paid_at * 1000) : undefined,
            providerMetadata: {
              invoice_id: invoice.id,
              subscription_id: invoice.subscription_id,
            },
            idempotencyKey: `${invoice.id}-${invoice.date || Date.now()}`,
          });
        }
      }

      return {
        nextCursor: undefined, // Chargebee uses offset-based pagination
        hasMore: false,
        counts: {
          subscriptions: subscriptions.length,
          invoices: invoices.length,
        },
        subscriptions,
        invoices,
        rawPayloads,
      };
    } catch (error) {
      if (error instanceof ConnectorError) {
        throw error;
      }
      throw new ConnectorError(
        `Chargebee sync failed: ${error instanceof Error ? error.message : String(error)}`,
        "CHARGEBEE_SYNC_FAILED",
        "chargebee",
        error instanceof Error ? error : undefined
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async handleWebhook(
    _payload: { eventId: string; eventType: string; payload: unknown; signature?: string },
    _credentials: Record<string, unknown>
  ): Promise<{
    subscriptions?: NormalizedSubscription[];
    invoices?: NormalizedInvoice[];
  }> {
    // Chargebee webhooks indicate when to sync
    return {
      subscriptions: [],
      invoices: [],
    };
  }
}
