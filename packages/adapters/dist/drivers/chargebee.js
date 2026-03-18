"use strict";
/**
 * Chargebee Connector Driver
 *
 * Subscription billing engine
 * Supports API key authentication
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChargebeeDriver = void 0;
const connector_driver_1 = require("../connector-driver");
class ChargebeeDriver {
    metadata = {
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
    getApiUrl(site) {
        return `https://${site}.chargebee.com/api/v2`;
    }
    async testConnection(options) {
        const { credentials } = options;
        const apiKey = credentials.api_key;
        const site = credentials.site;
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
        const site = credentials.site;
        const apiUrl = this.getApiUrl(site);
        const subscriptions = [];
        const invoices = [];
        const rawPayloads = [];
        const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
        try {
            // Fetch subscriptions
            let subscriptionsUrl = `${apiUrl}/subscriptions`;
            const subscriptionParams = new URLSearchParams();
            if (options.since) {
                subscriptionParams.append("created_at[after]", Math.floor(options.since.getTime() / 1000).toString());
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
                throw new connector_driver_1.ConnectorError(`Failed to fetch subscriptions: ${error.message || error.error}`, "CHARGEBEE_SUBSCRIPTIONS_FAILED", "chargebee");
            }
            const subscriptionsData = await subscriptionsResponse.json();
            rawPayloads.push({ type: "subscriptions", payload: subscriptionsData });
            // Normalize subscriptions
            for (const sub of subscriptionsData.list || []) {
                const subscription = sub.subscription;
                const item = {
                    externalId: subscription.id,
                    customerId: subscription.customer_id,
                    planId: subscription.plan_id,
                    planName: subscription.plan_name,
                    status: subscription.status,
                    billingCycle: subscription.billing_period_unit,
                    amountCents: Math.round((subscription.mrr || 0) * 100),
                    currency: subscription.currency_code || "USD",
                    providerMetadata: {
                        subscription_id: subscription.id,
                        plan_id: subscription.plan_id,
                    },
                    idempotencyKey: `${subscription.id}-${subscription.created_at || Date.now()}`,
                };
                if (subscription.current_term_start) {
                    item.currentPeriodStart = new Date(subscription.current_term_start * 1000);
                }
                if (subscription.current_term_end) {
                    item.currentPeriodEnd = new Date(subscription.current_term_end * 1000);
                }
                if (subscription.cancel_at_term_end) {
                    item.cancelAtPeriodEnd = subscription.cancel_at_term_end;
                }
                if (subscription.cancelled_at) {
                    item.cancelledAt = new Date(subscription.cancelled_at * 1000);
                }
                subscriptions.push(item);
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
                    const invoiceObj = {
                        externalId: invoice.id,
                        invoiceNumber: invoice.number,
                        customerId: invoice.customer_id,
                        amountCents: Math.round((invoice.total || 0) * 100),
                        currency: invoice.currency_code || "USD",
                        status: invoice.status,
                        providerMetadata: {
                            invoice_id: invoice.id,
                            subscription_id: invoice.subscription_id,
                        },
                        idempotencyKey: `${invoice.id}-${invoice.date || Date.now()}`,
                    };
                    if (invoice.date) {
                        invoiceObj.issueDate = new Date(invoice.date * 1000);
                    }
                    if (invoice.paid_at) {
                        invoiceObj.paidAt = new Date(invoice.paid_at * 1000);
                    }
                    invoices.push(invoiceObj);
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
            throw new connector_driver_1.ConnectorError(`Chargebee sync failed: ${error instanceof Error ? error.message : String(error)}`, "CHARGEBEE_SYNC_FAILED", "chargebee", error instanceof Error ? error : undefined);
        }
    }
    async handleWebhook(_payload, _credentials) {
        // Chargebee webhooks indicate when to sync
        return {
            subscriptions: [],
            invoices: [],
        };
    }
}
exports.ChargebeeDriver = ChargebeeDriver;
//# sourceMappingURL=chargebee.js.map