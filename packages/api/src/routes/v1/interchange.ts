/**
 * Interchange++ Forensic Margin Recovery & B2B Level 2/3 API Router
 *
 * Provides REST endpoints for automated card scheme fee deconstruction,
 * downgrade classification (EIRF, Durbin caps, missing Level 2/3 line items),
 * and synthesized payload enrichment for processor margin recovery.
 */

import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { validateRequest } from "../../middleware/validation";
import { sendSuccess } from "../../utils/api-response";
import { handleRouteError } from "../../utils/error-handler";
import { InterchangeMarginAnalyzer, type InterchangeAnalysisInput } from "@settler/edge-ai-core";
import { auditInterchangeQualification, type CommercialPaymentPayload } from "@settler/adapters";

const router: Router = Router();
const analyzer = new InterchangeMarginAnalyzer();

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const singleAnalysisSchema = z.object({
  body: z.object({
    transactionId: z.string().min(1),
    orderReference: z.string().min(1),
    amountCents: z.number().int().nonnegative(),
    actualFeeCents: z.number().int().nonnegative(),
    currency: z.string().min(3).max(3).default("USD"),
    cardBrand: z.enum(["VISA", "MASTERCARD", "AMEX", "DISCOVER", "UNKNOWN"]).default("VISA"),
    cardCategory: z
      .enum([
        "DEBIT_REGULATED",
        "DEBIT_EXEMPT",
        "CREDIT_CONSUMER",
        "CREDIT_COMMERCIAL_B2B",
        "CREDIT_PREMIUM_REWARDS",
      ])
      .default("CREDIT_CONSUMER"),
    dataLevelProvided: z.enum(["LEVEL_1", "LEVEL_2", "LEVEL_3"]).default("LEVEL_1"),
    hoursToCapture: z.number().min(0).default(12),
    isCrossBorder: z.boolean().optional(),
    hasSalesTaxAmount: z.boolean().optional(),
    hasLineItemDetail: z.boolean().optional(),
    hasCustomerCode: z.boolean().optional(),
  }),
});

const portfolioAnalysisSchema = z.object({
  body: z.object({
    transactions: z
      .array(
        z.object({
          transactionId: z.string().min(1),
          orderReference: z.string().min(1),
          amountCents: z.number().int().nonnegative(),
          actualFeeCents: z.number().int().nonnegative(),
          currency: z.string().min(3).max(3).default("USD"),
          cardBrand: z.enum(["VISA", "MASTERCARD", "AMEX", "DISCOVER", "UNKNOWN"]),
          cardCategory: z.enum([
            "DEBIT_REGULATED",
            "DEBIT_EXEMPT",
            "CREDIT_CONSUMER",
            "CREDIT_COMMERCIAL_B2B",
            "CREDIT_PREMIUM_REWARDS",
          ]),
          dataLevelProvided: z.enum(["LEVEL_1", "LEVEL_2", "LEVEL_3"]),
          hoursToCapture: z.number().min(0),
          isCrossBorder: z.boolean().optional(),
          hasSalesTaxAmount: z.boolean().optional(),
          hasLineItemDetail: z.boolean().optional(),
          hasCustomerCode: z.boolean().optional(),
        })
      )
      .min(1)
      .max(5000),
  }),
});

const l3EnrichmentSchema = z.object({
  body: z.object({
    transactionId: z.string().min(1),
    cardBrand: z.enum(["VISA", "MASTERCARD", "AMEX"]).default("VISA"),
    amountCents: z.number().int().nonnegative(),
    taxAmountCents: z.number().int().nonnegative().optional(),
    customerReference: z.string().optional(),
    freightAmountCents: z.number().int().nonnegative().optional(),
    dutyAmountCents: z.number().int().nonnegative().optional(),
    lineItems: z
      .array(
        z.object({
          productCode: z.string().min(1),
          description: z.string().min(1),
          quantity: z.number().positive(),
          unitPriceCents: z.number().int().nonnegative(),
          commodityCode: z.string().optional(),
          taxAmountCents: z.number().int().nonnegative().optional(),
        })
      )
      .optional(),
  }),
});

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/interchange/rates
 * Returns scheme benchmark interchange rates, statutory caps, and assessment baselines.
 */
router.get(
  "/rates",
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const referenceSchedule = {
        durbinStatutoryCap: {
          bps: 5,
          fixedCents: 22,
          legalBasis: "Dodd-Frank Section 1075 / 12 CFR Part 235 (Regulation II)",
        },
        commercialB2B: {
          level3TargetBps: 180,
          level2TargetBps: 215,
          eirfDowngradeBps: 295,
          potentialRecoveryBps: 115,
        },
        eirfSla: {
          maxCaptureHours: 48,
          recommendedCaptureHours: 24,
          penaltyBps: 35,
        },
        networkAssessments: {
          visa: { rateBps: 14, fixedCents: 2, label: "Visa FANF + Credit Assessment" },
          mastercard: { rateBps: 13, fixedCents: 3, label: "Mastercard NABU + Assessment" },
        },
      };

      sendSuccess(res, referenceSchedule);
    } catch (error) {
      handleRouteError(res, error, "Failed to retrieve interchange rate schedules");
    }
  }
);

/**
 * POST /api/v1/interchange/analyze
 * Analyzes a single transaction against card scheme interchange benchmarks and downgrade rules.
 */
router.post(
  "/analyze",
  requirePermission(Permission.REPORTS_READ),
  validateRequest(singleAnalysisSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const input = req.body as InterchangeAnalysisInput;
      const result = analyzer.analyzeTransaction(input);

      // If commercial transaction with downgrade, compute synthesized Level 2/3 enrichment
      let enrichmentAudit = null;
      if (input.cardCategory === "CREDIT_COMMERCIAL_B2B") {
        const commercialPayload: CommercialPaymentPayload = {
          transactionId: input.transactionId,
          cardBrand:
            input.cardBrand === "DISCOVER" || input.cardBrand === "UNKNOWN"
              ? "VISA"
              : input.cardBrand,
          amountCents: input.amountCents,
          customerReference: input.hasCustomerCode ? input.orderReference : undefined,
          taxAmountCents: input.hasSalesTaxAmount
            ? Math.round(input.amountCents * 0.0825)
            : undefined,
        };
        enrichmentAudit = auditInterchangeQualification(commercialPayload);
      }

      sendSuccess(res, {
        analysis: result,
        enrichment: enrichmentAudit,
        tenantId: req.tenantId,
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to analyze transaction interchange");
    }
  }
);

/**
 * POST /api/v1/interchange/portfolio
 * Runs bulk forensic analysis on a batch of transactions and compiles executive margin leakage report.
 */
router.post(
  "/portfolio",
  requirePermission(Permission.REPORTS_READ),
  validateRequest(portfolioAnalysisSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { transactions } = req.body as { transactions: InterchangeAnalysisInput[] };
      const report = analyzer.analyzePortfolioMargin(transactions);

      sendSuccess(res, {
        report,
        tenantId: req.tenantId,
        analyzedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to compile portfolio interchange analysis");
    }
  }
);

/**
 * POST /api/v1/interchange/enrich-l3
 * Audits commercial payment payload and provides synthesized Level 2/3 tax and commodity code data.
 */
router.post(
  "/enrich-l3",
  requirePermission(Permission.REPORTS_READ),
  validateRequest(l3EnrichmentSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const payload = req.body as CommercialPaymentPayload;
      const audit = auditInterchangeQualification(payload);

      sendSuccess(res, {
        audit,
        tenantId: req.tenantId,
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to audit Level 2/3 qualification");
    }
  }
);

export default router;
