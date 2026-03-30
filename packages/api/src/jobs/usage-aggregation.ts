/**
 * Usage Aggregation Job
 *
 * Aggregates usage events into daily aggregates for billing.
 * Runs nightly via CRON or scheduled job.
 */

import { supabase } from "../infrastructure/supabase/client";
import { logInfo, logError } from "../utils/logger";
import { checkTenantFrozen } from "../middleware/governance";

const SYNC_FUNCTION_PATH = "/functions/v1/sync-usage-to-stripe";
const DEFAULT_EDGE_TIMEOUT_MS = 15_000;
const DEFAULT_EDGE_MAX_ATTEMPTS = 3;
const DEFAULT_EDGE_BASE_DELAY_MS = 500;
const DEFAULT_SYNC_CONCURRENCY = 5;

function getRequiredSecureEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (name === "SUPABASE_URL" && !value.startsWith("https://")) {
    throw new Error("SUPABASE_URL must use https:// for secure service-role transit");
  }
  return value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(response: Response): number | null {
  const retryAfter = response.headers.get("retry-after");
  if (!retryAfter) {
    return null;
  }

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const dateMs = Date.parse(retryAfter);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return null;
}

function computeBackoffMs(attempt: number, baseDelayMs: number): number {
  const exponential = baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * Math.min(250, baseDelayMs));
  return exponential + jitter;
}

async function syncBillingAccountWithRetries(params: {
  syncUrl: string;
  serviceRoleKey: string;
  billingAccountId: string;
  dateStr: string;
  maxAttempts?: number;
  timeoutMs?: number;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const maxAttempts = params.maxAttempts ?? DEFAULT_EDGE_MAX_ATTEMPTS;
  const timeoutMs = params.timeoutMs ?? DEFAULT_EDGE_TIMEOUT_MS;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(params.syncUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billing_account_id: params.billingAccountId,
          date: params.dateStr,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.ok) {
        return { ok: true };
      }

      const responseBody = await response.text().catch(() => "");
      const retryable = response.status === 429 || response.status >= 500;

      if (!retryable || attempt === maxAttempts) {
        return {
          ok: false,
          reason: `HTTP ${response.status}: ${responseBody || response.statusText}`,
        };
      }

      const retryAfter = parseRetryAfterMs(response);
      const delayMs = retryAfter ?? computeBackoffMs(attempt, DEFAULT_EDGE_BASE_DELAY_MS);
      logInfo("Retrying Stripe usage sync edge call", {
        billingAccountId: params.billingAccountId,
        attempt,
        maxAttempts,
        delayMs,
        status: response.status,
      });
      await sleep(delayMs);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt === maxAttempts) {
        return { ok: false, reason: message };
      }
      const delayMs = computeBackoffMs(attempt, DEFAULT_EDGE_BASE_DELAY_MS);
      logInfo("Retrying Stripe usage sync edge call after network failure", {
        billingAccountId: params.billingAccountId,
        attempt,
        maxAttempts,
        delayMs,
        error: message,
      });
      await sleep(delayMs);
    }
  }

  return { ok: false, reason: "Unknown retry exhaustion state" };
}

async function processInBatches<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    await Promise.all(batch.map((item) => worker(item)));
  }
}

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
    const dateStr = date.toISOString().split("T")[0] ?? date.toISOString();
    const supabaseUrl = getRequiredSecureEnv("SUPABASE_URL");
    const serviceRoleKey = getRequiredSecureEnv("SUPABASE_SERVICE_ROLE_KEY");
    const syncUrl = `${supabaseUrl}${SYNC_FUNCTION_PATH}`;

    let syncedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    const eligibleAccounts = [];

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

      eligibleAccounts.push(account);
    }

    await processInBatches(eligibleAccounts, DEFAULT_SYNC_CONCURRENCY, async (account) => {
      const result = await syncBillingAccountWithRetries({
        syncUrl,
        serviceRoleKey,
        billingAccountId: account.id,
        dateStr,
      });

      if (result.ok) {
        syncedCount++;
      } else {
        failedCount++;
        logError("Failed to sync usage to Stripe", new Error(result.reason), {
          billingAccountId: account.id,
        });
      }
    });

    logInfo("Stripe usage sync completed", {
      totalAccounts: billingAccounts.length,
      eligibleAccounts: eligibleAccounts.length,
      syncedCount,
      skippedCount,
      failedCount,
      date: dateStr,
      degraded: failedCount > 0,
      degradedReason:
        failedCount > 0
          ? "One or more account sync edge calls exhausted retries or were rejected"
          : undefined,
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
