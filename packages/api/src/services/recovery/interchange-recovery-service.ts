/**
 * Interchange++ Forensic Recovery Service (API Layer)
 *
 * Connects the deterministic card scheme interchange margin analyzer
 * directly with Settler's autonomous Revenue OS recovery pipeline.
 *
 * Automatically detects processor downgrades (Level 2/3 data omission,
 * EIRF transit delays, Durbin regulated caps), isolates excess basis-point
 * leakage, and generates audit-ready dispute claims with cryptographic proof hashes.
 */

import {
  interchangeMarginAnalyzer,
  InterchangeAnalysisInput,
  InterchangeAnalysisResult,
  PortfolioMarginReport,
} from "@settler/edge-ai-core";
import { revenueOsRecoveryService, RecoveryClaim } from "./revenue-os-recovery-service";
import { isValidTenantUuid } from "../../utils/tenant-id";
import { logInfo } from "../../utils/logger";
import crypto from "crypto";

export interface InterchangeBatchRecoveryResult {
  report: PortfolioMarginReport;
  claimsGenerated: RecoveryClaim[];
  totalClaimAmountCents: number;
}

export class InterchangeRecoveryService {
  // Tenant-isolated in-memory cache of latest portfolio reports: Map<tenantId, PortfolioMarginReport>
  private reports: Map<string, PortfolioMarginReport> = new Map();

  private ensureTenant(tenantId: string): void {
    if (!isValidTenantUuid(tenantId)) {
      throw new Error(`Invalid tenant context: ${tenantId}`);
    }
  }

  /**
   * Analyzes an individual transaction and creates a recovery claim if leakage is detected
   */
  public async analyzeTransaction(
    tenantId: string,
    input: InterchangeAnalysisInput
  ): Promise<{
    analysis: InterchangeAnalysisResult;
    claim?: RecoveryClaim;
  }> {
    this.ensureTenant(tenantId);
    const analysis = interchangeMarginAnalyzer.analyzeTransaction(input);

    let claim: RecoveryClaim | undefined;
    if (analysis.isRecoveryEligible && analysis.excessLeakageCents > 0) {
      const claims = await revenueOsRecoveryService.generateClaimsFromDiscrepancies(tenantId, [
        {
          id: `disc_ic_${crypto.randomUUID()}`,
          rootCause: "PROCESSOR_FEE_DEDUCTION",
          sourceAmount: input.amountCents,
          varianceAmount: analysis.excessLeakageCents / 100,
          currency: input.currency,
          processorName: "STRIPE",
          sourceReferenceId: input.transactionId,
          contractedRateBasisPoints: analysis.optimalBasisPointsTarget,
          actualRateBasisPoints: analysis.basisPointsPaid,
          proofHash: analysis.proofHash,
        },
      ]);
      claim = claims[0];
      logInfo("Generated interchange downgrade recovery claim", {
        tenantId,
        transactionId: input.transactionId,
        downgradeReason: analysis.downgradeReason,
        leakageCents: analysis.excessLeakageCents,
      });
    }

    return { analysis, claim };
  }

  /**
   * Evaluates a portfolio batch, generates summary metrics, and files recovery claims
   */
  public async processPortfolioBatch(
    tenantId: string,
    transactions: InterchangeAnalysisInput[],
    options: { autoFileClaims?: boolean } = {}
  ): Promise<InterchangeBatchRecoveryResult> {
    this.ensureTenant(tenantId);
    const report = interchangeMarginAnalyzer.analyzePortfolioMargin(transactions);
    this.reports.set(tenantId, report);

    let claimsGenerated: RecoveryClaim[] = [];
    if (options.autoFileClaims !== false && report.flaggedTransactions.length > 0) {
      const discrepancyItems = report.flaggedTransactions.map((flagged) => ({
        id: `disc_ic_${crypto.randomUUID()}`,
        rootCause: "PROCESSOR_FEE_DEDUCTION" as const,
        sourceAmount: flagged.amountCents,
        varianceAmount: flagged.excessLeakageCents / 100,
        currency: "USD",
        processorName: "STRIPE" as const,
        sourceReferenceId: flagged.transactionId,
        contractedRateBasisPoints: flagged.optimalBasisPointsTarget,
        actualRateBasisPoints: flagged.basisPointsPaid,
        proofHash: flagged.proofHash,
      }));

      claimsGenerated = await revenueOsRecoveryService.generateClaimsFromDiscrepancies(
        tenantId,
        discrepancyItems
      );
    }

    const totalClaimAmountCents = claimsGenerated.reduce(
      (sum, claim) => sum + claim.totalClaimAmountMinorUnits,
      0
    );

    logInfo("Processed interchange portfolio batch", {
      tenantId,
      txCount: transactions.length,
      leakageCents: report.totalRecoverableLeakageCents,
      claimsCreated: claimsGenerated.length,
    });

    return {
      report,
      claimsGenerated,
      totalClaimAmountCents,
    };
  }

  /**
   * Retrieves latest portfolio margin report for tenant
   */
  public getTenantReport(tenantId: string): PortfolioMarginReport | null {
    this.ensureTenant(tenantId);
    return this.reports.get(tenantId) ?? null;
  }
}

export const interchangeRecoveryService = new InterchangeRecoveryService();
