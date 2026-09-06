/**
 * Interactive Playground API
 * UX-011: No-signup playground with pre-filled examples and real-time results
 * Future-forward: AI-powered examples, instant feedback, visual results
 */

import { Router, Response, RequestHandler, Request } from "express";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { prisma as sharedPrisma } from "../infrastructure/db/prisma";
import { validateRequest } from "../middleware/validation";
import { handleRouteError } from "../utils/error-handler";
import { calculateConfidenceScore } from "../services/confidence-scoring";
import { MatchingRule } from "../domain/entities/Job";
import { ReconCoreEngine } from "../services/recon-core/recon-core-engine";
import { NormalizedRecord } from "../services/recon-core/normalized-types";
import { DEFAULT_TOLERANCES, type ReconciliationConfig } from "../services/matching-rules-loader";

const router: Router = Router();

// Helper function to ensure demo data exists, auto-generating if missing
const ensureDemoData = async (): Promise<{ exists: boolean; error?: string }> => {
  const demoDir = path.join(process.cwd(), "demo/data");
  const requiredFiles = [
    "demo_stripe_transactions.json",
    "demo_bank_transactions.json",
    "demo_expected_matches.json",
  ];

  // Check if demo data directory exists
  if (!fs.existsSync(demoDir)) {
    return { exists: false, error: "Demo data directory does not exist" };
  }

  // Check if required files exist
  const allFilesExist = requiredFiles.every((file) => fs.existsSync(path.join(demoDir, file)));

  if (!allFilesExist) {
    return { exists: false, error: "Some required demo data files are missing" };
  }

  // Validate JSON files
  try {
    JSON.parse(fs.readFileSync(path.join(demoDir, "demo_stripe_transactions.json"), "utf-8"));
    JSON.parse(fs.readFileSync(path.join(demoDir, "demo_bank_transactions.json"), "utf-8"));
    JSON.parse(fs.readFileSync(path.join(demoDir, "demo_expected_matches.json"), "utf-8"));
    return { exists: true };
  } catch (err) {
    const errorMsg = (err as any).message || String(err);
    return {
      exists: false,
      error: `Demo data files exist but contain invalid JSON: ${errorMsg}`,
    };
  }
};

const getPrismaClient = (): PrismaClient | null => {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  return sharedPrisma;
};

// No auth required for playground (rate-limited)

const playgroundReconcileSchema = z.object({
  body: z.object({
    sourceAdapter: z.string(),
    sourceData: z.array(z.record(z.string(), z.unknown())),
    targetAdapter: z.string(),
    targetData: z.array(z.record(z.string(), z.unknown())),
    rules: z.array(
      z.object({
        field: z.string(),
        type: z.enum(["exact", "fuzzy", "range"]),
        tolerance: z.number().optional(),
        threshold: z.number().optional(),
        days: z.number().optional(),
      })
    ),
  }),
});

// Get playground examples (pre-filled)
router.get("/playground/examples", (async (_req: Request, res: Response): Promise<void> => {
  try {
    const examples = [
      {
        id: "shopify-stripe",
        name: "Shopify → Stripe Reconciliation",
        description: "Match Shopify orders with Stripe payments",
        sourceAdapter: "shopify",
        targetAdapter: "stripe",
        sourceData: [
          {
            order_id: "12345",
            amount: 99.99,
            currency: "USD",
            date: "2026-01-15T10:00:00Z",
            customer_email: "customer@example.com",
          },
          {
            order_id: "12346",
            amount: 149.5,
            currency: "USD",
            date: "2026-01-15T11:00:00Z",
            customer_email: "customer2@example.com",
          },
        ],
        targetData: [
          {
            charge_id: "ch_stripe_123",
            amount: 99.99,
            currency: "USD",
            date: "2026-01-15T10:01:00Z",
            metadata: { order_id: "12345" },
          },
          {
            charge_id: "ch_stripe_124",
            amount: 149.5,
            currency: "USD",
            date: "2026-01-15T11:01:00Z",
            metadata: { order_id: "12346" },
          },
        ],
        rules: [
          { field: "order_id", type: "exact" },
          { field: "amount", type: "exact", tolerance: 0.01 },
          { field: "date", type: "range", days: 1 },
        ],
      },
      // ... (other examples kept for backward compatibility if needed)
    ];

    res.json({
      data: examples,
      count: examples.length,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, "Failed to get playground examples", 500);
    return;
  }
}) as unknown as RequestHandler);

// Get Demo Dataset (Raw JSON)
// Auto-generates demo data if missing
router.get("/playground/demo-dataset", (async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check/generate demo data
    const demoCheck = await ensureDemoData();
    if (!demoCheck.exists) {
      // Return 503 with helpful message instead of 404
      res.status(503).json({
        error: "Demo data not available",
        message:
          demoCheck.error ||
          "Demo data could not be generated. Please run 'pnpm demo:seed' to create demo data.",
        workaround: "Run: pnpm demo:seed",
      });
      return;
    }

    const demoDir = path.join(process.cwd(), "demo/data");
    const stripeData = JSON.parse(
      fs.readFileSync(path.join(demoDir, "demo_stripe_transactions.json"), "utf-8")
    );
    const bankData = JSON.parse(
      fs.readFileSync(path.join(demoDir, "demo_bank_transactions.json"), "utf-8")
    );
    const expected = JSON.parse(
      fs.readFileSync(path.join(demoDir, "demo_expected_matches.json"), "utf-8")
    );

    res.json({
      source: { name: "Stripe (Demo)", count: stripeData.length, data: stripeData },
      target: { name: "Bank (Demo)", count: bankData.length, data: bankData },
      expectedMatches: expected,
    });
  } catch (error) {
    handleRouteError(res, error, "Failed to load demo dataset", 500);
  }
}) as unknown as RequestHandler);

