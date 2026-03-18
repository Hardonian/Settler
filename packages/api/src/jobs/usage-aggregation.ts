/**
 * Usage Aggregation Job
 *
 * Aggregates usage events into daily aggregates for billing.
 * Runs nightly via CRON or scheduled job.
 */

import { supabase } from "../infrastructure/supabase/client";
import { logInfo, logError } from "../utils/logger";
import { checkTenantFrozen } from "../middleware/governance";

/**
 * Aggregate usage events for a date range
 */
export async function aggregateUsageEvents(
  startDate: Date = new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
  endDate: Date = new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
): Promise<number> {
  try {
    logInfo("Starting usage aggregation", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Call database function to aggregate
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const { data: count, error } = await supabase.rpc("aggregate_daily_usage", {
      p_start_date: startDateStr,
      p_end_date: endDateStr,
    });

    if (error) {
      logError("Error aggregating usage events", error);
      throw error;
    }

    logInfo("Usage aggregation completed", {
      aggregatedCount: count,
      startDate: startDateStr,
      endDate: endDateStr,
    });

    return count || 0;
  } catch (error) {
    logError("Failed to aggregate usage events", error);
    throw error;
  }
}

/**
 * Sync usage to Stripe for metered billing
 */
export async function syncUsageToStripe(
  date: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)
): Promise<void> {
  try {
    logInfo("Starting Stripe usage sync", { date: date.toISOString() });

    // Get all billing accounts with active subscriptions
    const { data: billingAccounts, error: accountsError } = await supabase
      .from("billing_accounts")
      .select("id, tenant_id, stripe_customer_id")
      .eq("status", "active")
      .not("stripe_customer_id", "is", null);

    if (accountsError) {
      logError("Error fetching billing accounts", accountsError);
      return;
    }

    if (!billingAccounts || billingAccounts.length === 0) {
      logInfo("No billing accounts to sync");
      return;
    }

    // Call edge function for each account (respecting freeze state)
    const dateStr = date.toISOString().split("T")[0];
    let syncedCount = 0;
    let skippedCount = 0;

    for (const account of billingAccounts) {
      // Check governance freeze state before syncing
      if (account.tenant_id) {
        const freezeState = await checkTenantFrozen(account.tenant_id);
        if (freezeState.frozen) {
          logInfo("Skipping Stripe sync for frozen tenant", {
            tenantId: account.tenant_id,
            billingAccountId: account.id,
          });
          skippedCount++;
          continue;
        }
      }

      try {
        const response = await fetch(
          `${process.env.SUPABASE_URL}/functions/v1/sync-usage-to-stripe`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              billing_account_id: account.id,
              date: dateStr,
            }),
          }
        );

        if (response.ok) {
          syncedCount++;
        } else {
          logError("Failed to sync usage to Stripe", new Error(await response.text()), {
            billingAccountId: account.id,
          });
        }
      } catch (error) {
        logError("Error syncing usage to Stripe", error, { billingAccountId: account.id });
      }
    }

    logInfo("Stripe usage sync completed", {
      totalAccounts: billingAccounts.length,
      syncedCount,
      skippedCount,
      date: dateStr,
    });
  } catch (error) {
    logError("Failed to sync usage to Stripe", error);
    throw error;
  }
}

/**
 * Run daily usage aggregation job
 * Should be called by CRON or scheduled job runner
 */
export async function runDailyUsageAggregation(): Promise<void> {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Aggregate usage events
    await aggregateUsageEvents(yesterday, yesterday);

    // Sync to Stripe
    await syncUsageToStripe(yesterday);

    logInfo("Daily usage aggregation job completed");
  } catch (error) {
    logError("Daily usage aggregation job failed", error);
    throw error;
  }
}
