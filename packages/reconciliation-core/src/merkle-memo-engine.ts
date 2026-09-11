/**
 * Explainable Merkle Discrepancy Memo Engine (XAI)
 *
 * Translates raw cryptographic SHA-256 state root differences and leaf mismatches
 * into plain-English, structured auditor memos with exact mathematical attribution
 * and corrective double-entry journal recommendations.
 *
 * Deterministic, zero-drift integer cents, RFC 6962 hash-linked.
 */

import { createHash } from "node:crypto";

export interface MerkleDiscrepancyContext {
  tenantId: string;
  expectedStateRoot: string;
  actualStateRoot: string;
  transactionId: string;
  rail: string;
  expectedAmountCents: number;
  actualAmountCents: number;
  expectedCurrency: string;
  actualCurrency: string;
  observedLagHours?: number;
  discrepancyType:
    | "AMOUNT_MISMATCH"
    | "FEE_SURCHARGE_CREEP"
    | "FLOAT_TIMING_LAG"
    | "CURRENCY_MISMATCH"
    | "UNAUTHORIZED_STATE_MODIFICATION";
}

export interface CorrectiveJournalEntry {
  debitAccount: string;
  creditAccount: string;
  amountCents: number;
  currency: string;
  description: string;
}

export interface ExplainableAuditMemo {
  memoId: string;
  tenantId: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  summary: string;
  detailedAnalysis: string;
  regulatoryStandardCitation: string;
  correctiveAction: CorrectiveJournalEntry;
  merkleProofAttestation: {
    expectedRoot: string;
    actualRoot: string;
    deltaCents: number;
    memoHash: string;
  };
}