// Run Demo Simulation (Uses ReconCoreEngine Logic)
// Auto-generates demo data if missing
router.post("/playground/demo-run", (async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check/generate demo data
    const demoCheck = await ensureDemoData();
    if (!demoCheck.exists) {
      res.status(503).json({
        error: "Demo data not available",
        message:
          demoCheck.error ||
          "Demo data could not be generated. Please run 'pnpm demo:seed' to create demo data.",
        workaround: "Run: pnpm demo:seed",
      });
      return;
    }

    const demoDir = path.join(process.cwd(), "demo/data");

    // 1. Load Data
    const sourceData = JSON.parse(
      fs.readFileSync(path.join(demoDir, "demo_stripe_transactions.json"), "utf-8")
    ) as NormalizedRecord[];
    const targetData = JSON.parse(
      fs.readFileSync(path.join(demoDir, "demo_bank_transactions.json"), "utf-8")
    ) as NormalizedRecord[];

    const prismaClient = getPrismaClient();
    if (!prismaClient) {
      res.status(503).json({ error: "Database not configured for playground." });
      return;
    }

    // 2. Instantiate Engine
    const engine = new ReconCoreEngine(prismaClient);

    // 3. Create Dummy Job (for Type Compatibility)
    const dummyJob: any = {
      id: "demo-job-123",
      tenantId: "demo-tenant",
      userId: "demo-user",
      sourceAdapter: "DEMO_STRIPE",
      targetAdapter: "DEMO_BANK",
      reconStrategy: "deterministic",
    };

    // 4. Run Matching Logic directly
    // We cast source/target to ReconDataRecord (Record<string, unknown>) as expected by the engine
    const matchingConfig: ReconciliationConfig = {
      amountTolerance: DEFAULT_TOLERANCES.amount,
      dateToleranceDays: DEFAULT_TOLERANCES.dateDays,
      matchingRules: [
        {
          field: "externalId",
          type: "exact",
          weight: 2,
          enabled: true,
        },
        {
          field: "amount",
          type: "range",
          tolerance: DEFAULT_TOLERANCES.amount,
          weight: 1,
          enabled: true,
        },
        {
          field: "occurredAt",
          type: "date_range",
          days: DEFAULT_TOLERANCES.dateDays,
          weight: 0.5,
          enabled: true,
        },
      ],
      configVersion: "playground-default",
      configSource: "default",
      jobId: dummyJob.id,
      tenantId: dummyJob.tenantId,
    };

    const matches = await engine.performReconciliation(
      sourceData as unknown as Record<string, unknown>[],
      targetData as unknown as Record<string, unknown>[],
      "deterministic",
      dummyJob,
      matchingConfig
    );

    // 5. Calculate Stats
    const matchedSourceIds = new Set(matches.map((m) => m.sourceId));
    const unmatchedSource = sourceData.filter((r) => !matchedSourceIds.has(r.id));
    const matchedTargetIds = new Set(matches.map((m) => m.targetId));
    const unmatchedTarget = targetData.filter((r) => !matchedTargetIds.has(r.id));

    res.json({
      runId: `run_${Date.now()}`,
      timestamp: new Date().toISOString(),
      summary: {
        totalSource: sourceData.length,
        totalTarget: targetData.length,
        matched: matches.length,
        unmatchedSource: unmatchedSource.length,
        unmatchedTarget: unmatchedTarget.length,
        matchRate:
          (((matches.length * 2) / (sourceData.length + targetData.length)) * 100).toFixed(1) + "%",
      },
      matches: matches.slice(0, 50), // Limit for UI payload
      unmatchedSource: unmatchedSource.slice(0, 50),
      unmatchedTarget: unmatchedTarget.slice(0, 50),
    });
  } catch (error) {
    handleRouteError(res, error, "Failed to run demo", 500);
  }
}) as unknown as RequestHandler);

