/**
 * Value Events Tracking
 *
 * Canonical mapping of real value events that Settler delivers.
 * These are measurable, defensible value signals - not vanity metrics.
 *
 * PHASE 1: VALUE SURFACE MAPPING
 */

import { Prisma } from "@prisma/client";

export type ValueEventType =
  // Reconciliation value
  | "reconciliation_completed"
  | "reconciliation_matched"
  | "reconciliation_unmatched_detected"
  | "reconciliation_conflict_resolved"
  | "reconciliation_time_saved"

  // Data processing value
  | "records_processed"
  | "records_normalized"
  | "records_validated"
  | "errors_detected"

  // Integration value
  | "integration_connected"
  | "integration_synced"
  | "webhook_received"
  | "data_ingested"

  // Time/value saved
  | "manual_review_avoided"
  | "exception_explained"
  | "drift_detected"
  | "anomaly_detected"

  // User activation
  | "first_reconciliation"
  | "first_integration"
  | "first_api_call"
  | "activation_complete";

export interface ValueEvent {
  type: ValueEventType;
  userId?: string;
  tenantId?: string;
  billingAccountId?: string;
  projectId?: string;

  // Value metrics
  quantity?: number; // e.g., number of records, reconciliations
  amount?: number; // e.g., dollar amount reconciled
  timeSavedMs?: number; // Estimated time saved

  // Context
  metadata?: {
    sourceAdapter?: string;
    targetAdapter?: string;
    reconciliationId?: string;
    integrationId?: string;
    planTier?: string;
    [key: string]: unknown;
  };

  timestamp: Date;
}

/**
 * Map value events to user roles and plan tiers
 */
export const VALUE_EVENT_MAPPING: Record<
  ValueEventType,
  {
    role: "all" | "developer" | "admin" | "viewer";
    planTier: "free" | "starter" | "growth" | "scale" | "enterprise" | "all";
    page?: string; // Where value is perceived
    description: string;
  }
> = {
  reconciliation_completed: {
    role: "all",
    planTier: "all",
    page: "/console/reconciliation-view",
    description: "A reconciliation job completed successfully",
  },
  reconciliation_matched: {
    role: "all",
    planTier: "all",
    page: "/console/reconciliation-view",
    description: "Transactions matched successfully",
  },
  reconciliation_unmatched_detected: {
    role: "all",
    planTier: "all",
    page: "/console/reconciliation-view",
    description: "Unmatched transactions detected (value: visibility)",
  },
  reconciliation_conflict_resolved: {
    role: "admin",
    planTier: "starter",
    page: "/console/reconciliation-view",
    description: "Conflicting transactions resolved automatically",
  },
  reconciliation_time_saved: {
    role: "all",
    planTier: "all",
    page: "/console",
    description: "Estimated time saved through automation",
  },
  records_processed: {
    role: "all",
    planTier: "all",
    page: "/console/ingestion",
    description: "Records processed through ingestion pipeline",
  },
  records_normalized: {
    role: "developer",
    planTier: "all",
    page: "/console/ingestion",
    description: "Records normalized to standard format",
  },
  records_validated: {
    role: "developer",
    planTier: "all",
    page: "/console/ingestion",
    description: "Records validated against schema",
  },
  errors_detected: {
    role: "all",
    planTier: "all",
    page: "/console",
    description: "Errors detected early (value: prevention)",
  },
  integration_connected: {
    role: "admin",
    planTier: "starter",
    page: "/dashboard/integrations",
    description: "Integration connected successfully",
  },
  integration_synced: {
    role: "all",
    planTier: "starter",
    page: "/dashboard/integrations",
    description: "Integration data synchronized",
  },
  webhook_received: {
    role: "developer",
    planTier: "starter",
    page: "/console/webhooks",
    description: "Webhook event received and processed",
  },
  data_ingested: {
    role: "all",
    planTier: "all",
    page: "/console/ingestion",
    description: "Data ingested from source",
  },
  manual_review_avoided: {
    role: "admin",
    planTier: "growth",
    page: "/console/reconciliation-view",
    description: "Manual review avoided through automation",
  },
  exception_explained: {
    role: "all",
    planTier: "all",
    page: "/console/reconciliation-view",
    description: "Exception explained automatically",
  },
  drift_detected: {
    role: "developer",
    planTier: "growth",
    page: "/console",
    description: "Schema drift detected",
  },
  anomaly_detected: {
    role: "admin",
    planTier: "growth",
    page: "/console",
    description: "Anomaly detected in data",
  },
  first_reconciliation: {
    role: "all",
    planTier: "all",
    page: "/console/playground/reconcile",
    description: "First reconciliation completed (activation)",
  },
  first_integration: {
    role: "admin",
    planTier: "starter",
    page: "/dashboard/integrations",
    description: "First integration connected (activation)",
  },
  first_api_call: {
    role: "developer",
    planTier: "all",
    page: "/console/api-logs",
    description: "First API call made (activation)",
  },
  activation_complete: {
    role: "all",
    planTier: "all",
    page: "/console",
    description: "User reached activation milestone",
  },
};

