import { AutonomousPolicyExplainer, ProposedJournalEntry } from "./policy-explainer";

describe("Autonomous Accounting Policy Violation Explainer (#80)", () => {
  const tenantId = "tenant_enterprise_audit_sox";

  it("approves a clean, balanced, authorized journal entry with valid evidence", () => {
    const validEntry: ProposedJournalEntry = {
      entryId: "je_2026_09_001",
      tenantId,
      submittedByUserId: "user_senior_accountant_42",
      approverUserId: "user_controller_99",
      effectiveDate: "2026-09-10T12:00:00Z",
      fiscalPeriod: "2026-Q3",
      isFiscalPeriodClosed: false,
      sourceDocumentRef: "INV-AWS-2026-08-SHA256-PROOF",
      lines: [
        {
          accountId: "6010",
          accountName: "Cloud Hosting Expense",
          accountType: "expense",
          isRestricted: false,
          debitCents: 500000, // $5,000.00
          creditCents: 0,
        },
        {
          accountId: "1010",
          accountName: "Operating Cash Account",
          accountType: "asset",
          isRestricted: false,
          debitCents: 0,
          creditCents: 500000,
        },
      ],
    };

    const report = AutonomousPolicyExplainer.evaluate(tenantId, validEntry);

    expect(report.isAllowed).toBe(true);
    expect(report.findings.length).toBe(0);
    expect(report.varianceCents).toBe(0);
    expect(report.remediationSteps.length).toBe(0);
    expect(report.merkleLeafHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("detects unbalanced debits vs credits with ASC 205 / GAAP citations", () => {
    const unbalancedEntry: ProposedJournalEntry = {
      entryId: "je_unbalanced_bad",
      tenantId,
      submittedByUserId: "user_accountant_1",
      approverUserId: "user_controller_1",
      effectiveDate: "2026-09-10T12:00:00Z",
      fiscalPeriod: "2026-Q3",
      isFiscalPeriodClosed: false,
      sourceDocumentRef: "DOC-REF-001",
      lines: [
        {
          accountId: "6010",
          accountName: "Software Expense",
          accountType: "expense",
          isRestricted: false,
          debitCents: 100000,
          creditCents: 0,
        },
        {
          accountId: "1010",
          accountName: "Cash",
          accountType: "asset",
          isRestricted: false,
          debitCents: 0,
          creditCents: 85000, // $150 variance
        },
      ],
    };

    const report = AutonomousPolicyExplainer.evaluate(tenantId, unbalancedEntry);

    expect(report.isAllowed).toBe(false);
    const unbalFinding = report.findings.find((f) => f.code === "UNBALANCED_ENTRY");
    expect(unbalFinding).toBeDefined();
    expect(unbalFinding?.severity).toBe("CRITICAL");
    expect(unbalFinding?.impactCents).toBe(15000);
    expect(unbalFinding?.regulatoryStandard).toContain("GAAP");
    expect(report.varianceCents).toBe(15000);
  });

  it("flags segregation of duties breach when submitter is identical to approver", () => {
    const sodBreachEntry: ProposedJournalEntry = {
      entryId: "je_sod_breach",
      tenantId,
      submittedByUserId: "user_rogue_trader",
      approverUserId: "user_rogue_trader", // Self-approval
      effectiveDate: "2026-09-10T12:00:00Z",
      fiscalPeriod: "2026-Q3",
      isFiscalPeriodClosed: false,
      sourceDocumentRef: "DOC-999",
      lines: [
        {
          accountId: "6010",
          accountName: "Marketing Expense",
          accountType: "expense",
          isRestricted: false,
          debitCents: 200000,
          creditCents: 0,
        },
        {
          accountId: "1010",
          accountName: "Cash",
          accountType: "asset",
          isRestricted: false,
          debitCents: 0,
          creditCents: 200000,
        },
      ],
    };

    const report = AutonomousPolicyExplainer.evaluate(tenantId, sodBreachEntry);

    expect(report.isAllowed).toBe(false);
    const sodFinding = report.findings.find((f) => f.code === "SEGREGATION_OF_DUTIES_VIOLATION");
    expect(sodFinding).toBeDefined();
    expect(sodFinding?.regulatoryStandard).toContain("PCAOB Auditing Standard AS 2401");
  });

  it("flags closed fiscal period postings with ASC 250 citations", () => {
    const closedPeriodEntry: ProposedJournalEntry = {
      entryId: "je_retroactive_hack",
      tenantId,
      submittedByUserId: "user_accountant_1",
      approverUserId: "user_controller_1",
      effectiveDate: "2025-12-31T00:00:00Z",
      fiscalPeriod: "2025-Q4",
      isFiscalPeriodClosed: true, // Period closed
      sourceDocumentRef: "AUDIT-DOC-1",
      lines: [
        {
          accountId: "5010",
          accountName: "COGS",
          accountType: "expense",
          isRestricted: false,
          debitCents: 50000,
          creditCents: 0,
        },
        {
          accountId: "2010",
          accountName: "Accounts Payable",
          accountType: "liability",
          isRestricted: false,
          debitCents: 0,
          creditCents: 50000,
        },
      ],
    };

    const report = AutonomousPolicyExplainer.evaluate(tenantId, closedPeriodEntry);

    expect(report.isAllowed).toBe(false);
    const closedFinding = report.findings.find((f) => f.code === "CLOSED_PERIOD_POSTING_ATTEMPT");
    expect(closedFinding).toBeDefined();
    expect(closedFinding?.regulatoryStandard).toContain("ASC 250");
  });

  it("enforces tenant boundary isolation and rejects cross-tenant entry evaluation", () => {
    const crossTenantEntry: ProposedJournalEntry = {
      entryId: "je_leak",
      tenantId: "tenant_victim_a",
      submittedByUserId: "user_1",
      effectiveDate: "2026-09-10T00:00:00Z",
      fiscalPeriod: "2026-Q3",
      isFiscalPeriodClosed: false,
      lines: [],
    };

    expect(() => {
      AutonomousPolicyExplainer.evaluate("tenant_attacker_b", crossTenantEntry);
    }).toThrow(/Tenant mismatch/);
  });
});
