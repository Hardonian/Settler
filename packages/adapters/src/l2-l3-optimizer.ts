/**
 * Interchange Level 2 / Level 3 Data Optimizer & Surcharge Auditor
 *
 * Evaluates commercial, corporate, and purchasing card transactions to audit
 * whether line-item tax and commodity data was passed, preventing silent 80-120 bps
 * interchange rate downgrades.
 */

export interface LineItemL3 {
  productCode: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  commodityCode?: string;
  taxAmountCents?: number;
}

export interface CommercialPaymentPayload {
  transactionId: string;
  cardBrand: "VISA" | "MASTERCARD" | "AMEX";
  amountCents: number;
  taxAmountCents?: number;
  customerReference?: string;
  freightAmountCents?: number;
  dutyAmountCents?: number;
  lineItems?: LineItemL3[];
}

export type InterchangeQualificationTier =
  "COMMERCIAL_LEVEL_3" | "COMMERCIAL_LEVEL_2" | "STANDARD_DOWNGRADE_EIRF";

export interface InterchangeAuditResult {
  transactionId: string;
  qualifiedTier: InterchangeQualificationTier;
  targetTier: InterchangeQualificationTier;
  effectiveRateBps: number;
  optimalRateBps: number;
  surchargePenaltyBps: number;
  surchargeLeakageCents: number;
  missingLevel2Fields: string[];
  missingLevel3Fields: string[];
  enrichmentReady: boolean;
  synthesizedEnrichment?: {
    suggestedTaxCents: number;
    suggestedCommodityCode: string;
    suggestedCustomerReference: string;
  };
}

/**
 * Audit and optimize commercial transaction payload for Level 2/3 interchange qualification.
 */
export function auditInterchangeQualification(
  payload: CommercialPaymentPayload
): InterchangeAuditResult {
  const missingL2: string[] = [];
  const missingL3: string[] = [];

  // Level 2 Requirements: Customer Code, Tax Amount > 0
  if (!payload.customerReference || payload.customerReference.trim().length === 0) {
    missingL2.push("customerReference");
  }
  if (payload.taxAmountCents === undefined || payload.taxAmountCents < 0) {
    missingL2.push("taxAmountCents");
  }

  // Level 3 Requirements: Line items with description, quantity, unit price, commodity code
  if (!payload.lineItems || payload.lineItems.length === 0) {
    missingL3.push("lineItems");
  } else {
    for (const [idx, item] of payload.lineItems.entries()) {
      if (!item.productCode) missingL3.push(`lineItems[${idx}].productCode`);
      if (!item.commodityCode) missingL3.push(`lineItems[${idx}].commodityCode`);
      if (!item.quantity || item.quantity <= 0) missingL3.push(`lineItems[${idx}].quantity`);
    }
  }

  // Determine Qualification
  let qualifiedTier: InterchangeQualificationTier;
  let effectiveRateBps: number;

  if (missingL2.length === 0 && missingL3.length === 0) {
    qualifiedTier = "COMMERCIAL_LEVEL_3";
    effectiveRateBps = 180; // ~1.80%
  } else if (missingL2.length === 0) {
    qualifiedTier = "COMMERCIAL_LEVEL_2";
    effectiveRateBps = 215; // ~2.15%
  } else {
    qualifiedTier = "STANDARD_DOWNGRADE_EIRF";
    effectiveRateBps = 295; // ~2.95%
  }

  const optimalRateBps = 180; // Optimal L3 baseline
  const surchargePenaltyBps = effectiveRateBps - optimalRateBps;
  const surchargeLeakageCents = Math.round((payload.amountCents * surchargePenaltyBps) / 10000);

  // Synthesize suggested enrichment
  const suggestedTaxCents =
    payload.taxAmountCents && payload.taxAmountCents > 0
      ? payload.taxAmountCents
      : Math.round(payload.amountCents * 0.0825);

  const suggestedCommodityCode = "43211500"; // Standard UNSPSC Computer hardware / SaaS
  const suggestedCustomerReference =
    payload.customerReference || `REF-${payload.transactionId.substring(0, 8)}`;

  return {
    transactionId: payload.transactionId,
    qualifiedTier,
    targetTier: "COMMERCIAL_LEVEL_3",
    effectiveRateBps,
    optimalRateBps,
    surchargePenaltyBps,
    surchargeLeakageCents,
    missingLevel2Fields: missingL2,
    missingLevel3Fields: missingL3,
    enrichmentReady: missingL2.length > 0 || missingL3.length > 0,
    synthesizedEnrichment: {
      suggestedTaxCents,
      suggestedCommodityCode,
      suggestedCustomerReference,
    },
  };
}
