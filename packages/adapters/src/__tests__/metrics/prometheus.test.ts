import { trackSyncFailure, metrics } from '../../metrics/prometheus';

describe('Prometheus Metrics', () => {
  beforeEach(() => {
    metrics.reset();
  });

  describe('trackSyncFailure', () => {
    it('should track sync failure metrics correctly', () => {
      const connectorId = 'test-connector';
      const tenantId = 'test-tenant';
      const duration = 5000;
      const errorType = 'connection_error';

      const incrementCounterSpy = jest.spyOn(metrics, 'incrementCounter');
      const recordHistogramSpy = jest.spyOn(metrics, 'recordHistogram');
      const setGaugeSpy = jest.spyOn(metrics, 'setGauge');

      trackSyncFailure(connectorId, tenantId, duration, errorType);

      expect(incrementCounterSpy).toHaveBeenCalledWith("settler_sync_failed_total", {
        connector_id: connectorId,
        tenant_id: tenantId,
        error_type: errorType,
      });

      expect(recordHistogramSpy).toHaveBeenCalledWith("settler_sync_duration_seconds", duration / 1000, {
        connector_id: connectorId,
        status: "failed",
      });

      expect(setGaugeSpy).toHaveBeenCalledWith("settler_sync_in_progress", 0, {
        connector_id: connectorId,
        tenant_id: tenantId,
      });
    });
  });
});
