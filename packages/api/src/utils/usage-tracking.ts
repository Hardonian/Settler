/**
 * Usage Tracking Utility
 *
 * Tracks usage events for billing and entitlement enforcement.
 * Works with Supabase client used in API routes.
 */

import { supabase } from "../infrastructure/supabase/client";
import { logError, logInfo } from "./logger";

/**
 * Track a usage event
 */
export async function trackUsageEvent(params: {
  billingAccountId: string;
  eventType: string;
  quantity?: number;
  userId?: string;
  tenantId?: string;
  projectId?: string;
  integrationId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const {
      billingAccountId,
      eventType,
      quantity = 1,
      userId,
      tenantId,
      projectId,
      integrationId,
      metadata = {},
    } = params;

    // Insert usage event
    const { error } = await supabase.from("usage_events").insert({
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
      logError("Failed to track usage event", error, {
        billingAccountId,
        eventType,
        quantity,
      });
      // Don't throw - usage tracking should not break the main flow
    } else {
      logInfo("Usage event tracked", {
        billingAccountId,
        eventType,
        quantity,
      });
    }
  } catch (error) {
    logError("Error tracking usage event", error, params);
    // Don't throw - usage tracking should not break the main flow
  }
}

/**
 * Track ingestion usage
 */
export async function trackIngestionUsage(params: {
  billingAccountId: string;
  userId: string;
  tenantId: string;
  ingestionId?: string;
}): Promise<void> {
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
export async function trackExportUsage(params: {
  billingAccountId: string;
  userId: string;
  tenantId: string;
  exportId?: string;
}): Promise<void> {
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
