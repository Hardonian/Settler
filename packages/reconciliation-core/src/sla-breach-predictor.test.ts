import { assessSlaRisk, DEFAULT_SLA_POLICIES, MonitoredSettlement } from "./sla-breach-predictor";

describe("Contractual SLA Breach Predictor", () => {
  const tenantId = "tenant_sla_test";
  const now = 1725926400000;
  const hour = 3600 * 1000;

  it("fails fast if tenantId is missing or mismatched", () => {
    const settlement: MonitoredSettlement = {
      transactionId: "tx-1",
      tenantId: "tenant_diff",
      rail: "STRIPE",
      amountCents: 10000,
      initiatedAtMs: now - 10 * hour,
      status: "pending_clearing",
    };

    expect(() => assessSlaRisk("tenant_A", settlement, DEFAULT_SLA_POLICIES.STRIPE!, now)).toThrow(
      /Cross-tenant access violation/
    );
  });

  it("classifies healthy settlements within normal clearance window", () => {
    const settlement: MonitoredSettlement = {
      transactionId: "tx-healthy",
      tenantId,
      rail: "STRIPE",
      amountCents: 50000,
      initiatedAtMs: now - 12 * hour, // 12 hours ago (target is 48)
      status: "pending_clearing",
    };

    const assessment = assessSlaRisk(tenantId, settlement, DEFAULT_SLA_POLICIES.STRIPE!, now);
    expect(assessment.status).toBe("HEALTHY");
    expect(assessment.actionRequired).toBe(false);
  });

  it("warns when settlement approaches target clearance threshold", () => {
    const settlement: MonitoredSettlement = {
      transactionId: "tx-warn",
      tenantId,
      rail: "STRIPE",
      amountCents: 50000,
      initiatedAtMs: now - 40 * hour, // 40h (75% of 48h is 36h)
      status: "pending_clearing",
    };

    const assessment = assessSlaRisk(tenantId, settlement, DEFAULT_SLA_POLICIES.STRIPE!, now);
    expect(assessment.status).toBe("WARN_APPROACHING_SLA");
  });

  it("flags critical imminent breach and calculates penalties on overdue deposits", () => {
    const settlement: MonitoredSettlement = {
      transactionId: "tx-overdue",
      tenantId,
      rail: "STRIPE",
      amountCents: 50000,
      initiatedAtMs: now - 80 * hour, // 80h > 72h max SLA limit (8h overdue)
      status: "delayed",
    };

    const assessment = assessSlaRisk(tenantId, settlement, DEFAULT_SLA_POLICIES.STRIPE!, now);
    expect(assessment.status).toBe("BREACHED");
    expect(assessment.actionRequired).toBe(true);
    expect(assessment.projectedPenaltyCents).toBe(2500); // 1 day overdue * $25/day
  });
});
