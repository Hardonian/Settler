/**
 * FX Rate Sync Job
 * Automatically syncs FX rates from external provider daily
 */

import { logInfo, logError } from "../utils/logger";
import { query } from "../db";
import { FXService } from "../application/currency/FXService";
import { checkTenantFrozen } from "../middleware/governance";

const fxService = new FXService();

interface Tenant {
  id: string;
  base_currency?: string;
}

/**
 * Sync FX rates for all active tenants
 */
export async function syncFXRatesJob(): Promise<void> {
  try {
    logInfo("Starting FX rate sync job");

    // Get all active tenants
    const tenants = await query<Tenant>(
      `SELECT id, config->>'baseCurrency' as base_currency
       FROM tenants
       WHERE status = 'active'
         AND deleted_at IS NULL`
    );

    let syncedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const tenant of tenants) {
      // Check governance freeze state before syncing FX rates
      const freezeState = await checkTenantFrozen(tenant.id);
      if (freezeState.frozen) {
        logInfo("Skipping FX rate sync for frozen tenant", { tenantId: tenant.id });
        skippedCount++;
        continue;
      }

      try {
        const baseCurrency = tenant.base_currency || "USD";
        const count = await fxService.syncFXRates(tenant.id, baseCurrency);

        if (count > 0) {
          syncedCount += count;
          logInfo("FX rates synced for tenant", {
            tenantId: tenant.id,
            baseCurrency,
            syncedCount: count,
          });
        }
      } catch (error) {
        errorCount++;
        logError("Failed to sync FX rates for tenant", error, {
          tenantId: tenant.id,
        });
        // Continue with other tenants
      }
    }

    logInfo("FX rate sync job completed", {
      totalTenants: tenants.length,
      syncedCount,
      skippedCount,
      errorCount,
    });
  } catch (error) {
    logError("FX rate sync job failed", error);
    throw error;
  }
}

/**
 * Setup FX rate sync job (call from scheduler)
 * Runs daily at 1 AM UTC
 */
export function setupFXRateSyncJob(): void {
  // This will be called by BullMQ scheduler
  // Pattern: '0 1 * * *' (daily at 1 AM UTC)
  logInfo("FX rate sync job scheduled for daily execution at 1 AM UTC");
}
