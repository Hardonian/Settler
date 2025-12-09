"use strict";
/**
 * Billing Helper Functions
 *
 * Utility functions for billing operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBillingAccount = getBillingAccount;
exports.getActiveSubscription = getActiveSubscription;
const client_1 = require("../infrastructure/supabase/client");
const logger_1 = require("./logger");
/**
 * Get billing account for user
 */
async function getBillingAccount(userId, _tenantId) {
    try {
        const query = client_1.supabase
            .from("billing_accounts")
            .select("*")
            .eq("user_id", userId)
            .is("deleted_at", null)
            .eq("status", "active")
            .single();
        const { data, error } = await query;
        if (error || !data) {
            return null;
        }
        return data;
    }
    catch (error) {
        (0, logger_1.logError)("Error fetching billing account", error);
        return null;
    }
}
/**
 * Get active subscription for billing account
 */
async function getActiveSubscription(billingAccountId) {
    try {
        const { data, error } = await client_1.supabase
            .from("subscriptions")
            .select("*")
            .eq("billing_account_id", billingAccountId)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
        if (error || !data) {
            return null;
        }
        return data;
    }
    catch (error) {
        (0, logger_1.logError)("Error fetching subscription", error);
        return null;
    }
}
//# sourceMappingURL=billing-helpers.js.map