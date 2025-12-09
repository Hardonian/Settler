"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaCommerceAdapter = void 0;
/**
 * Meta Commerce + Meta Ads Adapter
 * Fetches data from Facebook/Instagram Commerce and Ads APIs
 */
class MetaCommerceAdapter {
    name = "meta-commerce";
    version = "1.0.0";
    async fetch(options) {
        const { config, dateRange } = options;
        const accessToken = config.accessToken;
        const businessId = config.businessId;
        if (!accessToken || !businessId) {
            throw new Error("Meta access token and business ID are required");
        }
        const results = [];
        // Fetch Commerce orders
        try {
            const commerceUrl = `https://graph.facebook.com/v18.0/${businessId}/commerce_orders`;
            const commerceParams = new URLSearchParams({
                access_token: accessToken,
                fields: "id,order_status,created_time,order_details",
            });
            if (dateRange?.start && dateRange?.end) {
                commerceParams.append("since", Math.floor(dateRange.start.getTime() / 1000).toString());
                commerceParams.append("until", Math.floor(dateRange.end.getTime() / 1000).toString());
            }
            const commerceResponse = await fetch(`${commerceUrl}?${commerceParams.toString()}`);
            if (commerceResponse.ok) {
                const commerceData = await commerceResponse.json();
                const orders = commerceData.data || [];
                results.push(...orders.map((order) => this.normalizeCommerceOrder(order)));
            }
        }
        catch (error) {
            console.error("Error fetching Meta Commerce orders:", error);
        }
        // Fetch Ads spend
        try {
            const adsUrl = `https://graph.facebook.com/v18.0/${businessId}/insights`;
            const adsParams = new URLSearchParams({
                access_token: accessToken,
                fields: "spend,date_start,date_stop,campaign_id",
                level: "campaign",
            });
            if (dateRange?.start && dateRange?.end) {
                adsParams.append("time_range", JSON.stringify({
                    since: dateRange.start.toISOString(),
                    until: dateRange.end.toISOString(),
                }));
            }
            const adsResponse = await fetch(`${adsUrl}?${adsParams.toString()}`);
            if (adsResponse.ok) {
                const adsData = await adsResponse.json();
                const insights = adsData.data || [];
                results.push(...insights.map((insight) => this.normalizeAdsSpend(insight)));
            }
        }
        catch (error) {
            console.error("Error fetching Meta Ads spend:", error);
        }
        return results;
    }
    normalizeCommerceOrder(data) {
        const order = data;
        return {
            id: `meta_commerce_${order.id}`,
            amount: order.order_details?.total_amount?.value || 0,
            currency: (order.order_details?.total_amount?.currency || "USD").toUpperCase(),
            date: new Date(order.created_time),
            metadata: {
                order_id: order.id,
                order_status: order.order_status,
                source: "meta_commerce",
            },
            sourceId: order.id,
            referenceId: order.id,
        };
    }
    normalizeAdsSpend(data) {
        const insight = data;
        return {
            id: `meta_ads_${insight.campaign_id}_${insight.date_start}`,
            amount: parseFloat(insight.spend),
            currency: "USD",
            date: new Date(insight.date_start),
            metadata: {
                campaign_id: insight.campaign_id,
                source: "meta_ads",
                type: "ad_spend",
            },
            sourceId: insight.campaign_id,
        };
    }
    normalize(data) {
        // Default normalization (used for validation)
        const item = data;
        return {
            id: item.id,
            amount: item.amount,
            currency: item.currency.toUpperCase(),
            date: new Date(item.date),
            metadata: {},
            sourceId: item.id,
        };
    }
    validate(data) {
        const errors = [];
        if (!data.id) {
            errors.push("ID is required");
        }
        if (data.amount <= 0) {
            errors.push("Amount must be greater than 0");
        }
        if (!data.currency) {
            errors.push("Currency is required");
        }
        if (!data.date) {
            errors.push("Date is required");
        }
        return errors.length === 0 ? { valid: true } : { valid: false, errors };
    }
}
exports.MetaCommerceAdapter = MetaCommerceAdapter;
//# sourceMappingURL=meta-commerce.js.map