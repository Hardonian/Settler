import { Soc2ContinuousEvidenceCollector } from "../soc2-collector";

describe("Soc2ContinuousEvidenceCollector", () => {
  const collector = new Soc2ContinuousEvidenceCollector();

  it("evaluates a fully compliant infrastructure as 100% compliant", () => {
    const report = collector.collectEvidence({
      rlsCoveragePercent: 100,
      tlsMinVersion: "TLSv1.3",
      jwtKeyRotationDays: 30,
      auditLogRetentionDays: 365,
      unresolvedVulnerabilitiesCount: 0,
    });

    expect(report.compliancePercentage).toBe(100);
    expect(report.compliantControlsCount).toBe(4);
    expect(report.items.every((i) => i.status === "COMPLIANT")).toBe(true);
    expect(report.masterRootHashSha256).toHaveLength(64);
    expect(report.reportId).toMatch(/^SOC2-EVIDENCE-[A-Z0-9]{12}$/);
  });

  it("flags non-compliant status if RLS coverage is below 100%", () => {
    const report = collector.collectEvidence({
      rlsCoveragePercent: 95,
      tlsMinVersion: "TLSv1.3",
      jwtKeyRotationDays: 30,
      auditLogRetentionDays: 365,
      unresolvedVulnerabilitiesCount: 0,
    });

    expect(report.compliancePercentage).toBeLessThan(100);
    const cc61 = report.items.find((i) => i.controlId === "CC6.1")!;
    expect(cc61.status).toBe("NON_COMPLIANT");
  });

  it("flags non-compliant status if unpatched security vulnerabilities exist", () => {
    const report = collector.collectEvidence({
      rlsCoveragePercent: 100,
      tlsMinVersion: "TLSv1.3",
      jwtKeyRotationDays: 30,
      auditLogRetentionDays: 365,
      unresolvedVulnerabilitiesCount: 2,
    });

    const cc81 = report.items.find((i) => i.controlId === "CC8.1")!;
    expect(cc81.status).toBe("NON_COMPLIANT");
  });
});
