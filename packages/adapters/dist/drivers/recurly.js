"use strict";
/**
 * Recurly Connector Driver
 *
 * Subscription billing engine
 * Supports API key authentication
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurlyDriver = void 0;
const connector_driver_1 = require("../connector-driver");
class RecurlyDriver {
    metadata = {
        id: "recurly",
        displayName: "Recurly",
        category: "subscription_billing",
        authType: "api_key",
        description: "Sync subscriptions, invoices, and customers from Recurly",
        icon: "💳",
        documentationUrl: "https://developers.recurly.com/api",
        supportsWebhooks: true,
        supportsPolling: true,
        requiredConfig: ["api_key", "subdomain"],
        optionalConfig: ["webhook_secret"],
    };
    getApiUrl(subdomain) {
        return `https://${subdomain}.recurly.com/v3`;
    }
    async testConnection(options) {
        const { credentials } = options;
        const apiKey = credentials.api_key;
        const subdomain = credentials.subdomain;
        const apiUrl = this.getApiUrl(subdomain);
        try {
            const response = await fetch(`${apiUrl}/accounts`, {
                method: "GET",
                headers: {
                    Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
                    "Content-Type": "application/json",
                },
                // Limit to 1 for test
            });
            if (!response.ok) {
                return {
                    success: false,
                    error: "Invalid API key or subdomain",
                    message: "Connection test failed: Invalid credentials",
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
    async sync(credentials, options) {
        const apiKey = credentials.api_key;
        const subdomain = credentials.subdomain;
        const apiUrl = this.getApiUrl(subdomain);
        const subscriptions = [];
        const invoices = [];
        const rawPayloads = [];
        const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
        try {
            // Fetch subscriptions
            let subscriptionsUrl = `${apiUrl}/subscriptions`;
            const subscriptionParams = new URLSearchParams();
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
                    "Content-Type": "application/json",
                },
            });
            if (!subscriptionsResponse.ok) {
                const error = await subscriptionsResponse.json();
                throw new connector_driver_1.ConnectorError(`Failed to fetch subscriptions: ${error.error?.message || error.message}`, "RECURLY_SUBSCRIPTIONS_FAILED", "recurly");
            }
            const subscriptionsData = await subscriptionsResponse.json();
            rawPayloads.push({ type: "subscriptions", payload: subscriptionsData });
            // Normalize subscriptions
            for (const sub of subscriptionsData.data || []) {
                subscriptions.push({
                    externalId: sub.id,
                    customerId: sub.account?.id || sub.account_id,
                    planId: sub.plan?.code || sub.plan_code,
                    planName: sub.plan?.name,
                    status: sub.state,
                    billingCycle: sub.plan?.interval_unit,
                    amountCents: Math.round((sub.unit_amount || 0) * 100),
                    currency: sub.currency || "USD",
                    ...(sub.current_period_started_at
                        ? { currentPeriodStart: new Date(sub.current_period_started_at) }
                        : {}),
                    ...(sub.current_period_ends_at
                        ? { currentPeriodEnd: new Date(sub.current_period_ends_at) }
                        : {}),
                    cancelAtPeriodEnd: sub.cancel_at || false,
                    ...(sub.canceled_at ? { cancelledAt: new Date(sub.canceled_at) } : {}),
                    providerMetadata: {
                        subscription_id: sub.id,
                        plan_code: sub.plan_code,
                    },
                    idempotencyKey: `${sub.id}-${sub.current_period_starts_at || Date.now()}`,
                });
            }
            // Fetch invoices
            let invoicesUrl = `${apiUrl}/invoices`;
            const invoiceParams = new URLSearchParams();
            if (options.since) {
                invoiceParams.append("begin_time", options.since.toISOString());
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
                    "Content-Type": "application/json",
                },
            });
            if (invoicesResponse.ok) {
                const invoicesData = await invoicesResponse.json();
                rawPayloads.push({ type: "invoices", payload: invoicesData });
                // Normalize invoices
                for (const inv of invoicesData.data || []) {
                    invoices.push({
                        externalId: inv.id,
                        invoiceNumber: inv.number,
                        customerId: inv.account?.id || inv.account_id,
                        amountCents: Math.round((inv.total || 0) * 100),
                        currency: inv.currency || "USD",
                        status: inv.state,
                        ...(inv.created_at ? { issueDate: new Date(inv.created_at) } : {}),
                        ...(inv.paid_at ? { paidAt: new Date(inv.paid_at) } : {}),
                        providerMetadata: {
                            invoice_id: inv.id,
                            subscription_id: inv.subscription_id,
                        },
                        idempotencyKey: `${inv.id}-${inv.created_at || Date.now()}`,
                    });
                }
            }
            return {
                hasMore: false,
                counts: {
                    subscriptions: subscriptions.length,
                    invoices: invoices.length,
                },
                subscriptions,
                invoices,
                rawPayloads,
            };
        }
        catch (error) {
            if (error instanceof connector_driver_1.ConnectorError) {
                throw error;
            }
            throw new connector_driver_1.ConnectorError(`Recurly sync failed: ${error instanceof Error ? error.message : String(error)}`, "RECURLY_SYNC_FAILED", "recurly", error instanceof Error ? error : undefined);
        }
    }
    async handleWebhook(_payload, _credentials) {
        // Recurly webhooks indicate when to sync
        return {
            subscriptions: [],
            invoices: [],
        };
    }
}
exports.RecurlyDriver = RecurlyDriver;
//# sourceMappingURL=recurly.js.map