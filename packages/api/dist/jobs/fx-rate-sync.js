"use strict";
/**
 * FX Rate Sync Job
 * Automatically syncs FX rates from external provider daily
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncFXRatesJob = syncFXRatesJob;
exports.setupFXRateSyncJob = setupFXRateSyncJob;
const logger_1 = require("../utils/logger");
const db_1 = require("../db");
const FXService_1 = require("../application/currency/FXService");
const fxService = new FXService_1.FXService();
/**
 * Sync FX rates for all active tenants
 */
async function syncFXRatesJob() {
    try {
        (0, logger_1.logInfo)("Starting FX rate sync job");
        // Get all active tenants
        const tenants = await (0, db_1.query)(`SELECT id, config->>'baseCurrency' as base_currency
       FROM tenants
       WHERE status = 'active'
         AND deleted_at IS NULL`);
        let syncedCount = 0;
        let errorCount = 0;
        for (const tenant of tenants) {
            try {
                const baseCurrency = tenant.base_currency || "USD";
                const count = await fxService.syncFXRates(tenant.id, baseCurrency);
                if (count > 0) {
                    syncedCount += count;
                    (0, logger_1.logInfo)("FX rates synced for tenant", {
                        tenantId: tenant.id,
                        baseCurrency,
                        syncedCount: count,
                    });
                }
            }
            catch (error) {
                errorCount++;
                (0, logger_1.logError)("Failed to sync FX rates for tenant", error, {
                    tenantId: tenant.id,
                });
                // Continue with other tenants
            }
        }
        (0, logger_1.logInfo)("FX rate sync job completed", {
            totalTenants: tenants.length,
            syncedCount,
            errorCount,
        });
    }
    catch (error) {
        (0, logger_1.logError)("FX rate sync job failed", error);
        throw error;
    }
}
/**
 * Setup FX rate sync job (call from scheduler)
 * Runs daily at 1 AM UTC
 */
function setupFXRateSyncJob() {
    // This will be called by BullMQ scheduler
    // Pattern: '0 1 * * *' (daily at 1 AM UTC)
    (0, logger_1.logInfo)("FX rate sync job scheduled for daily execution at 1 AM UTC");
}
//# sourceMappingURL=fx-rate-sync.js.map