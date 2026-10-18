/**
 * Interchange++ Forensic Margin Recovery & Card Scheme Downgrade Classifier
 *
 * Deconstructs multi-party payment processor fees into:
 *  1. Base Card Scheme Interchange (Visa, Mastercard, Amex, Discover)
 *  2. Card Network Assessment & Access Fees (FANF, NABU, Scheme Surcharges)
 *  3. Acquirer / Gateway Markup
 *
 * Formally classifies transaction tier downgrades (e.g. missing Level 2/3 B2B data,
 * EIRF settlement transit breaches) and computes recoverable basis-point leakage.
 */

import { createHash } from "node:crypto";

export type CardBrand = "VISA" | "MASTERCARD" | "AMEX" | "DISCOVER" | "UNKNOWN";

export type CardCategory =
  | "DEBIT_REGULATED" // US Durbin Amendment capped: 0.05% + 22c
  | "DEBIT_EXEMPT" // Credit unions / international: ~0.80% + 15c
  | "CREDIT_CONSUMER" // Standard retail credit: ~1.51% + 10c
  | "CREDIT_COMMERCIAL_B2B" // Purchasing / corporate card: 1.85% (L3) to 2.70% (L1)
  | "CREDIT_PREMIUM_REWARDS"; // High rewards / Infinite / World Elite: ~2.10% - 2.40%

export type DataLevelProvided = "LEVEL_1" | "LEVEL_2" | "LEVEL_3";

export type InterchangeDowngradeReason =
  | "OPTIMAL_INTERCHANGE"
  | "DOWNGRADE_MISSING_LEVEL_2"
  | "DOWNGRADE_MISSING_LEVEL_3"
  | "DOWNGRADE_EIRF_TIMING_BREACH"
  | "DOWNGRADE_CROSS_BORDER_UNJUSTIFIED"
  | "DOWNGRADE_DURBIN_OVERCHARGE";

export interface InterchangeAnalysisInput {
  transactionId: string;
  orderReference: string;
  amountCents: number;
  currency: string;
  actualFeeCents: number;
  cardBrand: CardBrand;
  cardCategory: CardCategory;
  dataLevelProvided: DataLevelProvided;
  hoursToCapture: number; // Hours between authorization and settlement capture
  isCrossBorder?: boolean;
  hasSalesTaxAmount?: boolean;
  hasLineItemDetail?: boolean;
  hasCustomerCode?: boolean;
}

export interface InterchangeFeeDecomposition {
  baseInterchangeCents: number;
  networkAssessmentCents: number;
  processorMarkupCents: number;
  crossBorderSurchargeCents: number;
}

export interface InterchangeAnalysisResult {
  transactionId: string;
  orderReference: string;
  amountCents: number;
  actualFeeCents: number;
  optimalFeeCents: number;
  excessLeakageCents: number;
  basisPointsPaid: number;
  optimalBasisPointsTarget: number;
  basisPointsLeaked: number;
  downgradeReason: InterchangeDowngradeReason;
  feeDecomposition: InterchangeFeeDecomposition;
  isRecoveryEligible: boolean;
  recommendedRemediation: string;
  proofHash: string;
}

export interface PortfolioMarginReport {
  totalTransactionsAnalyzed: number;
  totalGrossVolumeCents: number;
  totalActualFeesCents: number;
  totalOptimalFeesCents: number;
  totalRecoverableLeakageCents: number;
  averageBasisPointsPaid: number;
  optimalBasisPointsTarget: number;
  netMarginRecoveryOpportunityBasisPoints: number;
  projectedAnnualRecoveryCents: number; // extrapolated to annual run rate
  downgradeCounts: Record<InterchangeDowngradeReason, number>;
  downgradeVolumeCents: Record<InterchangeDowngradeReason, number>;
  flaggedTransactions: InterchangeAnalysisResult[];
}

export class InterchangeMarginAnalyzer {
  /**
   * Deterministically calculates optimal card scheme interchange target
   */
  public calculateOptimalInterchange(
    amountCents: number,
    brand: CardBrand,
    category: CardCategory
  ): { targetBps: number; fixedFeeCents: number } {
    if (category === "DEBIT_REGULATED") {
      // Durbin regulated: 0.05% + 22 cents (21c base + 1c fraud prevention)
      return { targetBps: 5, fixedFeeCents: 22 };
    }

    if (category === "DEBIT_EXEMPT") {
      return { targetBps: 80, fixedFeeCents: 15 };
    }

    if (category === "CREDIT_COMMERCIAL_B2B") {
      // Commercial Level 3 target rate
      if (brand === "MASTERCARD") return { targetBps: 175, fixedFeeCents: 10 };
      return { targetBps: 185, fixedFeeCents: 10 }; // Visa Commercial L3
    }

    if (category === "CREDIT_PREMIUM_REWARDS") {
      return { targetBps: 210, fixedFeeCents: 10 };
    }

    // Standard consumer credit
    if (brand === "AMEX") return { targetBps: 230, fixedFeeCents: 10 };
    return { targetBps: 151, fixedFeeCents: 10 };
  }

