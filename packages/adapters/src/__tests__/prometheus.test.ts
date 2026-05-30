import {
  trackSyncStart,
  trackSyncComplete,
  trackSyncFailure,
  trackApiCall,
  trackRateLimit,
  trackWebhook,
  trackTokenRefresh,
  metrics,
} from "../metrics/prometheus";

describe("prometheus metrics tracking functions", () => {
  beforeEach(() => {
    metrics.reset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("trackSyncStart", () => {
    it("should increment counter and set gauge correctly", () => {
      const incrementSpy = jest.spyOn(metrics, "incrementCounter");
      const gaugeSpy = jest.spyOn(metrics, "setGauge");

      const connectorId = "test-connector";
      const tenantId = "test-tenant";

      trackSyncStart(connectorId, tenantId);

      expect(incrementSpy).toHaveBeenCalledWith("settler_sync_started_total", {
        connector_id: connectorId,
        tenant_id: tenantId,
      });

      expect(gaugeSpy).toHaveBeenCalledWith("settler_sync_in_progress", 1, {
        connector_id: connectorId,
        tenant_id: tenantId,
      });
    });
  });

  describe("trackSyncComplete", () => {
    it("should track metrics for successful sync with counts", () => {
      const incrementSpy = jest.spyOn(metrics, "incrementCounter");
      const gaugeSpy = jest.spyOn(metrics, "setGauge");
      const histogramSpy = jest.spyOn(metrics, "recordHistogram");

      const connectorId = "test-connector";
      const tenantId = "test-tenant";
      const durationMs = 1500;
      const counts = { transactions: 10, accounts: 2 };

      trackSyncComplete(connectorId, tenantId, durationMs, counts);

      // Verify core success metrics
      expect(incrementSpy).toHaveBeenCalledWith("settler_sync_completed_total", {
        connector_id: connectorId,
        tenant_id: tenantId,
        status: "success",
      });
      expect(histogramSpy).toHaveBeenCalledWith("settler_sync_duration_seconds", 1.5, {
        connector_id: connectorId,
      });
      expect(gaugeSpy).toHaveBeenCalledWith("settler_sync_in_progress", 0, {
        connector_id: connectorId,
        tenant_id: tenantId,
      });

      // Verify conditional count metrics
      expect(incrementSpy).toHaveBeenCalledWith(
        "settler_transactions_synced_total",
        { connector_id: connectorId },
        10
      );
      expect(incrementSpy).toHaveBeenCalledWith(
        "settler_accounts_synced_total",
        { connector_id: connectorId },
        2
      );
    });

    it("should track metrics without counts", () => {
      const incrementSpy = jest.spyOn(metrics, "incrementCounter");

      trackSyncComplete("test-connector", "test-tenant", 1000, {});

      expect(incrementSpy).toHaveBeenCalledWith("settler_sync_completed_total", expect.any(Object));
      expect(incrementSpy).not.toHaveBeenCalledWith(
        "settler_transactions_synced_total",
        expect.any(Object),
        expect.any(Number)
      );
      expect(incrementSpy).not.toHaveBeenCalledWith(
        "settler_accounts_synced_total",
        expect.any(Object),
        expect.any(Number)
      );
    });
  });

  describe("trackSyncFailure", () => {
    it("should track sync failure metrics", () => {
      const incrementSpy = jest.spyOn(metrics, "incrementCounter");
      const gaugeSpy = jest.spyOn(metrics, "setGauge");
      const histogramSpy = jest.spyOn(metrics, "recordHistogram");

      const connectorId = "test-connector";
      const tenantId = "test-tenant";
      const durationMs = 500;
      const errorType = "auth_error";

      trackSyncFailure(connectorId, tenantId, durationMs, errorType);

      expect(incrementSpy).toHaveBeenCalledWith("settler_sync_failed_total", {
        connector_id: connectorId,
        tenant_id: tenantId,
        error_type: errorType,
      });
      expect(histogramSpy).toHaveBeenCalledWith("settler_sync_duration_seconds", 0.5, {
        connector_id: connectorId,
        status: "failed",
      });
      expect(gaugeSpy).toHaveBeenCalledWith("settler_sync_in_progress", 0, {
        connector_id: connectorId,
        tenant_id: tenantId,
      });
    });
  });

  describe("trackApiCall", () => {
    it("should track successful API call", () => {
      const incrementSpy = jest.spyOn(metrics, "incrementCounter");
      const histogramSpy = jest.spyOn(metrics, "recordHistogram");

      trackApiCall("test-connector", 200, 150);

      expect(incrementSpy).toHaveBeenCalledWith("settler_api_calls_total", {
        connector_id: "test-connector",
        status: "success",
      });
      expect(histogramSpy).toHaveBeenCalledWith("settler_api_call_duration_seconds", 0.15, {
        connector_id: "test-connector",
      });
    });

    it("should track failed API call", () => {
      const incrementSpy = jest.spyOn(metrics, "incrementCounter");

      trackApiCall("test-connector", 500, 250);

      expect(incrementSpy).toHaveBeenCalledWith("settler_api_calls_total", {
        connector_id: "test-connector",
        status: "error",
      });
    });
  });

  describe("trackRateLimit", () => {
    it("should track rate limit hits", () => {
      const incrementSpy = jest.spyOn(metrics, "incrementCounter");

      trackRateLimit("test-connector", "test-tenant");

      expect(incrementSpy).toHaveBeenCalledWith("settler_rate_limit_hits_total", {
        connector_id: "test-connector",
        tenant_id: "test-tenant",
      });
    });
  });

  describe("trackWebhook", () => {
    it("should track processed webhook", () => {
      const incrementSpy = jest.spyOn(metrics, "incrementCounter");

      trackWebhook("test-connector", "transaction.created", true);

      expect(incrementSpy).toHaveBeenCalledWith("settler_webhooks_received_total", {
        connector_id: "test-connector",
        event_type: "transaction.created",
      });
      expect(incrementSpy).toHaveBeenCalledWith("settler_webhooks_processed_total", {
        connector_id: "test-connector",
      });
    });

    it("should track failed webhook", () => {
      const incrementSpy = jest.spyOn(metrics, "incrementCounter");

      trackWebhook("test-connector", "transaction.created", false);

      expect(incrementSpy).toHaveBeenCalledWith("settler_webhooks_failed_total", {
        connector_id: "test-connector",
      });
    });
  });

  describe("trackTokenRefresh", () => {
    it("should track successful token refresh", () => {
      const incrementSpy = jest.spyOn(metrics, "incrementCounter");

      trackTokenRefresh("test-connector", true);

      expect(incrementSpy).toHaveBeenCalledWith("settler_token_refreshes_total", {
        connector_id: "test-connector",
        status: "success",
      });
    });

    it("should track failed token refresh", () => {
      const incrementSpy = jest.spyOn(metrics, "incrementCounter");

      trackTokenRefresh("test-connector", false);

      expect(incrementSpy).toHaveBeenCalledWith("settler_token_refreshes_total", {
        connector_id: "test-connector",
        status: "failed",
      });
    });
  });
});