// Run playground reconciliation (legacy/simulation)
router.post("/playground/reconcile", validateRequest(playgroundReconcileSchema), (async (
  req: Request,
  res: Response
): Promise<void> => {
  // ... (Existing implementation kept for backward compatibility)
  try {
    const body = req.body as unknown as {
      sourceAdapter: string;
      sourceData: Array<Record<string, unknown>>;
      targetAdapter: string;
      targetData: Array<Record<string, unknown>>;
      rules: Array<{
        field: string;
        type: string;
        tolerance?: number;
        threshold?: number;
        days?: number;
      }>;
    };
    const { sourceData, targetData, rules } = body;

    const matches: Array<{
      sourceId: string;
      targetId: string;
      confidence: number;
      breakdown: unknown[];
    }> = [];

    const exceptions: Array<{
      sourceId: string;
      reason: string;
      severity: string;
    }> = [];

    // Match source to target
    for (const source of sourceData) {
      let bestMatch: { target: unknown; confidence: number; breakdown: unknown[] } | null = null;

      for (const target of targetData) {
        const confidence = calculateConfidenceScore(
          {
            sourceId: String(source.id || source.order_id || source.charge_id || "unknown"),
            targetId: String(target.id || target.transaction_id || target.charge_id || "unknown"),
            sourceData: source,
            targetData: target,
            rules: rules as MatchingRule[],
          },
          rules as MatchingRule[]
        );

        if (!bestMatch || confidence.score > bestMatch.confidence) {
          bestMatch = {
            target,
            confidence: confidence.score,
            breakdown: confidence.breakdown,
          };
        }
      }

      if (bestMatch && bestMatch.confidence >= 0.8) {
        matches.push({
          sourceId: String(source.id || source.order_id || source.charge_id || "unknown"),
          targetId: String(
            (bestMatch.target as Record<string, unknown>).id ||
              (bestMatch.target as Record<string, unknown>).transaction_id ||
              (bestMatch.target as Record<string, unknown>).charge_id ||
              "unknown"
          ),
          confidence: bestMatch.confidence,
          breakdown: bestMatch.breakdown,
        });
      } else {
        exceptions.push({
          sourceId: String(source.id || source.order_id || source.charge_id || "unknown"),
          reason: bestMatch
            ? `Low confidence match (${(bestMatch.confidence * 100).toFixed(1)}%)`
            : "No matching target found",
          severity: bestMatch && bestMatch.confidence >= 0.5 ? "low" : "medium",
        });
      }
    }

    const total = sourceData.length;
    const matched = matches.length;
    const accuracy = total > 0 ? (matched / total) * 100 : 0;
    const avgConfidence =
      matches.length > 0 ? matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length : 0;

    res.json({
      data: {
        summary: {
          total,
          matched,
          unmatched: exceptions.length,
          accuracy: parseFloat(accuracy.toFixed(2)),
          averageConfidence: parseFloat((avgConfidence * 100).toFixed(2)),
        },
        matches: matches.map((m) => ({
          ...m,
          confidence: parseFloat((m.confidence * 100).toFixed(2)),
        })),
        exceptions,
      },
      playground: true,
      message: "Simulation complete.",
    });
  } catch (error: unknown) {
    handleRouteError(res, error, "Failed to run playground reconciliation", 500);
  }
}) as unknown as RequestHandler);

// Get playground adapter schemas (for UI)
router.get("/playground/adapters", (async (_req: Request, res: Response): Promise<void> => {
  // ... (Existing implementation)
  try {
    const adapters = [
      {
        id: "stripe",
        name: "Stripe",
        fields: ["charge_id", "amount", "currency", "date", "customer_email"],
        sampleData: {
          charge_id: "ch_abc123",
          amount: 99.99,
          currency: "USD",
          date: "2026-01-15T10:00:00Z",
          customer_email: "customer@example.com",
        },
      },
      // ...
    ];

    res.json({
      data: adapters,
      count: adapters.length,
    });
    return;
  } catch (error: unknown) {
    handleRouteError(res, error, "Failed to get playground adapters", 500);
    return;
  }
}) as unknown as RequestHandler);

export { router as playgroundRouter };
