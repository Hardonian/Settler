/**
 * Cross-Border Card Scheme Surcharge Classifier
 *
 * Deconstructs Visa International Service Assessment (ISA/IAF) and Mastercard
 * Cross-Border Assessment (ICA) surcharges to audit merchant acquirer passthrough accuracy.
 *
 * Strict integer basis points, zero float drift, RFC 6962 leaf hashing.
 */

import { createHash } from "node:crypto";

export interface CrossBorderTransaction {
  id: string;
  tenantId: string;
  cardScheme: "VISA" | "MASTERCARD";
  merchantCountry: string; // ISO 2-letter, e.g. "US"
  cardholderCountry: string; // ISO 2-letter, e.g. "GB"
  settlementCurrency: string;
  transactionCurrency: string;
  amountCents: number;
  actualProcessorSurchargeCents: number;
}

export interface SchemeAssessmentRule {
  singleCurrencyBps: number; // e.g. 100 bps (1.00%) for Visa ISA without currency conversion
  multiCurrencyBps: number; // e.g. 140 bps (1.40%) for Visa ISA with currency conversion
}

export const SCHEME_ASSESSMENT_RULES: Record<"VISA" | "MASTERCARD", SchemeAssessmentRule> = {
  VISA: {
    singleCurrencyBps: 100, // 1.00%
    multiCurrencyBps: 140, // 1.40%
  },
  MASTERCARD: {
    singleCurrencyBps: 100, // 1.00%
    multiCurrencyBps: 140, // 1.40%
  },
};

export interface CrossBorderAuditResult {
  transactionId: string;
  tenantId: string;
  isCrossBorder: boolean;
  isMultiCurrency: boolean;
  contractualAssessmentBps: number;
  expectedSurchargeCents: number;
  actualProcessorSurchargeCents: number;
  varianceCents: number;
  isMarkupCompliant: boolean;
  classificationHash: string;
}

export function classifyCrossBorderSurcharge(
  tenantId: string,
  tx: CrossBorderTransaction
): CrossBorderAuditResult {
  if (!tenantId || tenantId.trim() === "") {
    throw new Error("Tenant isolation invariant violation: tenantId is required");
  }
  if (tx.tenantId !== tenantId) {
    throw new Error("Cross-tenant access violation: tenantId mismatch");
  }

  const isCrossBorder = tx.merchantCountry !== tx.cardholderCountry;
  const isMultiCurrency = tx.settlementCurrency !== tx.transactionCurrency;

  let contractualAssessmentBps = 0;
  let expectedSurchargeCents = 0;

  if (isCrossBorder) {
    const rule = SCHEME_ASSESSMENT_RULES[tx.cardScheme];
    contractualAssessmentBps = isMultiCurrency ? rule.multiCurrencyBps : rule.singleCurrencyBps;

    expectedSurchargeCents = Math.floor((tx.amountCents * contractualAssessmentBps) / 10000);
  }

  const varianceCents = tx.actualProcessorSurchargeCents - expectedSurchargeCents;
  // Processor surcharge markup cannot exceed 10 bps (tolerance margin)
  const isMarkupCompliant = varianceCents <= Math.max(5, Math.floor((tx.amountCents * 10) / 10000));

  // RFC 6962 SHA-256 leaf hash
  const preimage = Buffer.concat([
    Buffer.from([0x00]),
    Buffer.from(
      `CROSS_BORDER|${tenantId}|${tx.id}|${isCrossBorder}|${expectedSurchargeCents}|${tx.actualProcessorSurchargeCents}`
    ),
  ]);
  const classificationHash = createHash("sha256").update(preimage).digest("hex");

  return {
    transactionId: tx.id,
    tenantId,
    isCrossBorder,
    isMultiCurrency,
    contractualAssessmentBps,
    expectedSurchargeCents,
    actualProcessorSurchargeCents: tx.actualProcessorSurchargeCents,
    varianceCents,
    isMarkupCompliant,
    classificationHash,
  };
}
