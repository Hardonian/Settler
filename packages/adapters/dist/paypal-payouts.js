"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayPalPayoutsAdapter = void 0;
/**
 * PayPal Payouts Adapter
 * Fetches payout data from PayPal Payouts API
 */
class PayPalPayoutsAdapter {
    name = "paypal-payouts";
    version = "1.0.0";
    async fetch(options) {
        const { config, dateRange } = options;
        const clientId = config.clientId;
        const clientSecret = config.clientSecret;
        if (!clientId || !clientSecret) {
            throw new Error("PayPal client ID and client secret are required");
        }
        // Get access token
        const accessToken = await this.getAccessToken(clientId, clientSecret);
        // Fetch payouts
        const url = "https://api-m.paypal.com/v1/payments/payouts";
        const params = new URLSearchParams({
            page_size: "100",
        });
        if (dateRange?.start && dateRange?.end) {
            params.append("start_date", dateRange.start.toISOString());
            params.append("end_date", dateRange.end.toISOString());
        }
        const response = await fetch(`${url}?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            throw new Error(`PayPal Payouts API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const payouts = data.items || [];
        return payouts.map((payout) => this.normalize(payout));
    }
    async getAccessToken(_clientId, _clientSecret) {
        const response = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Accept-Language": "en_US",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "client_credentials",
            }),
        });
        if (!response.ok) {
            throw new Error("Failed to get PayPal access token");
        }
        const data = await response.json();
        return data.access_token;
    }
    normalize(data) {
        const payout = data;
        return {
            id: payout.payout_item_id || payout.payout_batch_id,
            amount: parseFloat(payout.payout_item.amount.value),
            currency: payout.payout_item.amount.currency.toUpperCase(),
            date: new Date(payout.time_processed),
            metadata: {
                payout_batch_id: payout.payout_batch_id,
                payout_item_id: payout.payout_item_id,
                transaction_status: payout.transaction_status,
                receiver: payout.payout_item.receiver,
                source: "paypal_payouts",
            },
            sourceId: payout.payout_item_id,
            referenceId: payout.payout_batch_id,
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
exports.PayPalPayoutsAdapter = PayPalPayoutsAdapter;
//# sourceMappingURL=paypal-payouts.js.map