  /**
   * Evaluates network assessment fees (Visa FANF/Assessments, Mastercard NABU)
   */
  public calculateNetworkAssessments(
    amountCents: number,
    brand: CardBrand,
    isCrossBorder: boolean
  ): number {
    // Standard assessment is 0.14% for Visa, 0.13% for Mastercard
    const baseAssessmentRateBps = brand === "MASTERCARD" ? 13 : 14;
    const baseAssessment = Math.round((amountCents * baseAssessmentRateBps) / 10000);
    const fixedSchemeFee = brand === "MASTERCARD" ? 3 : 2; // ~2.95c NABU / Base II
    const crossBorderFee = isCrossBorder ? Math.round((amountCents * 100) / 10000) : 0; // +1.00% cross-border
    return baseAssessment + fixedSchemeFee + crossBorderFee;
  }

  /**
   * Analyzes a single transaction for interchange optimization and downgrade leakage
   */
  public analyzeTransaction(input: InterchangeAnalysisInput): InterchangeAnalysisResult {
    const { amountCents, actualFeeCents, cardBrand, cardCategory, hoursToCapture } = input;
    const basisPointsPaid =
      amountCents > 0 ? Math.round((actualFeeCents / amountCents) * 10000) : 0;

    const { targetBps, fixedFeeCents } = this.calculateOptimalInterchange(
      amountCents,
      cardBrand,
      cardCategory
    );
    const optimalInterchangeCents = Math.round((amountCents * targetBps) / 10000) + fixedFeeCents;
    const networkAssessments = this.calculateNetworkAssessments(
      amountCents,
      cardBrand,
      input.isCrossBorder ?? false
    );
    // Typical competitive processor markup is 10 basis points + 5c
    const standardMarkupCents = Math.round((amountCents * 10) / 10000) + 5;
    const optimalFeeCents = optimalInterchangeCents + networkAssessments + standardMarkupCents;

    let downgradeReason: InterchangeDowngradeReason = "OPTIMAL_INTERCHANGE";
    let recommendedRemediation = "Optimal interchange tier achieved. No remediation required.";

    // 1. Check for Durbin Regulated Overcharge
    if (cardCategory === "DEBIT_REGULATED") {
      const maxPermissibleDurbinCents =
        Math.round((amountCents * 5) / 10000) + 22 + networkAssessments + standardMarkupCents;
      if (actualFeeCents > maxPermissibleDurbinCents + 20) {
        downgradeReason = "DOWNGRADE_DURBIN_OVERCHARGE";
        recommendedRemediation =
          "Regulated debit transaction charged above statutory Durbin Amendment caps (0.05% + 22¢). File for acquirer fee schedule adjustment.";
      }
    }

    // 2. Check for EIRF (Electronic Interchange Reimbursement Fee) timing breach
    else if (hoursToCapture > 48) {
      downgradeReason = "DOWNGRADE_EIRF_TIMING_BREACH";
      recommendedRemediation = `Capture delayed by ${hoursToCapture} hours (>48h SLA). Settle within 24 hours of authorization to avoid the ~35 bps EIRF penalty.`;
    }

    // 3. Check for Commercial / B2B Level 2 / Level 3 Downgrades
    else if (cardCategory === "CREDIT_COMMERCIAL_B2B") {
      if (
        input.dataLevelProvided === "LEVEL_1" ||
        (!input.hasSalesTaxAmount && !input.hasLineItemDetail)
      ) {
        downgradeReason = "DOWNGRADE_MISSING_LEVEL_3";
        recommendedRemediation =
          "Commercial corporate card missing Level 2/3 line-item and tax data. Transmit invoice sales tax and commodity line items to recover 65-95 basis points.";
      } else if (input.dataLevelProvided === "LEVEL_2" && !input.hasLineItemDetail) {
        downgradeReason = "DOWNGRADE_MISSING_LEVEL_3";
        recommendedRemediation =
          "Commercial card qualified for Level 2 but missing Level 3 line items. Transmit itemized commodity codes to capture an additional 20-30 basis points.";
      }
    }

    const excessLeakageCents = Math.max(0, actualFeeCents - optimalFeeCents);
    const isRecoveryEligible = excessLeakageCents > 15; // Minimum 15c recoverable delta
    const optimalBasisPointsTarget =
      amountCents > 0 ? Math.round((optimalFeeCents / amountCents) * 10000) : 0;
    const basisPointsLeaked = Math.max(0, basisPointsPaid - optimalBasisPointsTarget);

    const baseInterchangeCents = optimalInterchangeCents;
    const networkAssessmentCents = networkAssessments;
    const crossBorderSurchargeCents = input.isCrossBorder
      ? Math.round((amountCents * 100) / 10000)
      : 0;
    const processorMarkupCents = Math.max(
      0,
      actualFeeCents - baseInterchangeCents - networkAssessmentCents - crossBorderSurchargeCents
    );

    const proofHash = `0x${createHash("sha256")
      .update(
        `settler:interchange:${input.transactionId}:${amountCents}:${actualFeeCents}:${downgradeReason}`
      )
      .digest("hex")}`;

    return {
      transactionId: input.transactionId,
      orderReference: input.orderReference,
      amountCents,
      actualFeeCents,
      optimalFeeCents,
      excessLeakageCents,
      basisPointsPaid,
      optimalBasisPointsTarget,
      basisPointsLeaked,
      downgradeReason,
      feeDecomposition: {
        baseInterchangeCents,
        networkAssessmentCents,
        processorMarkupCents,
        crossBorderSurchargeCents,
      },
      isRecoveryEligible,
      recommendedRemediation,
      proofHash,
    };
  }

