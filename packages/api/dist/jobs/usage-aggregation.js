"use strict";
/**
 * Usage Aggregation Job
 *
 * Aggregates usage events into daily aggregates for billing.
 * Runs nightly via CRON or scheduled job.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateUsageEvents = aggregateUsageEvents;
exports.syncUsageToStripe = syncUsageToStripe;
exports.runDailyUsageAggregation = runDailyUsageAggregation;
const client_1 = require("../infrastructure/supabase/client");
const logger_1 = require("../utils/logger");
/**
 * Aggregate usage events for a date range
 */
async function aggregateUsageEvents(startDate = new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
endDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
) {
    try {
        (0, logger_1.logInfo)("Starting usage aggregation", {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });
        // Call database function to aggregate
        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];
        const { data: count, error } = await client_1.supabase.rpc("aggregate_daily_usage", {
            p_start_date: startDateStr,
            p_end_date: endDateStr,
        });
        if (error) {
            (0, logger_1.logError)("Error aggregating usage events", error);
            throw error;
        }
        (0, logger_1.logInfo)("Usage aggregation completed", {
            aggregatedCount: count,
            startDate: startDateStr,
            endDate: endDateStr,
        });
        return count || 0;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to aggregate usage events", error);
        throw error;
    }
}
/**
 * Sync usage to Stripe for metered billing
 */
async function syncUsageToStripe(date = new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    try {
        (0, logger_1.logInfo)("Starting Stripe usage sync", { date: date.toISOString() });
        // Get all billing accounts with active subscriptions
        const { data: billingAccounts, error: accountsError } = await client_1.supabase
            .from("billing_accounts")
            .select("id, stripe_customer_id")
            .eq("status", "active")
            .not("stripe_customer_id", "is", null);
        if (accountsError) {
            (0, logger_1.logError)("Error fetching billing accounts", accountsError);
            return;
        }
        if (!billingAccounts || billingAccounts.length === 0) {
            (0, logger_1.logInfo)("No billing accounts to sync");
            return;
        }
        // Call edge function for each account
        const dateStr = date.toISOString().split("T")[0];
        let syncedCount = 0;
        for (const account of billingAccounts) {
            try {
                const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/sync-usage-to-stripe`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        billing_account_id: account.id,
                        date: dateStr,
                    }),
                });
                if (response.ok) {
                    syncedCount++;
                }
                else {
                    (0, logger_1.logError)("Failed to sync usage to Stripe", new Error(await response.text()), {
                        billingAccountId: account.id,
                    });
                }
            }
            catch (error) {
                (0, logger_1.logError)("Error syncing usage to Stripe", error, { billingAccountId: account.id });
            }
        }
        (0, logger_1.logInfo)("Stripe usage sync completed", {
            totalAccounts: billingAccounts.length,
            syncedCount,
            date: dateStr,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to sync usage to Stripe", error);
        throw error;
    }
}
/**
 * Run daily usage aggregation job
 * Should be called by CRON or scheduled job runner
 */
async function runDailyUsageAggregation() {
    try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        // Aggregate usage events
        await aggregateUsageEvents(yesterday, yesterday);
        // Sync to Stripe
        await syncUsageToStripe(yesterday);
        (0, logger_1.logInfo)("Daily usage aggregation job completed");
    }
    catch (error) {
        (0, logger_1.logError)("Daily usage aggregation job failed", error);
        throw error;
    }
}
//# sourceMappingURL=usage-aggregation.js.map