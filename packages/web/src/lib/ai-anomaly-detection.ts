/**
 * AI Anomaly Detection System
 * Detects anomalies in billing, usage, integrations, and performance
 */

import { createClient } from "@/lib/supabase/client";

export type AnomalyType = "billing" | "usage" | "integration" | "performance";

export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  detectedAt: Date;
  metadata: Record<string, unknown>;
}

/**
 * Detect billing anomalies
 */
export async function detectBillingAnomalies(userId: string): Promise<Anomaly[]> {
  const supabase = createClient();
  const anomalies: Anomaly[] = [];

  // Get billing data
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId);

  const { data: usage } = await supabase
    .from("usage_tracking")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!subscriptions || !usage) return anomalies;

  // Check for unusual spending spikes
  const recentUsage = usage.slice(0, 7);
  const avgUsage =
    recentUsage.reduce((sum, u: any) => sum + ((u as any).amount || 0), 0) / recentUsage.length;
  const currentUsage = (usage[0] as any)?.amount || 0;

  if (currentUsage > avgUsage * 2) {
    anomalies.push({
      id: `billing-${Date.now()}`,
      type: "billing",
      severity: "high",
      title: "Unusual Usage Spike Detected",
      description: `Your usage increased by ${((currentUsage / avgUsage - 1) * 100).toFixed(0)}% compared to recent average.`,
      detectedAt: new Date(),
      metadata: { currentUsage, avgUsage, increase: currentUsage / avgUsage },
    });
  }

  // Check for payment failures
  const { data: paymentRecovery } = await supabase
    .from("payment_recovery")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (paymentRecovery) {
    anomalies.push({
      id: `billing-payment-${Date.now()}`,
      type: "billing",
      severity: "critical",
      title: "Payment Issue Detected",
      description: `Payment failure detected: ${(paymentRecovery as any).failure_type}. Action required.`,
      detectedAt: new Date(),
      metadata: { paymentRecovery },
    });
  }

  return anomalies;
}

/**
 * Detect usage anomalies
 */
export async function detectUsageAnomalies(userId: string): Promise<Anomaly[]> {
  const supabase = createClient();
  const anomalies: Anomaly[] = [];

  // Get usage patterns
  const { data: usage } = await supabase
    .from("usage_tracking")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(90); // Last 90 days

  if (!usage || usage.length < 7) return anomalies;

  // Detect sudden drops (potential churn indicator)
  const recentAvg =
    usage.slice(0, 7).reduce((sum, u: any) => sum + ((u as any).amount || 0), 0) / 7;
  const previousAvg =
    usage.slice(7, 14).reduce((sum, u: any) => sum + ((u as any).amount || 0), 0) / 7;

  if (recentAvg < previousAvg * 0.5) {
    anomalies.push({
      id: `usage-drop-${Date.now()}`,
      type: "usage",
      severity: "medium",
      title: "Usage Drop Detected",
      description: `Usage has decreased by ${((1 - recentAvg / previousAvg) * 100).toFixed(0)}% compared to previous period.`,
      detectedAt: new Date(),
      metadata: { recentAvg, previousAvg, drop: (1 - recentAvg / previousAvg) * 100 },
    });
  }

  return anomalies;
}

/**
 * Detect integration anomalies
 */
export async function detectIntegrationAnomalies(userId: string): Promise<Anomaly[]> {
  const supabase = createClient();
  const anomalies: Anomaly[] = [];

  // Get integration health
  const { data: integrations } = await supabase
    .from("integration_credentials")
    .select("*")
    .eq("user_id", userId)
    .eq("is_connected", true);

  if (!integrations) return anomalies;

  for (const integration of integrations) {
    // Check for stale syncs
    if ((integration as any).last_sync_at) {
      const hoursSinceSync =
        (Date.now() - new Date((integration as any).last_sync_at).getTime()) / (1000 * 60 * 60);

      if (hoursSinceSync > 24) {
        anomalies.push({
          id: `integration-stale-${(integration as any).id}`,
          type: "integration",
          severity: "high",
          title: `${(integration as any).integration_id} Not Syncing`,
          description: `Last sync was ${Math.floor(hoursSinceSync)} hours ago. The integration may be disconnected.`,
          detectedAt: new Date(),
          metadata: { integrationId: (integration as any).integration_id, hoursSinceSync },
        });
      }
    }

    // Check for error rates
    // In production, fetch from error logs
    if ((integration as any).status === "error") {
      anomalies.push({
        id: `integration-error-${(integration as any).id}`,
        type: "integration",
        severity: "critical",
        title: `${(integration as any).integration_id} Has Errors`,
        description: "The integration is experiencing errors. Please check the connection.",
        detectedAt: new Date(),
        metadata: { integrationId: (integration as any).integration_id },
      });
    }
  }

  return anomalies;
}

/**
 * Detect performance anomalies
 */
export async function detectPerformanceAnomalies(userId: string): Promise<Anomaly[]> {
  const supabase = createClient();
  const anomalies: Anomaly[] = [];

  // Get job performance data
  const { data: jobs } = await supabase
    .from("reconciliation_jobs")
    .select("*, reconciliation_reports(duration_ms, created_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!jobs) return anomalies;

  // Check for slow jobs
  const recentJobs = jobs.filter((j: any) => {
    const report = (j as any).reconciliation_reports?.[0];
    return (
      report &&
      new Date((report as any).created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
  });

  const avgDuration =
    recentJobs.reduce((sum: number, j: any) => {
      const report = (j as any).reconciliation_reports?.[0];
      return sum + ((report as any)?.duration_ms || 0);
    }, 0) / recentJobs.length;

  // Flag jobs taking > 2x average
  for (const job of recentJobs) {
    const report = (job as any).reconciliation_reports?.[0];
    if (report && (report as any).duration_ms > avgDuration * 2) {
      anomalies.push({
        id: `performance-slow-${(job as any).id}`,
        type: "performance",
        severity: "low",
        title: "Slow Reconciliation Detected",
        description: `Job "${(job as any).name}" took ${((report as any).duration_ms / 1000).toFixed(1)}s, which is slower than average.`,
        detectedAt: new Date(),
        metadata: { jobId: (job as any).id, duration: (report as any).duration_ms, avgDuration },
      });
    }
  }

  return anomalies;
}

/**
 * Detect all anomalies for a user
 */
export async function detectAllAnomalies(userId: string): Promise<Anomaly[]> {
  const [billing, usage, integration, performance] = await Promise.all([
    detectBillingAnomalies(userId),
    detectUsageAnomalies(userId),
    detectIntegrationAnomalies(userId),
    detectPerformanceAnomalies(userId),
  ]);

  return [...billing, ...usage, ...integration, ...performance].sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}
