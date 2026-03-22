/**
 * Showcase Data Determinism Tests
 *
 * Verifies that the demo data generator produces identical output
 * across invocations — critical for reliable demos and screenshots.
 */

import {
  getShowcaseDataset,
  getDefaultShowcaseTenant,
  getShowcaseForTenant,
  type ShowcaseDataset,
  type ShowcaseRun,
  type ShowcaseException,
} from "@/lib/demo/showcase-data";

describe("showcase-data determinism", () => {
  let dataset1: ShowcaseDataset;
  let dataset2: ShowcaseDataset;

  beforeAll(() => {
    dataset1 = getShowcaseDataset();
    dataset2 = getShowcaseDataset();
  });

  it("produces identical output across invocations", () => {
    expect(JSON.stringify(dataset1)).toBe(JSON.stringify(dataset2));
  });

  it("generates exactly 5 tenant scenarios", () => {
    expect(dataset1.tenants).toHaveLength(5);
  });

  it("has a default tenant (Acme Commerce)", () => {
    const defaultTenant = getDefaultShowcaseTenant();
    expect(defaultTenant.name).toContain("Acme Commerce");
    expect(defaultTenant.slug).toBeTruthy();
  });

  it("generates runs for all tenants", () => {
    for (const tenant of dataset1.tenants) {
      const tenantRuns = dataset1.runs.filter((r) => r.tenantId === tenant.id);
      expect(tenantRuns.length).toBeGreaterThan(0);
    }
  });

  it("generates exceptions for all tenants", () => {
    for (const tenant of dataset1.tenants) {
      const tenantExceptions = dataset1.exceptions.filter((e) => e.tenantId === tenant.id);
      expect(tenantExceptions.length).toBeGreaterThan(0);
    }
  });

  it("generates metrics for all tenants", () => {
    for (const tenant of dataset1.tenants) {
      const tenantMetrics = dataset1.metrics.find((m) => m.tenantId === tenant.id);
      expect(tenantMetrics).toBeDefined();
      expect(tenantMetrics!.matchRate).toBeGreaterThanOrEqual(0);
      expect(tenantMetrics!.matchRate).toBeLessThanOrEqual(100);
    }
  });

  it("getShowcaseForTenant returns scoped data", () => {
    const defaultTenant = getDefaultShowcaseTenant();
    const scoped = getShowcaseForTenant(defaultTenant.id);

    // All runs belong to this tenant
    for (const run of scoped.runs) {
      expect(run.tenantId).toBe(defaultTenant.id);
    }
    // All exceptions belong to this tenant
    for (const exc of scoped.exceptions) {
      expect(exc.tenantId).toBe(defaultTenant.id);
    }
  });

  describe("run data shape conformance", () => {
    let run: ShowcaseRun;

    beforeAll(() => {
      run = dataset1.runs[0];
    });

    it("has required fields", () => {
      expect(run.id).toBeTruthy();
      expect(run.tenantId).toBeTruthy();
      expect(run.name).toBeTruthy();
      expect(run.status).toBeTruthy();
      expect(run.startedAt).toBeTruthy();
    });

    it("has valid status", () => {
      const validStatuses = ["completed", "running", "failed", "pending"];
      expect(validStatuses).toContain(run.status);
    });

    it("has valid summaryState", () => {
      const validStates = ["success", "review_needed", "in_progress", "failed", "empty"];
      expect(validStates).toContain(run.summaryState);
    });

    it("summary counts are non-negative", () => {
      expect(run.summary.total).toBeGreaterThanOrEqual(0);
      expect(run.summary.matched).toBeGreaterThanOrEqual(0);
      expect(run.summary.unmatched).toBeGreaterThanOrEqual(0);
      expect(run.summary.conflicts).toBeGreaterThanOrEqual(0);
    });

    it("progress is between 0 and 100", () => {
      expect(run.progress).toBeGreaterThanOrEqual(0);
      expect(run.progress).toBeLessThanOrEqual(100);
    });
  });

  describe("exception data shape conformance", () => {
    let exc: ShowcaseException;

    beforeAll(() => {
      exc = dataset1.exceptions[0];
    });

    it("has required fields", () => {
      expect(exc.id).toBeTruthy();
      expect(exc.tenantId).toBeTruthy();
      expect(exc.runId).toBeTruthy();
      expect(exc.type).toBeTruthy();
      expect(exc.status).toBeTruthy();
      expect(exc.severity).toBeTruthy();
    });

    it("has valid status", () => {
      const validStatuses = ["pending", "investigating", "resolved", "ignored"];
      expect(validStatuses).toContain(exc.status);
    });

    it("has valid severity", () => {
      const validSeverities = ["low", "medium", "high", "critical"];
      expect(validSeverities).toContain(exc.severity);
    });

    it("amount is a finite number", () => {
      expect(Number.isFinite(exc.amount)).toBe(true);
    });
  });

  describe("metrics trend data", () => {
    it("trend arrays have 12 data points", () => {
      for (const m of dataset1.metrics) {
        expect(m.trendMatchRate).toHaveLength(12);
        expect(m.trendExceptions).toHaveLength(12);
        expect(m.trendVolume).toHaveLength(12);
      }
    });

    it("match rate trends are percentages", () => {
      for (const m of dataset1.metrics) {
        for (const v of m.trendMatchRate) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(100);
        }
      }
    });
  });

  describe("data integrity", () => {
    it("all exception runIds reference existing runs", () => {
      const runIds = new Set(dataset1.runs.map((r) => r.id));
      for (const exc of dataset1.exceptions) {
        expect(runIds.has(exc.runId)).toBe(true);
      }
    });

    it("all IDs are unique within their collection", () => {
      const runIds = dataset1.runs.map((r) => r.id);
      expect(new Set(runIds).size).toBe(runIds.length);

      const excIds = dataset1.exceptions.map((e) => e.id);
      expect(new Set(excIds).size).toBe(excIds.length);

      const alertIds = dataset1.alerts.map((a) => a.id);
      expect(new Set(alertIds).size).toBe(alertIds.length);
    });

    it("completed runs have completedAt timestamps", () => {
      const completedRuns = dataset1.runs.filter((r) => r.status === "completed");
      for (const run of completedRuns) {
        expect(run.completedAt).toBeTruthy();
      }
    });

    it("running/pending runs have null completedAt", () => {
      const activeRuns = dataset1.runs.filter(
        (r) => r.status === "running" || r.status === "pending"
      );
      for (const run of activeRuns) {
        expect(run.completedAt).toBeNull();
      }
    });
  });
});
