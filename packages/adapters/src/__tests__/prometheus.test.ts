import { trackSyncStart, metrics } from "../metrics/prometheus";

describe("Prometheus Metrics - trackSyncStart", () => {
  beforeEach(() => {
    // Reset any internal state if needed, though for spying it might not strictly be necessary
    // depending on if tests bleed state. The PrometheusMetrics class has a reset() method.
    metrics.reset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should correctly increment the counter and set the gauge when trackSyncStart is called", () => {
    // Arrange
    const connectorId = "test-connector-123";
    const tenantId = "test-tenant-456";

    const incrementCounterSpy = jest.spyOn(metrics, "incrementCounter");
    const setGaugeSpy = jest.spyOn(metrics, "setGauge");

    // Act
    trackSyncStart(connectorId, tenantId);

    // Assert
    expect(incrementCounterSpy).toHaveBeenCalledTimes(1);
    expect(incrementCounterSpy).toHaveBeenCalledWith("settler_sync_started_total", {
      connector_id: connectorId,
      tenant_id: tenantId,
    });

    expect(setGaugeSpy).toHaveBeenCalledTimes(1);
    expect(setGaugeSpy).toHaveBeenCalledWith("settler_sync_in_progress", 1, {
      connector_id: connectorId,
      tenant_id: tenantId,
    });
  });
});