export function synthesizeDiscrepancyMemo(ctx: MerkleDiscrepancyContext): ExplainableAuditMemo {
  if (!ctx.tenantId || ctx.tenantId.trim() === "") {
    throw new Error("Tenant context invariant violation: tenantId is required");
  }

  const deltaCents = ctx.actualAmountCents - ctx.expectedAmountCents;
  const absDelta = Math.abs(deltaCents);
  let severity: ExplainableAuditMemo["severity"] = "MEDIUM";
  let summary = "";
  let detailedAnalysis = "";
  let citation = "";
  let correctiveAction: CorrectiveJournalEntry;

  switch (ctx.discrepancyType) {
    case "AMOUNT_MISMATCH":
      severity = absDelta > 100000 ? "CRITICAL" : "HIGH"; // > $1,000 is critical
      summary = `Settlement value discrepancy of $${(absDelta / 100).toFixed(2)} on rail ${ctx.rail}`;
      detailedAnalysis =
        `Transaction ${ctx.transactionId} settled on rail ${ctx.rail} for ${ctx.actualAmountCents} cents ` +
        `(${ctx.actualCurrency}), whereas internal ledger recorded ${ctx.expectedAmountCents} cents (${ctx.expectedCurrency}). ` +
        `Variance: ${deltaCents > 0 ? "+" : ""}${deltaCents} cents. Merkle root diverged from expected ${ctx.expectedStateRoot.slice(0, 12)}... to ${ctx.actualStateRoot.slice(0, 12)}...`;
      citation =
        "ASC-606 (Revenue from Contracts with Customers) / SOX-404 Internal Control over Financial Reporting";
      correctiveAction = {
        debitAccount: deltaCents < 0 ? "1105-PROCESSOR-CLEARING-ADJUSTMENT" : "1010-CASH-OPERATING",
        creditAccount:
          deltaCents < 0 ? "5050-RECONCILIATION-VARIANCE-EXPENSE" : "2105-UNALLOCATED-DEPOSITS",
        amountCents: absDelta,
        currency: ctx.actualCurrency,
        description: `Rebalancing journal for discrepancy on tx ${ctx.transactionId}`,
      };
      break;

    case "FEE_SURCHARGE_CREEP":
      severity = "HIGH";
      summary = `Processor undisclosed surcharge leakage of $${(absDelta / 100).toFixed(2)} on rail ${ctx.rail}`;
      detailedAnalysis =
        `Processor deducted ${absDelta} cents beyond contractual interchange caps on transaction ${ctx.transactionId}. ` +
        `Deduction exceeds approved rate schedule. Surcharge quarantined for merchant clawback.`;
      citation =
        "Dodd-Frank Section 1075 (Durbin Amendment) / Visa Core Operating Regulations 1.5.1";
      correctiveAction = {
        debitAccount: "1350-PROCESSOR-CLAWBACK-RECEIVABLE",
        creditAccount: "5010-PAYMENT-PROCESSING-FEES",
        amountCents: absDelta,
        currency: ctx.actualCurrency,
        description: `Clawback receivable booked for processor fee creep on tx ${ctx.transactionId}`,
      };
      break;

    case "FLOAT_TIMING_LAG":
      severity = "MEDIUM";
      summary = `Deposit timing variance: clearance delayed by ${ctx.observedLagHours ?? 48} hours on rail ${ctx.rail}`;
      detailedAnalysis =
        `Funds for transaction ${ctx.transactionId} remain unsettled beyond contractual settlement SLA of ${ctx.observedLagHours ?? 48} hours. ` +
        `Funds classified into aging float delay bucket.`;
      citation = "Expedited Funds Availability Act (12 U.S.C. 4001 et seq.) / Regulation CC";
      correctiveAction = {
        debitAccount: "1110-TRANSIT-FLOAT-RECEIVABLE",
        creditAccount: "1020-SETTLEMENT-CLEARING-ACCOUNT",
        amountCents: ctx.expectedAmountCents,
        currency: ctx.expectedCurrency,
        description: `Reclassification to aging transit float on tx ${ctx.transactionId}`,
      };
      break;

    case "CURRENCY_MISMATCH":
      severity = "HIGH";
      summary = `Triangular FX mismatch: expected ${ctx.expectedCurrency} settled in ${ctx.actualCurrency}`;
      detailedAnalysis =
        `Foreign exchange conversion omitted on transaction ${ctx.transactionId}. Expected settlement in ${ctx.expectedCurrency} ` +
        `was executed in ${ctx.actualCurrency} without benchmark rate validation.`;
      citation = "IAS 21 (The Effects of Changes in Foreign Exchange Rates)";
      correctiveAction = {
        debitAccount: "5200-FOREIGN-EXCHANGE-LOSS",
        creditAccount: "1010-CASH-OPERATING",
        amountCents: absDelta,
        currency: ctx.actualCurrency,
        description: `Foreign exchange rate adjustment on tx ${ctx.transactionId}`,
      };
      break;

    case "UNAUTHORIZED_STATE_MODIFICATION":
      severity = "CRITICAL";
      summary = `Cryptographic Merkle state root integrity violation on ledger journal`;
      detailedAnalysis =
        `The expected state root ${ctx.expectedStateRoot} does not match computed root ${ctx.actualStateRoot}. ` +
        `Ledger journal line was modified outside authorized double-entry posting pipeline. Immediate lockdown initiated.`;
      citation =
        "PCAOB Auditing Standard No. 2201 / AICPA SOC 2 Type II Trust Services Criteria CC6.1";
      correctiveAction = {
        debitAccount: "9999-SUSPENSE-ISOLATION-HOLD",
        creditAccount: "9999-SUSPENSE-ISOLATION-HOLD",
        amountCents: 0,
        currency: ctx.actualCurrency,
        description: "Zero-sum quarantine lock on corrupted ledger state",
      };
      break;
  }

  // Generate RFC 6962 SHA-256 leaf hash for the audit memo
  const memoPreimage = Buffer.concat([
    Buffer.from([0x00]),
    Buffer.from(
      `${ctx.tenantId}|${ctx.transactionId}|${ctx.expectedStateRoot}|${ctx.actualStateRoot}|${deltaCents}|${citation}`
    ),
  ]);
  const memoHash = createHash("sha256").update(memoPreimage).digest("hex");
  const memoId = `memo_${ctx.tenantId}_${memoHash.slice(0, 12)}`;

  return {
    memoId,
    tenantId: ctx.tenantId,
    severity,
    summary,
    detailedAnalysis,
    regulatoryStandardCitation: citation,
    correctiveAction,
    merkleProofAttestation: {
      expectedRoot: ctx.expectedStateRoot,
      actualRoot: ctx.actualStateRoot,
      deltaCents,
      memoHash,
    },
  };
}
