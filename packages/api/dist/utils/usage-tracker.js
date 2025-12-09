"use strict";
/**
 * Usage Tracking Utility
 *
 * Helper functions for logging usage events for billing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logUsageEvent = logUsageEvent;
exports.logUsageEventsBatch = logUsageEventsBatch;
exports.getCurrentUsage = getCurrentUsage;
exports.getUsageByIntegration = getUsageByIntegration;
const client_1 = require("../infrastructure/supabase/client");
const logger_1 = require("./logger");
/**
 * Log a single usage event
 */
async function logUsageEvent(params) {
    try {
        const { data: eventId, error } = await client_1.supabase.rpc("log_usage_event", {
            p_billing_account_id: params.billingAccountId,
            p_event_type: params.eventType,
            p_quantity: params.quantity || 1,
            p_project_id: params.projectId || null,
            p_user_id: params.userId || null,
            p_tenant_id: params.tenantId || null,
            p_integration_id: params.integrationId || null,
            p_add_on_id: params.addOnId || null,
            p_unit: params.unit || null,
            p_metadata: params.metadata || {},
        });
        if (error) {
            (0, logger_1.logError)("Error logging usage event", error, { params });
            return null;
        }
        (0, logger_1.logInfo)("Usage event logged", {
            eventId,
            eventType: params.eventType,
            quantity: params.quantity,
            billingAccountId: params.billingAccountId,
        });
        return eventId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to log usage event", error, { params });
        return null;
    }
}
/**
 * Log multiple usage events in batch
 */
async function logUsageEventsBatch(events) {
    const eventIds = [];
    // Log events sequentially to avoid overwhelming the database
    // In production, consider using a queue or batch insert
    for (const event of events) {
        const eventId = await logUsageEvent(event);
        if (eventId) {
            eventIds.push(eventId);
        }
    }
    return eventIds;
}
/**
 * Get current usage for a billing account
 */
async function getCurrentUsage(billingAccountId, eventType, startDate, endDate) {
    try {
        const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate || new Date();
        const { data, error } = await client_1.supabase
            .from("usage_aggregate_daily")
            .select("total_quantity")
            .eq("billing_account_id", billingAccountId)
            .eq("event_type", eventType)
            .gte("date", start.toISOString().split("T")[0])
            .lte("date", end.toISOString().split("T")[0]);
        if (error) {
            (0, logger_1.logError)("Error fetching usage", error);
            return 0;
        }
        return data.reduce((sum, row) => sum + Number(row.total_quantity || 0), 0);
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get current usage", error);
        return 0;
    }
}
/**
 * Get usage breakdown by integration
 */
async function getUsageByIntegration(billingAccountId, startDate, endDate) {
    try {
        const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate || new Date();
        const { data, error } = await client_1.supabase
            .from("usage_aggregate_daily")
            .select("integration_id, total_quantity")
            .eq("billing_account_id", billingAccountId)
            .gte("date", start.toISOString().split("T")[0])
            .lte("date", end.toISOString().split("T")[0])
            .not("integration_id", "is", null);
        if (error) {
            (0, logger_1.logError)("Error fetching usage by integration", error);
            return {};
        }
        const breakdown = {};
        for (const row of data) {
            const integrationId = row.integration_id || "unknown";
            breakdown[integrationId] = (breakdown[integrationId] || 0) + Number(row.total_quantity || 0);
        }
        return breakdown;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get usage by integration", error);
        return {};
    }
}
//# sourceMappingURL=usage-tracker.js.map