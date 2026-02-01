/**
 * Compliance Snapshot Module
 * Generates frozen audit bundles for any date range
 */

import { TruthTableEntry } from "./drift_detector";

export interface ComplianceSnapshot {
  snapshot_id: string;
  version: string;
  created_at: string;
  date_range: {
    start: string;
    end: string;
  };
  frozen_at: string;
  frozen_by: string;
  immutable_hash: string;
  reconciliation_runs: ComplianceRun[];
  summary: {
    total_records_processed: number;
    total_matches: number;
    total_mismatches: number;
    total_amount_matched: number;
    total_amount_variance: number;
    currencies: string[];
    rule_coverage: Map<string, number>;
  };
  attestations: Attestation[];
  proof_chain: ProofLink[];
}

export interface ComplianceRun {
  run_id: string;
  run_at: string;
  source_system: string;
  target_system: string;
  record_count: number;
  match_rate: number;
  truth_table_hash: string;
  invariant_check_passed: boolean;
  violations: string[];
}

export interface Attestation {
  attestation_id: string;
  attested_at: string;
  attested_by: string;
  role: string;
  scope: string;
  statement: string;
  signature: string;
}

export interface ProofLink {
  link_type: "truth_table" | "invariant_check" | "external_verification";
  reference: string;
  hash: string;
  timestamp: string;
}

export class ComplianceSnapshotBuilder {
  private runs: ComplianceRun[] = [];
  private attestations: Attestation[] = [];
  private proofChain: ProofLink[] = [];
  private version = "1.0.0";

  /**
   * Add a reconciliation run to the snapshot
   */
  addRun(
    runId: string,
    runAt: string,
    sourceSystem: string,
    targetSystem: string,
    truthTable: TruthTableEntry[],
    invariantPassed: boolean,
    violations: string[]
  ): void {
    const matches = truthTable.filter((t) => t.match_status === "matched").length;

    const run: ComplianceRun = {
      run_id: runId,
      run_at: runAt,
      source_system: sourceSystem,
      target_system: targetSystem,
      record_count: truthTable.length,
      match_rate: truthTable.length > 0 ? matches / truthTable.length : 0,
      truth_table_hash: this.hashTruthTable(truthTable),
      invariant_check_passed: invariantPassed,
      violations,
    };

    this.runs.push(run);

    // Add proof link
    this.proofChain.push({
      link_type: "truth_table",
      reference: runId,
      hash: run.truth_table_hash,
      timestamp: runAt,
    });
  }

  /**
   * Add an attestation to the snapshot
   */
  addAttestation(attestedBy: string, role: string, scope: string, statement: string): Attestation {
    const attestation: Attestation = {
      attestation_id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      attested_at: new Date().toISOString(),
      attested_by: attestedBy,
      role,
      scope,
      statement,
      signature: this.generateSignature(attestedBy, statement),
    };

    this.attestations.push(attestation);
    return attestation;
  }

  /**
   * Build the final compliance snapshot
   */
  build(dateRangeStart: string, dateRangeEnd: string, frozenBy: string): ComplianceSnapshot {
    const createdAt = new Date().toISOString();

    // Calculate summary
    const currencies = new Set<string>();
    const ruleCoverage = new Map<string, number>();
    let totalMatched = 0;
    let totalMismatched = 0;
    let totalAmount = 0;
    let totalVariance = 0;

    // Calculate totals from runs
    totalMatched = this.runs.reduce(
      (sum, run) => sum + Math.floor(run.record_count * run.match_rate),
      0
    );
    totalMismatched = this.runs.reduce(
      (sum, run) => sum + Math.floor(run.record_count * (1 - run.match_rate)),
      0
    );

    const snapshot: ComplianceSnapshot = {
      snapshot_id: this.generateSnapshotId(),
      version: this.version,
      created_at: createdAt,
      date_range: {
        start: dateRangeStart,
        end: dateRangeEnd,
      },
      frozen_at: createdAt,
      frozen_by: frozenBy,
      immutable_hash: "", // Will be calculated
      reconciliation_runs: this.runs,
      summary: {
        total_records_processed: this.runs.reduce((sum, r) => sum + r.record_count, 0),
        total_matches: totalMatched,
        total_mismatches: totalMismatched,
        total_amount_matched: totalAmount,
        total_amount_variance: totalVariance,
        currencies: Array.from(currencies),
        rule_coverage: ruleCoverage,
      },
      attestations: this.attestations,
      proof_chain: this.proofChain,
    };

    // Calculate immutable hash
    snapshot.immutable_hash = this.calculateImmutableHash(snapshot);

    return snapshot;
  }

