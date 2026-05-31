import {
  metrics,
  trackSyncStart,
  trackSyncComplete,
  trackSyncFailure,
  trackApiCall,
  trackRateLimit,
  trackWebhook,
  trackTokenRefresh,
} from "../metrics/prometheus";

describe("PrometheusMetrics", () => {
  beforeEach(() => {
    metrics.reset();
  });

  describe("Class Methods", () => {
    it("should increment counter with or without labels", () => {
      metrics.incrementCounter("test_counter");
      metrics.incrementCounter("test_counter", { status: "success" }, 2);

      const exported = metrics.export();
      expect(exported).toContain("test_counter 1");
      expect(exported).toContain('test_counter{status="success"} 2');
    });

    it("should set gauge", () => {
      metrics.setGauge("test_gauge", 42);
      metrics.setGauge("test_gauge", 10, { tenant_id: "t1" });

      const exported = metrics.export();
      expect(exported).toContain("test_gauge 42");
      expect(exported).toContain('test_gauge{tenant_id="t1"} 10');
    });

    it("should record histogram and calculate buckets correctly", () => {
      metrics.recordHistogram("test_hist", 0.05); // bucket 0.05
      metrics.recordHistogram("test_hist", 0.2); // bucket 0.25
      metrics.recordHistogram("test_hist", 1.5); // bucket 2.5
      metrics.recordHistogram("test_hist", 2.0); // bucket 2.5

      const exported = metrics.export();
      // count is 4
      expect(exported).toContain('test_hist_bucket{le="+Inf"} 4');
      expect(exported).toContain("test_hist_sum 3.75");
      expect(exported).toContain("test_hist_count 4");

      // 0.05 should have 1
      expect(exported).toContain('test_hist_bucket{le="0.05"} 1');
      // 0.25 should have 2 (0.05, 0.2)
      expect(exported).toContain('test_hist_bucket{le="0.25"} 2');
      // 2.5 should have 4
      expect(exported).toContain('test_hist_bucket{le="2.5"} 4');
    });

    it("should ignore undefined labels", () => {
      metrics.incrementCounter("test_counter", {
        status: "success",
        error_type: undefined,
      });

      const exported = metrics.export();
      expect(exported).toContain('test_counter{status="success"} 1');
      expect(exported).not.toContain("error_type");
    });
  });

  describe("Tracking Functions", () => {
    const connectorId = "conn_123";
    const tenantId = "tenant_456";

    it("should trackSyncStart", () => {
      trackSyncStart(connectorId, tenantId);

      const exported = metrics.export();
      expect(exported).toContain(
        `settler_sync_started_total{connector_id="${connectorId}",tenant_id="${tenantId}"} 1`
      );
      expect(exported).toContain(
        `settler_sync_in_progress{connector_id="${connectorId}",tenant_id="${tenantId}"} 1`
      );
    });

    it("should trackSyncComplete", () => {
      trackSyncComplete(connectorId, tenantId, 5000, {
        transactions: 10,
        accounts: 2,
      });

      const exported = metrics.export();
      expect(exported).toContain(
        `settler_sync_completed_total{connector_id="${connectorId}",tenant_id="${tenantId}",status="success"} 1`
      );
      expect(exported).toContain(
        `settler_sync_duration_seconds{connector_id="${connectorId}"}_sum 5`
      ); // 5000 / 1000
      expect(exported).toContain(
        `settler_sync_in_progress{connector_id="${connectorId}",tenant_id="${tenantId}"} 0`
      );
      expect(exported).toContain(
        `settler_transactions_synced_total{connector_id="${connectorId}"} 10`
      );
      expect(exported).toContain(`settler_accounts_synced_total{connector_id="${connectorId}"} 2`);
    });

    it("should trackSyncFailure", () => {
      trackSyncFailure(connectorId, tenantId, 3000, "auth_error");

      const exported = metrics.export();
      expect(exported).toContain(
        `settler_sync_failed_total{connector_id="${connectorId}",tenant_id="${tenantId}",error_type="auth_error"} 1`
      );
      expect(exported).toContain(
        `settler_sync_duration_seconds{connector_id="${connectorId}",status="failed"}_sum 3`
      );
      expect(exported).toContain(
        `settler_sync_in_progress{connector_id="${connectorId}",tenant_id="${tenantId}"} 0`
      );
    });

    it("should trackApiCall", () => {
      trackApiCall(connectorId, 200, 150);
      trackApiCall(connectorId, 500, 300);

      const exported = metrics.export();
      expect(exported).toContain(
        `settler_api_calls_total{connector_id="${connectorId}",status="success"} 1`
      );
      expect(exported).toContain(
        `settler_api_calls_total{connector_id="${connectorId}",status="error"} 1`
      );
      // floating point comparison in string
      expect(exported).toContain(
        `settler_api_call_duration_seconds{connector_id="${connectorId}"}_sum 0.44999999999999996`
      ); // 150/1000 + 300/1000
    });

    it("should trackRateLimit", () => {
      trackRateLimit(connectorId, tenantId);

      const exported = metrics.export();
      expect(exported).toContain(
        `settler_rate_limit_hits_total{connector_id="${connectorId}",tenant_id="${tenantId}"} 1`
      );
    });

    it("should trackWebhook", () => {
      trackWebhook(connectorId, "payment.created", true);
      trackWebhook(connectorId, "payment.failed", false);

      const exported = metrics.export();
      expect(exported).toContain(
        `settler_webhooks_received_total{connector_id="${connectorId}",event_type="payment.created"} 1`
      );
      expect(exported).toContain(
        `settler_webhooks_received_total{connector_id="${connectorId}",event_type="payment.failed"} 1`
      );
      expect(exported).toContain(
        `settler_webhooks_processed_total{connector_id="${connectorId}"} 1`
      );
      expect(exported).toContain(`settler_webhooks_failed_total{connector_id="${connectorId}"} 1`);
    });

    it("should trackTokenRefresh", () => {
      trackTokenRefresh(connectorId, true);
      trackTokenRefresh(connectorId, false);

      const exported = metrics.export();
      expect(exported).toContain(
        `settler_token_refreshes_total{connector_id="${connectorId}",status="success"} 1`
      );
      expect(exported).toContain(
        `settler_token_refreshes_total{connector_id="${connectorId}",status="failed"} 1`
      );
    });
  });
});
