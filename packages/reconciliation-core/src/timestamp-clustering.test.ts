import {
  clusterTransactionsByTime,
  calculateTemporalLikelihoodBps,
  DEFAULT_CLUSTERING_CONFIGS,
  TemporalEvent,
} from "./timestamp-clustering";

describe("Dynamic Timestamp Clustering Heuristic", () => {
  const tenantId = "tenant_test_temporal";
  const baseTime = 1725926400000; // 2024-09-10T00:00:00Z

  it("fails fast if tenantId is missing", () => {
    expect(() =>
      clusterTransactionsByTime("", [], DEFAULT_CLUSTERING_CONFIGS.STRIPE_CARD_SWEEP)
    ).toThrow(/Tenant isolation invariant violation/);
  });

  it("clusters transactions within the clearing window and splits on large gaps", () => {
    const hour = 3600 * 1000;
    const events: TemporalEvent[] = [
      { id: "tx-1", tenantId, timestampMs: baseTime, amountCents: 5000 },
      { id: "tx-2", tenantId, timestampMs: baseTime + 2 * hour, amountCents: 3500 },
      { id: "tx-3", tenantId, timestampMs: baseTime + 4 * hour, amountCents: 1500 },
      // 5-day gap -> exceeds maxLagMs (3 days)
      { id: "tx-4", tenantId, timestampMs: baseTime + 120 * hour, amountCents: 8000 },
      { id: "tx-5", tenantId, timestampMs: baseTime + 122 * hour, amountCents: 2000 },
    ];

    const clusters = clusterTransactionsByTime(
      tenantId,
      events,
      DEFAULT_CLUSTERING_CONFIGS.STRIPE_CARD_SWEEP,
      "STRIPE"
    );

    expect(clusters).toHaveLength(2);

    const [c1, c2] = clusters;
    expect(c1!.eventIds).toEqual(["tx-1", "tx-2", "tx-3"]);
    expect(c1!.totalAmountCents).toBe(10000);
    expect(c1!.rail).toBe("STRIPE");

    expect(c2!.eventIds).toEqual(["tx-4", "tx-5"]);
    expect(c2!.totalAmountCents).toBe(10000);
  });

  it("enforces tenant boundary isolation when clustering", () => {
    const events: TemporalEvent[] = [
      { id: "tx-1", tenantId: "tenant_A", timestampMs: baseTime, amountCents: 5000 },
      { id: "tx-2", tenantId: "tenant_B", timestampMs: baseTime + 1000, amountCents: 5000 },
    ];

    const clustersA = clusterTransactionsByTime(
      "tenant_A",
      events,
      DEFAULT_CLUSTERING_CONFIGS.FEDACH_SETTLEMENT
    );
    expect(clustersA).toHaveLength(1);
    expect(clustersA[0]!.eventIds).toEqual(["tx-1"]);
  });

  it("calculates temporal likelihood score in basis points accurately", () => {
    const target = 2 * 24 * 3600 * 1000; // 2 days
    const max = 4 * 24 * 3600 * 1000; // 4 days

    // Exact match = 10000 bps
    expect(calculateTemporalLikelihoodBps(target, target, max)).toBe(10000);

    // Beyond max = 0 bps
    expect(calculateTemporalLikelihoodBps(5 * 24 * 3600 * 1000, target, max)).toBe(0);

    // Moderate drift
    const score = calculateTemporalLikelihoodBps(target + 24 * 3600 * 1000, target, max);
    expect(score).toBeGreaterThan(5000);
    expect(score).toBeLessThan(10000);
  });
});