/**
 * Track a value event
 * This creates both UsageEvent (for billing) and ValueEvent (for GTM metrics)
 */
export async function trackValueEvent(event: ValueEvent): Promise<void> {
  try {
    // Track as usage event for billing
    if (event.billingAccountId && event.quantity) {
      const { prisma } = await import("@/shared/db/prismaClient");
      await prisma.usageEvent.create({
        data: {
          billingAccountId: event.billingAccountId,
          userId: event.userId,
          tenantId: event.tenantId,
          projectId: event.projectId,
          eventType: `value:${event.type}`,
          quantity: event.quantity,
          metadata: (event.metadata || {}) as Prisma.InputJsonValue,
          timestamp: event.timestamp,
        },
      });
    }

    // Track as analytics event
    if (typeof window !== "undefined") {
      const { trackEvent } = await import("./analytics");
      trackEvent("value_event", {
        type: event.type,
        quantity: event.quantity,
        amount: event.amount,
        timeSavedMs: event.timeSavedMs,
        ...event.metadata,
      });
    }
  } catch (error) {
    // Fail silently - don't break user flow
    console.error("[trackValueEvent] Failed to track:", error);
  }
}

/**
 * Calculate ROI metrics from value events
 */
export interface ROIMetrics {
  totalReconciliations: number;
  totalRecordsProcessed: number;
  totalTimeSavedHours: number;
  totalAmountReconciled: number;
  exceptionsDetected: number;
  integrationsConnected: number;
  estimatedCostSavings: number; // Based on manual work avoided
}

export async function calculateROI(
  billingAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<ROIMetrics> {
  const { prisma } = await import("@/shared/db/prismaClient");

  const events = await prisma.usageEvent.findMany({
    where: {
      billingAccountId,
      eventType: {
        startsWith: "value:",
      },
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const metrics: ROIMetrics = {
    totalReconciliations: 0,
    totalRecordsProcessed: 0,
    totalTimeSavedHours: 0,
    totalAmountReconciled: 0,
    exceptionsDetected: 0,
    integrationsConnected: 0,
    estimatedCostSavings: 0,
  };

  for (const event of events) {
    const eventType = event.eventType.replace("value:", "") as ValueEventType;
    const quantity = Number(event.quantity) || 0;
    const metadata = (event.metadata || {}) as Record<string, unknown>;

    switch (eventType) {
      case "reconciliation_completed":
      case "reconciliation_matched":
        metrics.totalReconciliations += quantity;
        break;
      case "records_processed":
      case "records_normalized":
        metrics.totalRecordsProcessed += quantity;
        break;
      case "reconciliation_time_saved":
      case "manual_review_avoided":
        metrics.totalTimeSavedHours += ((metadata.timeSavedMs as number) || 0) / (1000 * 60 * 60);
        break;
      case "reconciliation_matched":
        if (metadata.amount) {
          metrics.totalAmountReconciled += Number(metadata.amount) || 0;
        }
        break;
      case "reconciliation_unmatched_detected":
      case "exception_explained":
        metrics.exceptionsDetected += quantity;
        break;
      case "integration_connected":
        metrics.integrationsConnected += quantity;
        break;
    }
  }

  // Estimate cost savings: $50/hour manual work * hours saved
  metrics.estimatedCostSavings = metrics.totalTimeSavedHours * 50;

  return metrics;
}
