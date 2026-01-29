/**
 * Prometheus Metrics
 *
 * Exports metrics for monitoring connector performance
 */

export interface MetricLabels {
  connector_id?: string;
  tenant_id?: string;
  status?: string;
  error_type?: string;
  event_type?: string;
}

export class PrometheusMetrics {
  private metrics: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  /**
   * Increment counter metric
   */
  incrementCounter(name: string, labels?: MetricLabels, value: number = 1): void {
    const key = this.buildKey(name, labels);
    this.metrics.set(key, (this.metrics.get(key) || 0) + value);
  }

  /**
   * Set gauge metric
   */
  setGauge(name: string, value: number, labels?: MetricLabels): void {
    const key = this.buildKey(name, labels);
    this.metrics.set(key, value);
  }

  /**
   * Record histogram value
   */
  recordHistogram(name: string, value: number, labels?: MetricLabels): void {
    const key = this.buildKey(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    const histogram = this.histograms.get(key);
    if (histogram) {
      histogram.push(value);
    }
  }

  /**
   * Build metric key with labels
   */
  private buildKey(name: string, labels?: MetricLabels): string {
    if (!labels) return name;
    const labelParts = Object.entries(labels)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}="${value}"`)
      .join(",");
    return labelParts ? `${name}{${labelParts}}` : name;
  }

  /**
   * Export metrics in Prometheus format
   */
  export(): string {
    const lines: string[] = [];

    // Export counters and gauges
    for (const [key, value] of this.metrics.entries()) {
      lines.push(`${key} ${value}`);
    }

    // Export histograms
    for (const [key, values] of this.histograms.entries()) {
      if (values.length === 0) continue;

      const sorted = [...values].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      const count = sorted.length;
      const buckets = this.calculateBuckets(sorted);

      lines.push(`${key}_bucket{le="+Inf"} ${count}`);
      for (const [le, bucketCount] of buckets.entries()) {
        lines.push(`${key}_bucket{le="${le}"} ${bucketCount}`);
      }
      lines.push(`${key}_sum ${sum}`);
      lines.push(`${key}_count ${count}`);
    }

    return lines.join("\n") + "\n";
  }

  /**
   * Calculate histogram buckets
   */
  private calculateBuckets(values: number[]): Map<string, number> {
    const buckets = [
      0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120, 300, 600,
    ];
    const result = new Map<string, number>();

    for (const bucket of buckets) {
      const count = values.filter((v) => v <= bucket).length;
      result.set(bucket.toString(), count);
    }

    return result;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.histograms.clear();
  }
}

/**
 * Global metrics instance
 */
export const metrics = new PrometheusMetrics();

/**
 * Track sync start
 */
export function trackSyncStart(connectorId: string, tenantId: string): void {
  metrics.incrementCounter("settler_sync_started_total", {
    connector_id: connectorId,
    tenant_id: tenantId,
  });
  metrics.setGauge("settler_sync_in_progress", 1, {
    connector_id: connectorId,
    tenant_id: tenantId,
  });
}

/**
 * Track sync completion
 */
export function trackSyncComplete(
  connectorId: string,
  tenantId: string,
  duration: number,
  counts: { transactions?: number; accounts?: number; errors?: number }
): void {
  metrics.incrementCounter("settler_sync_completed_total", {
    connector_id: connectorId,
    tenant_id: tenantId,
    status: "success",
  });
  metrics.recordHistogram("settler_sync_duration_seconds", duration / 1000, {
    connector_id: connectorId,
  });
  metrics.setGauge("settler_sync_in_progress", 0, {
    connector_id: connectorId,
    tenant_id: tenantId,
  });

  if (counts.transactions) {
    metrics.incrementCounter(
      "settler_transactions_synced_total",
      { connector_id: connectorId },
      counts.transactions
    );
  }
  if (counts.accounts) {
    metrics.incrementCounter(
      "settler_accounts_synced_total",
      { connector_id: connectorId },
      counts.accounts
    );
  }
}

/**
 * Track sync failure
 */
export function trackSyncFailure(
  connectorId: string,
  tenantId: string,
  duration: number,
  errorType: string
): void {
  metrics.incrementCounter("settler_sync_failed_total", {
    connector_id: connectorId,
    tenant_id: tenantId,
    error_type: errorType,
  });
  metrics.recordHistogram("settler_sync_duration_seconds", duration / 1000, {
    connector_id: connectorId,
    status: "failed",
  });
  metrics.setGauge("settler_sync_in_progress", 0, {
    connector_id: connectorId,
    tenant_id: tenantId,
  });
}

/**
 * Track API call
 */
export function trackApiCall(connectorId: string, statusCode: number, duration: number): void {
  metrics.incrementCounter("settler_api_calls_total", {
    connector_id: connectorId,
    status: statusCode >= 200 && statusCode < 300 ? "success" : "error",
  });
  metrics.recordHistogram("settler_api_call_duration_seconds", duration / 1000, {
    connector_id: connectorId,
  });
}

/**
 * Track rate limit hit
 */
export function trackRateLimit(connectorId: string, tenantId: string): void {
  metrics.incrementCounter("settler_rate_limit_hits_total", {
    connector_id: connectorId,
    tenant_id: tenantId,
  });
}

/**
 * Track webhook received
 */
export function trackWebhook(connectorId: string, eventType: string, processed: boolean): void {
  metrics.incrementCounter("settler_webhooks_received_total", {
    connector_id: connectorId,
    event_type: eventType,
  });
  if (processed) {
    metrics.incrementCounter("settler_webhooks_processed_total", { connector_id: connectorId });
  } else {
    metrics.incrementCounter("settler_webhooks_failed_total", { connector_id: connectorId });
  }
}

/**
 * Track token refresh
 */
export function trackTokenRefresh(connectorId: string, success: boolean): void {
  metrics.incrementCounter("settler_token_refreshes_total", {
    connector_id: connectorId,
    status: success ? "success" : "failed",
  });
}
