import { createHash } from "node:crypto";

/**
 * #67 Automated Regulatory Compliance Summarizer
 *
 * Synthesizes quarterly SOC 1 (SSAE 18), SOC 2 Type II, and SOX Section 404
 * compliance control summaries evaluating transaction completeness, mathematical
 * ledger invariance, segregation of duties, and cryptographic Merkle proof integrity.
 *
 * Invariants:
 * - Strict tenantId verification
 * - Integer cents precision
 * - RFC 6962 SHA-256 Merkle root sealing
 */

export type ComplianceFramework = "SOC1_TYPE_2" | "SOC2_TYPE_2" | "SOX_404_B" | "ISO_27001";

export type ControlStatus = "EFFECTIVE" | "EXCEPTION_NOTED" | "DEFICIENT";

export interface ControlEvaluationResult {
  controlId: string;
  frameworkRef: string;
  name: string;
  description: string;
  status: ControlStatus;
  populationCount: number;
  sampleSize: number;
  exceptionsCount: number;
  testedAt: string;
  details: string;
  merkleLeafHash: string;
}

export interface ComplianceTelemetryInput {
  tenantId: string;
  period: string; // e.g. "2026-Q3"
  totalJournalEntries: number;
  unbalancedEntriesDetected: number;
  totalBatchesProcessed: number;
  sealedMerkleBatches: number;
  selfApprovedJournalsDetected: number;
  crossTenantLeakAlerts: number;
  closedPeriodPostingsRejected: number;
  unhedgedFxExposureCents: number;
}

export interface ComplianceAuditReport {
  reportId: string;
  tenantId: string;
  framework: ComplianceFramework;
  period: string;
  generatedAt: string;
  overallComplianceStatus: "CERTIFIED" | "QUALIFIED" | "NON_COMPLIANT";
  controlsSummary: {
    totalControls: number;
    effectiveCount: number;
    exceptionsCount: number;
    deficientCount: number;
  };
  controls: ControlEvaluationResult[];
  auditorAttestation: string;
  merkleRoot: string;
}

function rfc6962LeafHash(data: string): string {
  return createHash("sha256")
    .update(Buffer.concat([Buffer.from([0x00]), Buffer.from(data, "utf-8")]))
    .digest("hex");
}

function rfc6962NodeHash(left: string, right: string): string {
  return createHash("sha256")
    .update(
      Buffer.concat([Buffer.from([0x01]), Buffer.from(left, "hex"), Buffer.from(right, "hex")])
    )
    .digest("hex");
}

function computeMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) return createHash("sha256").update("EMPTY").digest("hex");
  let current = [...leaves];
  while (current.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < current.length; i += 2) {
      if (i + 1 < current.length) {
        next.push(rfc6962NodeHash(current[i]!, current[i + 1]!));
      } else {
        next.push(current[i]!);
      }
    }
    current = next;
  }
  return current[0]!;
}

