import { AutomatedComplianceSummarizer, ComplianceTelemetryInput } from "../compliance-summarizer";

describe("Automated Regulatory Compliance Summarizer (#67)", () => {
  const tenantId = "tenant_enterprise_soc2_sox";

  const cleanTelemetry: ComplianceTelemetryInput = {
    tenantId,
    period: "2026-Q3",
    totalJournalEntries: 14500,
    unbalancedEntriesDetected: 0,
    totalBatchesProcessed: 980,
    sealedMerkleBatches: 980,
    selfApprovedJournalsDetected: 0,
    crossTenantLeakAlerts: 0,
    closedPeriodPostingsRejected: 14, // Proves lockout control works
    unhedgedFxExposureCents: 0,
  };

  it("generates a CERTIFIED SOC 2 Type II audit report with 100% effective controls and Merkle root", () => {
    const report = AutomatedComplianceSummarizer.evaluateCompliance(
      tenantId,
      "SOC2_TYPE_2",
      cleanTelemetry
    );

    expect(report.tenantId).toBe(tenantId);
    expect(report.period).toBe("2026-Q3");
    expect(report.framework).toBe("SOC2_TYPE_2");
    expect(report.overallComplianceStatus).toBe("CERTIFIED");
    expect(report.controlsSummary.effectiveCount).toBe(5);
    expect(report.controlsSummary.deficientCount).toBe(0);
    expect(report.controlsSummary.exceptionsCount).toBe(0);
    expect(report.merkleRoot).toMatch(/^[0-9a-f]{64}$/);
    expect(report.auditorAttestation).toContain("CERTIFIED");
  });

  it("downgrades to NON_COMPLIANT if unposted journal variance or segregation of duties violation is detected", () => {
    const defectiveTelemetry: ComplianceTelemetryInput = {
      ...cleanTelemetry,
      unbalancedEntriesDetected: 3, // Ledgers didn't balance
      selfApprovedJournalsDetected: 1, // SoD breach
    };

    const report = AutomatedComplianceSummarizer.evaluateCompliance(
      tenantId,
      "SOX_404_B",
      defectiveTelemetry
    );

    expect(report.overallComplianceStatus).toBe("NON_COMPLIANT");
    expect(report.controlsSummary.deficientCount).toBeGreaterThanOrEqual(2);

    const finCtrl = report.controls.find((c) => c.controlId === "CTL-FIN-01");
    expect(finCtrl?.status).toBe("DEFICIENT");
    expect(finCtrl?.details).toContain("unbalanced journal entries detected");

    const sodCtrl = report.controls.find((c) => c.controlId === "CTL-SOD-01");
    expect(sodCtrl?.status).toBe("DEFICIENT");
  });

  it("strictly enforces tenant boundaries and throws on mismatched telemetry tenant", () => {
    expect(() => {
      AutomatedComplianceSummarizer.evaluateCompliance("tenant_a", "SOC2_TYPE_2", {
        ...cleanTelemetry,
        tenantId: "tenant_b",
      });
    }).toThrow(/Tenant mismatch/);
  });
});