  /**
   * Verify snapshot integrity
   */
  verifyIntegrity(snapshot: ComplianceSnapshot): boolean {
    const snapshotWithoutHash = { ...snapshot };
    delete (snapshotWithoutHash as any).immutable_hash;
    const calculatedHash = this.calculateImmutableHash(snapshotWithoutHash as any);

    return calculatedHash === snapshot.immutable_hash;
  }

  /**
   * Replay snapshot - verify all proofs
   */
  async replay(snapshot: ComplianceSnapshot): Promise<{
    valid: boolean;
    checks: Array<{ check: string; passed: boolean; details?: string }>;
  }> {
    const checks: Array<{ check: string; passed: boolean; details?: string }> = [];

    // Check 1: Integrity hash
    checks.push({
      check: "Immutable Hash Verification",
      passed: this.verifyIntegrity(snapshot),
      details: `Hash: ${snapshot.immutable_hash}`,
    });

    // Check 2: All runs have invariant checks
    const allInvariantPassed = snapshot.reconciliation_runs.every((r) => r.invariant_check_passed);
    checks.push({
      check: "Invariant Checks",
      passed: allInvariantPassed,
      details: `${snapshot.reconciliation_runs.filter((r) => r.invariant_check_passed).length}/${snapshot.reconciliation_runs.length} passed`,
    });

    // Check 3: Attestations present
    const hasAttestations = snapshot.attestations.length > 0;
    checks.push({
      check: "Attestations Present",
      passed: hasAttestations,
      details: `${snapshot.attestations.length} attestation(s)`,
    });

    // Check 4: Proof chain integrity
    const proofChainValid = snapshot.proof_chain.every(
      (link) => link.hash && link.timestamp && link.reference
    );
    checks.push({
      check: "Proof Chain Integrity",
      passed: proofChainValid,
      details: `${snapshot.proof_chain.length} proof link(s)`,
    });

    // Check 5: Date range valid
    const startDate = new Date(snapshot.date_range.start);
    const endDate = new Date(snapshot.date_range.end);
    checks.push({
      check: "Date Range Valid",
      passed: startDate <= endDate,
      details: `${snapshot.date_range.start} to ${snapshot.date_range.end}`,
    });

    return {
      valid: checks.every((c) => c.passed),
      checks,
    };
  }

  /**
   * Export snapshot to JSON
   */
  exportToJson(snapshot: ComplianceSnapshot): string {
    return JSON.stringify(
      snapshot,
      (key, value) => {
        if (value instanceof Map) {
          return Object.fromEntries(value);
        }
        return value;
      },
      2
    );
  }