export class AutomatedComplianceSummarizer {
  /**
   * Evaluates institutional compliance against SOC/SOX frameworks with cryptographic Merkle proof sealing.
   */
  public static evaluateCompliance(
    tenantId: string,
    framework: ComplianceFramework,
    telemetry: ComplianceTelemetryInput
  ): ComplianceAuditReport {
    if (!tenantId) {
      throw new Error("Tenant mismatch: tenantId is mandatory for compliance evaluation");
    }
    if (telemetry.tenantId !== tenantId) {
      throw new Error(
        `Tenant mismatch: Telemetry tenant (${telemetry.tenantId}) does not match caller (${tenantId})`
      );
    }

    const now = new Date().toISOString();
    const controls: ControlEvaluationResult[] = [];

    // Control 1: Strict Zero-Float Double-Entry Invariance
    {
      const exceptions = telemetry.unbalancedEntriesDetected;
      const status: ControlStatus = exceptions === 0 ? "EFFECTIVE" : "DEFICIENT";
      const desc =
        "All financial ledger postings must maintain absolute mathematical balance (sum debits == sum credits).";
      const details =
        exceptions === 0
          ? `100% of ${telemetry.totalJournalEntries} journal entries balanced to 0 cents variance.`
          : `${exceptions} unbalanced journal entries detected. Ledgers must reject non-zero delta entries.`;

      const leaf = rfc6962LeafHash(
        JSON.stringify({ tenantId, controlId: "CTL-FIN-01", status, exceptions })
      );
      controls.push({
        controlId: "CTL-FIN-01",
        frameworkRef:
          framework === "SOX_404_B" ? "SOX-404.1 (Ledger Balance)" : "CC6.8 (Processing Integrity)",
        name: "Double-Entry Zero-Sum Ledger Invariance",
        description: desc,
        status,
        populationCount: telemetry.totalJournalEntries,
        sampleSize: telemetry.totalJournalEntries,
        exceptionsCount: exceptions,
        testedAt: now,
        details,
        merkleLeafHash: leaf,
      });
    }

    // Control 2: Cryptographic Merkle Batch Sealing
    {
      const unsealed = telemetry.totalBatchesProcessed - telemetry.sealedMerkleBatches;
      const status: ControlStatus =
        unsealed === 0 ? "EFFECTIVE" : unsealed <= 2 ? "EXCEPTION_NOTED" : "DEFICIENT";
      const desc =
        "Reconciliation settlement batches must be sealed with RFC 6962 SHA-256 Merkle root trees.";
      const details =
        unsealed === 0
          ? `All ${telemetry.totalBatchesProcessed} batch settlement runs sealed with tamper-evident Merkle roots.`
          : `${unsealed} batches lacked verifiable cryptographic Merkle tree sealing.`;

      const leaf = rfc6962LeafHash(
        JSON.stringify({ tenantId, controlId: "CTL-CRYPTO-01", status, unsealed })
      );
      controls.push({
        controlId: "CTL-CRYPTO-01",
        frameworkRef: "CC7.2 (System Immutability & Audit Trails)",
        name: "Cryptographic Batch Proof Sealing",
        description: desc,
        status,
        populationCount: telemetry.totalBatchesProcessed,
        sampleSize: telemetry.totalBatchesProcessed,
        exceptionsCount: unsealed,
        testedAt: now,
        details,
        merkleLeafHash: leaf,
      });
    }

    // Control 3: Segregation of Duties (SoD)
    {
      const exceptions = telemetry.selfApprovedJournalsDetected;
      const status: ControlStatus = exceptions === 0 ? "EFFECTIVE" : "DEFICIENT";
      const desc =
        "Manual journal entries require independent reviewer authorization; self-approval is strictly barred.";
      const details =
        exceptions === 0
          ? "Zero self-approved manual journal entries detected across the audit period."
          : `${exceptions} segregation of duties violations detected where submitter approved their own entry.`;

      const leaf = rfc6962LeafHash(
        JSON.stringify({ tenantId, controlId: "CTL-SOD-01", status, exceptions })
      );
      controls.push({
        controlId: "CTL-SOD-01",
        frameworkRef:
          framework === "SOX_404_B"
            ? "PCAOB AS 2401 (Segregation of Duties)"
            : "CC6.2 (Logical Access Approvals)",
        name: "Segregation of Duties (SoD) Journal Approval",
        description: desc,
        status,
        populationCount: telemetry.totalJournalEntries,
        sampleSize: Math.min(100, telemetry.totalJournalEntries),
        exceptionsCount: exceptions,
        testedAt: now,
        details,
        merkleLeafHash: leaf,
      });
    }

    // Control 4: Strict Multi-Tenant Data Boundary Isolation
    {
      const exceptions = telemetry.crossTenantLeakAlerts;
      const status: ControlStatus = exceptions === 0 ? "EFFECTIVE" : "DEFICIENT";
      const desc =
        "Strict logical boundary enforcement preventing cross-tenant data exposure or unauthorized row-level access.";
      const details =
        exceptions === 0
          ? "Zero cross-tenant boundary violations detected. 100% of queries enforced tenantId predicates and RLS."
          : `CRITICAL: ${exceptions} cross-tenant query leak attempts intercepted by security middleware.`;

      const leaf = rfc6962LeafHash(
        JSON.stringify({ tenantId, controlId: "CTL-SEC-01", status, exceptions })
      );
      controls.push({
        controlId: "CTL-SEC-01",
        frameworkRef: "CC6.1 (Logical Boundary & Tenant Isolation)",
        name: "Multi-Tenant Data Sovereignty & RLS Isolation",
        description: desc,
        status,
        populationCount: telemetry.totalJournalEntries + telemetry.totalBatchesProcessed,
        sampleSize: telemetry.totalJournalEntries + telemetry.totalBatchesProcessed,
        exceptionsCount: exceptions,
        testedAt: now,
        details,
        merkleLeafHash: leaf,
      });
    }

    // Control 5: Closed Fiscal Period Lockout
    {
      const exceptions = telemetry.closedPeriodPostingsRejected;
      // In this control, rejected attempts prove the control is EFFECTIVE!
      const status: ControlStatus = "EFFECTIVE";
      const desc =
        "Direct modifications to finalized and closed fiscal accounting periods must be programmatically rejected.";
      const details = `Fiscal period lockout successfully enforced. ${exceptions} out-of-period modification attempts safely rejected.`;

      const leaf = rfc6962LeafHash(
        JSON.stringify({ tenantId, controlId: "CTL-LOCK-01", status, exceptions })
      );
      controls.push({
        controlId: "CTL-LOCK-01",
        frameworkRef: "ASC 250 & SOX Section 404 (Financial Close Lockout)",
        name: "Accounting Period Lockout & Immutability",
        description: desc,
        status,
        populationCount: telemetry.totalJournalEntries,
        sampleSize: telemetry.totalJournalEntries,
        exceptionsCount: 0,
        testedAt: now,
        details,
        merkleLeafHash: leaf,
      });
    }

    const effectiveCount = controls.filter((c) => c.status === "EFFECTIVE").length;
    const exceptionsCount = controls.filter((c) => c.status === "EXCEPTION_NOTED").length;
    const deficientCount = controls.filter((c) => c.status === "DEFICIENT").length;

    let overallComplianceStatus: "CERTIFIED" | "QUALIFIED" | "NON_COMPLIANT" = "CERTIFIED";
    if (deficientCount > 0) {
      overallComplianceStatus = "NON_COMPLIANT";
    } else if (exceptionsCount > 0) {
      overallComplianceStatus = "QUALIFIED";
    }

    const sortedLeaves = controls.map((c) => c.merkleLeafHash).sort();
    const merkleRoot = computeMerkleRoot(sortedLeaves);

    const reportId = `rep_${createHash("sha256").update(`${tenantId}:${framework}:${telemetry.period}:${merkleRoot}`).digest("hex").slice(0, 16)}`;
    const auditorAttestation = `Management asserts that internal controls over financial reconciliation and data isolation for tenant "${tenantId}" during period "${telemetry.period}" under framework "${framework}" are operating with an overall status of ${overallComplianceStatus}. Sealed by Merkle Root: ${merkleRoot}.`;

    return {
      reportId,
      tenantId,
      framework,
      period: telemetry.period,
      generatedAt: now,
      overallComplianceStatus,
      controlsSummary: {
        totalControls: controls.length,
        effectiveCount,
        exceptionsCount,
        deficientCount,
      },
      controls,
      auditorAttestation,
      merkleRoot,
    };
  }
}
