/**
 * AI Assistant API
 * Future-forward: AI-powered assistance for reconciliation setup, troubleshooting, optimization
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { handleRouteError } from "../utils/error-handler";
import { query } from "../db";
import { deterministicAISandbox } from "../services/ai-assistant/deterministic-ai-sandbox";

const router: Router = Router();

const aiQuerySchema = z.object({
  body: z.object({
    query: z.string().min(1).max(1000),
    modelProvider: z.enum(["openai", "anthropic", "local", "mcp"]).optional(),
    model: z.string().min(1).max(255).optional(),
    context: z
      .object({
        jobId: z.string().uuid().optional(),
        adapter: z.string().optional(),
        error: z.string().optional(),
      })
      .optional(),
  }),
});

// AI assistant chat endpoint
router.post(
  "/ai/assistant",
  requirePermission(Permission.JOBS_READ),
  validateRequest(aiQuerySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { query: userQuery, context } = req.body;
      const userId = req.userId!;
      const tenantId = req.tenantId;

      const response = deterministicAISandbox.execute({
        prompt: userQuery,
        context,
        preferredProvider: req.body.modelProvider,
        preferredModel: req.body.model,
      });

      await query(
        `INSERT INTO audit_logs (event, user_id, tenant_id, ip, user_agent, path, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          "ai_assistant_response_generated",
          userId,
          tenantId || null,
          req.ip || null,
          req.get("user-agent") || null,
          req.originalUrl,
          JSON.stringify({
            prompt: userQuery,
            provider: response.provider,
            model: response.model,
            responseHash: response.responseHash,
          }),
        ]
      );

      res.json({
        data: {
          query: userQuery,
          response: response.answer,
          model: response.model,
          provider: response.provider,
          responseHash: response.responseHash,
          suggestions: response.workflowSuggestions.map((item) => item.title),
          workflowSuggestions: response.workflowSuggestions,
          policyRecommendations: response.policyRecommendations,
          anomalies: response.anomalies,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get AI assistant response", 500, {
        userId: req.userId,
      });
    }
  }
);

// AI-powered optimization suggestions
router.get(
  "/jobs/:jobId/ai-optimize",
  requirePermission(Permission.JOBS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const userId = req.userId!;

      const tenantId = req.tenantId!;

      // Get job details — scoped by tenant_id
      const jobs = await query<{
        id: string;
        rules: unknown;
        source_adapter: string;
        target_adapter: string;
      }>(
        `SELECT id, rules, source_adapter, target_adapter FROM jobs WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
        [jobId || null, userId, tenantId]
      );

      if (jobs.length === 0 || !jobs[0]) {
        res.status(404).json({ error: "Job not found" });
        return;
      }

      const job = jobs[0];

      // Get performance metrics
      const metrics = await query<{
        avg_accuracy: number;
        avg_confidence: number;
        exception_rate: number;
        match_rate: number;
      }>(
        `SELECT 
           AVG((summary->>'accuracy')::float) as avg_accuracy,
           AVG((SELECT AVG(confidence) FROM matches WHERE execution_id = e.id)) as avg_confidence,
           COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM exceptions WHERE execution_id = e.id))::float / NULLIF(COUNT(*), 0) as exception_rate,
           AVG((summary->>'matched')::int::float / NULLIF((summary->>'total')::int, 0)) as match_rate
         FROM executions e
         WHERE job_id = $1 AND tenant_id = $2`,
        [jobId || null, tenantId]
      );

      const m = metrics[0] || {
        avg_accuracy: 0,
        avg_confidence: 0,
        exception_rate: 0,
        match_rate: 0,
      };

      // Generate AI optimization suggestions
      const optimizations = generateOptimizationSuggestions(job, m);

      res.json({
        data: {
          jobId,
          currentMetrics: {
            accuracy: m.avg_accuracy || 0,
            confidence: m.avg_confidence || 0,
            exceptionRate: m.exception_rate || 0,
            matchRate: m.match_rate || 0,
          },
          optimizations,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get AI optimization suggestions", 500, {
        userId: req.userId,
      });
    }
  }
);

function generateOptimizationSuggestions(
  job: { source_adapter: string; target_adapter: string; rules: unknown },
  metrics: {
    avg_accuracy: number;
    avg_confidence: number;
    exception_rate: number;
    match_rate: number;
  }
): Array<{
  type: "rule" | "tolerance" | "matching" | "performance";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  action: string;
}> {
  const suggestions: Array<{
    type: "rule" | "tolerance" | "matching" | "performance";
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    impact: string;
    action: string;
  }> = [];

  // Low accuracy suggestions
  if (metrics.avg_accuracy < 0.9) {
    suggestions.push({
      type: "matching",
      priority: "high",
      title: "Improve Matching Accuracy",
      description: `Current accuracy is ${(metrics.avg_accuracy * 100).toFixed(1)}%. Consider adding more exact match rules.`,
      impact: "Could improve accuracy by 5-10%",
      action: "Add exact match rule for transaction_id or order_id",
    });
  }

  // Low confidence suggestions
  if (metrics.avg_confidence < 0.85) {
    suggestions.push({
      type: "rule",
      priority: "medium",
      title: "Increase Match Confidence",
      description: `Average confidence is ${(metrics.avg_confidence * 100).toFixed(1)}%. Review matching rules.`,
      impact: "Could improve confidence by 10-15%",
      action: "Add exact match rules or reduce tolerance values",
    });
  }

  // High exception rate
  if (metrics.exception_rate > 0.1) {
    suggestions.push({
      type: "tolerance",
      priority: "high",
      title: "Reduce Exception Rate",
      description: `Exception rate is ${(metrics.exception_rate * 100).toFixed(1)}%. Consider adjusting tolerance.`,
      impact: "Could reduce exceptions by 20-30%",
      action: "Increase amount tolerance or add date range matching",
    });
  }

  // Low match rate
  if (metrics.match_rate < 0.8) {
    suggestions.push({
      type: "matching",
      priority: "high",
      title: "Improve Match Rate",
      description: `Match rate is ${(metrics.match_rate * 100).toFixed(1)}%. Rules may be too strict.`,
      impact: "Could improve match rate by 10-20%",
      action: "Add fuzzy matching or increase date range tolerance",
    });
  }

  // Adapter-specific suggestions
  if (job.source_adapter === "shopify" && job.target_adapter === "stripe") {
    suggestions.push({
      type: "rule",
      priority: "low",
      title: "Optimize Shopify-Stripe Matching",
      description: "For Shopify-Stripe reconciliation, match on order_id from Stripe metadata.",
      impact: "Could improve accuracy by 5%",
      action: "Add exact match rule: field='order_id', type='exact'",
    });
  }

  return suggestions;
}

export { router as aiAssistantRouter };
