import { trackSyncFailure, metrics } from "../metrics/prometheus";

describe("Prometheus Metrics", () => {
  beforeEach(() => {
    metrics.reset();
  });

  describe("trackSyncFailure", () => {
    it("should correctly update sync failure metrics", () => {
      const incrementCounterSpy = jest.spyOn(metrics, "incrementCounter");
      const recordHistogramSpy = jest.spyOn(metrics, "recordHistogram");
      const setGaugeSpy = jest.spyOn(metrics, "setGauge");

      trackSyncFailure("conn1", "tenant1", 1500, "timeout");

      expect(incrementCounterSpy).toHaveBeenCalledWith("settler_sync_failed_total", {
        connector_id: "conn1",
        tenant_id: "tenant1",
        error_type: "timeout",
      });

      expect(recordHistogramSpy).toHaveBeenCalledWith("settler_sync_duration_seconds", 1.5, {
        connector_id: "conn1",
        status: "failed",
      });

      expect(setGaugeSpy).toHaveBeenCalledWith("settler_sync_in_progress", 0, {
        connector_id: "conn1",
        tenant_id: "tenant1",
      });
    });
  });
});