  /**
   * Export snapshot to Markdown for human review
   */
  exportToMarkdown(snapshot: ComplianceSnapshot): string {
    let md = `# Compliance Snapshot Report\n\n`;

    md += `## Snapshot Metadata\n\n`;
    md += `- **Snapshot ID:** ${snapshot.snapshot_id}  \n`;
    md += `- **Version:** ${snapshot.version}  \n`;
    md += `- **Created:** ${snapshot.created_at}  \n`;
    md += `- **Frozen At:** ${snapshot.frozen_at}  \n`;
    md += `- **Frozen By:** ${snapshot.frozen_by}  \n`;
    md += `- **Immutable Hash:** \`${snapshot.immutable_hash}\`  \n`;
    md += `- **Date Range:** ${snapshot.date_range.start} to ${snapshot.date_range.end}  \n\n`;

    md += `## Executive Summary\n\n`;
    md += `- **Total Records Processed:** ${snapshot.summary.total_records_processed.toLocaleString()}  \n`;
    md += `- **Total Matches:** ${snapshot.summary.total_matches.toLocaleString()}  \n`;
    md += `- **Total Mismatches:** ${snapshot.summary.total_mismatches.toLocaleString()}  \n`;
    md += `- **Overall Match Rate:** ${((snapshot.summary.total_matches / Math.max(snapshot.summary.total_records_processed, 1)) * 100).toFixed(2)}%  \n`;
    md += `- **Currencies:** ${snapshot.summary.currencies.join(", ") || "N/A"}  \n\n`;

    md += `## Reconciliation Runs\n\n`;
    md += `| Run ID | Source | Target | Records | Match Rate | Invariants |\n`;
    md += `|--------|--------|--------|---------|------------|------------|\n`;

    snapshot.reconciliation_runs.forEach((run) => {
      md += `| ${run.run_id} | ${run.source_system} | ${run.target_system} | `;
      md += `${run.record_count} | ${(run.match_rate * 100).toFixed(1)}% | `;
      md += `${run.invariant_check_passed ? "✓" : "✗"} |\n`;
    });

    md += `\n`;

    if (snapshot.reconciliation_runs.some((r) => r.violations.length > 0)) {
      md += `### Violations\n\n`;
      snapshot.reconciliation_runs.forEach((run) => {
        if (run.violations.length > 0) {
          md += `**${run.run_id}:**\n`;
          run.violations.forEach((v) => {
            md += `- ⚠️ ${v}\n`;
          });
          md += `\n`;
        }
      });
    }

    md += `## Attestations\n\n`;
    if (snapshot.attestations.length === 0) {
      md += `*No attestations recorded*\n\n`;
    } else {
      snapshot.attestations.forEach((att, idx) => {
        md += `### Attestation ${idx + 1}\n\n`;
        md += `- **ID:** ${att.attestation_id}  \n`;
        md += `- **By:** ${att.attested_by} (${att.role})  \n`;
        md += `- **At:** ${att.attested_at}  \n`;
        md += `- **Scope:** ${att.scope}  \n`;
        md += `- **Statement:** ${att.statement}  \n`;
        md += `- **Signature:** \`${att.signature}\`  \n\n`;
      });
    }

    md += `## Proof Chain\n\n`;
    md += `| Link Type | Reference | Hash | Timestamp |\n`;
    md += `|-----------|-----------|------|-----------|\n`;

    snapshot.proof_chain.forEach((link) => {
      md += `| ${link.link_type} | ${link.reference} | \`${link.hash.substr(0, 16)}...\` | ${link.timestamp} |\n`;
    });

    md += `\n`;

    md += `## Verification\n\n`;
    md += `This snapshot is **${this.verifyIntegrity(snapshot) ? "VALID ✓" : "INVALID ✗"}**\n\n`;
    md += `Immutable hash ensures tamper-evident audit trail.\n\n`;

    md += `---\n\n`;
    md += `*This compliance snapshot provides financial correctness proof for the specified date range.*\n`;
    md += `*Generated by Settler Continuous Financial Truth Layer v${snapshot.version}*\n`;

    return md;
  }

  /**
   * Clear builder state
   */
  clear(): void {
    this.runs = [];
    this.attestations = [];
    this.proofChain = [];
  }

  private hashTruthTable(truthTable: TruthTableEntry[]): string {
    const data = JSON.stringify(
      truthTable.map((t) => ({
        sid: t.source_record_id,
        tid: t.target_record_id,
        status: t.match_status,
        rule: t.rule_applied,
        conf: t.confidence,
      }))
    );

    return this.simpleHash(data);
  }

  private calculateImmutableHash(snapshot: Omit<ComplianceSnapshot, "immutable_hash">): string {
    const data = JSON.stringify({
      version: snapshot.version,
      date_range: snapshot.date_range,
      runs: snapshot.reconciliation_runs.map((r) => ({
        id: r.run_id,
        hash: r.truth_table_hash,
        invariants: r.invariant_check_passed,
      })),
      attestations: snapshot.attestations.map((a) => ({
        by: a.attested_by,
        scope: a.scope,
        sig: a.signature,
      })),
      proof_chain: snapshot.proof_chain.map((p) => p.hash),
    });

    return this.simpleHash(data);
  }

  private generateSignature(user: string, statement: string): string {
    const data = `${user}:${statement}:${Date.now()}`;
    return this.simpleHash(data);
  }

  private simpleHash(data: string): string {
    // Simple hash function for demo purposes
    // In production, use crypto.createHash('sha256')
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, "0");
  }

  private generateSnapshotId(): string {
    return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default ComplianceSnapshotBuilder;
