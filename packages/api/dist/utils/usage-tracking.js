"use strict";
/**
 * Usage Tracking Utility
 *
 * Tracks usage events for billing and entitlement enforcement.
 * Works with Supabase client used in API routes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackUsageEvent = trackUsageEvent;
exports.trackIngestionUsage = trackIngestionUsage;
exports.trackExportUsage = trackExportUsage;
const client_1 = require("../infrastructure/supabase/client");
const logger_1 = require("./logger");
/**
 * Track a usage event
 */
async function trackUsageEvent(params) {
    try {
        const { billingAccountId, eventType, quantity = 1, userId, tenantId, projectId, integrationId, metadata = {}, } = params;
        // Insert usage event
        const { error } = await client_1.supabase.from("usage_events").insert({
            billing_account_id: billingAccountId,
            event_type: eventType,
            quantity,
            user_id: userId || null,
            tenant_id: tenantId || null,
            project_id: projectId || null,
            integration_id: integrationId || null,
            metadata: metadata || {},
            timestamp: new Date().toISOString(),
            aggregated: false,
        });
        if (error) {
            (0, logger_1.logError)("Failed to track usage event", error, {
                billingAccountId,
                eventType,
                quantity,
            });
            // Don't throw - usage tracking should not break the main flow
        }
        else {
            (0, logger_1.logInfo)("Usage event tracked", {
                billingAccountId,
                eventType,
                quantity,
            });
        }
    }
    catch (error) {
        (0, logger_1.logError)("Error tracking usage event", error, params);
        // Don't throw - usage tracking should not break the main flow
    }
}
/**
 * Track ingestion usage
 */
async function trackIngestionUsage(params) {
    await trackUsageEvent({
        billingAccountId: params.billingAccountId,
        eventType: "settler-ingestions:create",
        quantity: 1,
        userId: params.userId,
        tenantId: params.tenantId,
        metadata: {
            ingestionId: params.ingestionId,
        },
    });
}
/**
 * Track export usage
 */
async function trackExportUsage(params) {
    await trackUsageEvent({
        billingAccountId: params.billingAccountId,
        eventType: "settler-exports:create",
        quantity: 1,
        userId: params.userId,
        tenantId: params.tenantId,
        metadata: {
            exportId: params.exportId,
        },
    });
}
//# sourceMappingURL=usage-tracking.js.map