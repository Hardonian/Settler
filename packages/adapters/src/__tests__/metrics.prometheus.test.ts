import { trackRateLimit, metrics } from "../metrics/prometheus";

describe("trackRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should increment the rate limit hit counter with the correct labels", () => {
    const incrementSpy = jest.spyOn(metrics, "incrementCounter");

    const connectorId = "test-connector";
    const tenantId = "test-tenant";

    trackRateLimit(connectorId, tenantId);

    expect(incrementSpy).toHaveBeenCalledTimes(1);
    expect(incrementSpy).toHaveBeenCalledWith("settler_rate_limit_hits_total", {
      connector_id: connectorId,
      tenant_id: tenantId,
    });

    incrementSpy.mockRestore();
  });
});