  /**
   * Aggregates portfolio transactions into an executive margin leakage report
   */
  public analyzePortfolioMargin(transactions: InterchangeAnalysisInput[]): PortfolioMarginReport {
    const results = transactions.map((t) => this.analyzeTransaction(t));

    const totalTransactionsAnalyzed = results.length;
    const totalGrossVolumeCents = results.reduce((s, r) => s + r.amountCents, 0);
    const totalActualFeesCents = results.reduce((s, r) => s + r.actualFeeCents, 0);
    const totalOptimalFeesCents = results.reduce((s, r) => s + r.optimalFeeCents, 0);
    const totalRecoverableLeakageCents = results.reduce((s, r) => s + r.excessLeakageCents, 0);

    const averageBasisPointsPaid =
      totalGrossVolumeCents > 0
        ? Math.round((totalActualFeesCents / totalGrossVolumeCents) * 10000)
        : 0;

    const optimalBasisPointsTarget =
      totalGrossVolumeCents > 0
        ? Math.round((totalOptimalFeesCents / totalGrossVolumeCents) * 10000)
        : 0;

    const netMarginRecoveryOpportunityBasisPoints = Math.max(
      0,
      averageBasisPointsPaid - optimalBasisPointsTarget
    );

    // Projected annual recovery assuming current run represents ~1 week of volume
    const projectedAnnualRecoveryCents = totalRecoverableLeakageCents * 52;

    const downgradeCounts: Record<InterchangeDowngradeReason, number> = {
      OPTIMAL_INTERCHANGE: 0,
      DOWNGRADE_MISSING_LEVEL_2: 0,
      DOWNGRADE_MISSING_LEVEL_3: 0,
      DOWNGRADE_EIRF_TIMING_BREACH: 0,
      DOWNGRADE_CROSS_BORDER_UNJUSTIFIED: 0,
      DOWNGRADE_DURBIN_OVERCHARGE: 0,
    };

    const downgradeVolumeCents: Record<InterchangeDowngradeReason, number> = {
      OPTIMAL_INTERCHANGE: 0,
      DOWNGRADE_MISSING_LEVEL_2: 0,
      DOWNGRADE_MISSING_LEVEL_3: 0,
      DOWNGRADE_EIRF_TIMING_BREACH: 0,
      DOWNGRADE_CROSS_BORDER_UNJUSTIFIED: 0,
      DOWNGRADE_DURBIN_OVERCHARGE: 0,
    };

    for (const r of results) {
      downgradeCounts[r.downgradeReason] = (downgradeCounts[r.downgradeReason] || 0) + 1;
      downgradeVolumeCents[r.downgradeReason] =
        (downgradeVolumeCents[r.downgradeReason] || 0) + r.amountCents;
    }

    return {
      totalTransactionsAnalyzed,
      totalGrossVolumeCents,
      totalActualFeesCents,
      totalOptimalFeesCents,
      totalRecoverableLeakageCents,
      averageBasisPointsPaid,
      optimalBasisPointsTarget,
      netMarginRecoveryOpportunityBasisPoints,
      projectedAnnualRecoveryCents,
      downgradeCounts,
      downgradeVolumeCents,
      flaggedTransactions: results.filter((r) => r.isRecoveryEligible),
    };
  }
}

export const interchangeMarginAnalyzer = new InterchangeMarginAnalyzer();
