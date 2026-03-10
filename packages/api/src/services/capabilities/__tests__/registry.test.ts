import { getCapabilityRegistry, getUnavailableOperatorIntelligenceProvider } from "../registry";

describe("capability registry", () => {
  const originalModule = process.env.SETTLER_OPERATOR_INTELLIGENCE_PROVIDER_MODULE;

  beforeEach(() => {
    delete process.env.SETTLER_OPERATOR_INTELLIGENCE_PROVIDER_MODULE;
  });

  afterAll(() => {
    if (originalModule) {
      process.env.SETTLER_OPERATOR_INTELLIGENCE_PROVIDER_MODULE = originalModule;
      return;
    }
    delete process.env.SETTLER_OPERATOR_INTELLIGENCE_PROVIDER_MODULE;
  });

  it("returns OSS capabilities when no private module is configured", async () => {
    const registry = await getCapabilityRegistry();
    const capabilities = registry.list();

    expect(capabilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "operator_intelligence",
          available: true,
          source: "oss",
        }),
        expect.objectContaining({
          key: "enterprise_surface",
          available: false,
          state: "unavailable",
        }),
      ])
    );
  });

  it("provides a deterministic unavailable provider shape", async () => {
    const provider = getUnavailableOperatorIntelligenceProvider("missing tables in OSS mode");

    expect(provider.status()).toEqual(
      expect.objectContaining({
        key: "operator_intelligence",
        available: false,
        state: "unavailable",
      })
    );

    await expect(provider.getRunExplorer("tenant", {})).resolves.toEqual([]);
    await expect(provider.getTelemetryForExport("tenant", 7)).resolves.toEqual([]);
    await expect(provider.getSystemHealthSnapshot("tenant", 7)).resolves.toEqual(
      expect.objectContaining({
        runsPerDay: 0,
        errorRate: 0,
      })
    );
  });
});
