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

const router = Router();

const aiQuerySchema = z.object({
  body: z.object({
    query: z.string().min(1).max(1000),
    context: z.object({
      jobId: z.string().uuid().optional(),
      adapter: z.string().optional(),
      error: z.string().optional(),
    }).optional(),
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

      // AI-powered response generation
      const response = await generateAIResponse(userQuery, context, userId);

      res.json({
        data: {
          query: userQuery,
          response: response.answer,
          suggestions: response.suggestions,
          codeExamples: response.codeExamples,
          docLinks: response.docLinks,
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get AI assistant response", 500, { userId: req.userId });
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

      // Get job details
      const jobs = await query<{ id: string; rules: unknown; source_adapter: string; target_adapter: string }>(
        `SELECT id, rules, source_adapter, target_adapter FROM jobs WHERE id = $1 AND user_id = $2`,
        [jobId || null, userId]
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
         WHERE job_id = $1`,
        [jobId || null]
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
      handleRouteError(res, error, "Failed to get AI optimization suggestions", 500, { userId: req.userId });
    }
  }
);

// Helper functions

async function generateAIResponse(
  query: string,
  _context?: { jobId?: string; adapter?: string; error?: string },
  _userId?: string
): Promise<{
  answer: string;
  suggestions: string[];
  codeExamples?: string[];
  docLinks?: string[];
}> {
  const lowerQuery = query.toLowerCase();

  // Pattern matching for common queries (in production, would use LLM API)
  if (lowerQuery.includes("how to") || lowerQuery.includes("setup") || lowerQuery.includes("configure")) {
    return {
      answer: "To set up reconciliation, create a job with source and target adapters, then configure matching rules. Here's a quick example:",
      suggestions: [
        "Use exact matching for transaction IDs",
        "Add tolerance for amount matching (e.g., $0.01)",
        "Use date ranges for timing differences",
      ],
      codeExamples: [
        `const job = await settler.jobs.create({
  name: "My Reconciliation",
  source: { adapter: "stripe", config: { apiKey: "sk_test_..." } },
  target: { adapter: "shopify", config: { apiKey: "shpat_...", shopDomain: "..." } },
  rules: {
    matching: [
      { field: "transaction_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 }
    ]
  }
});`,
      ],
      docLinks: ["https://docs.settler.io/getting-started", "https://docs.settler.io/api/jobs"],
    };
  }

  if (lowerQuery.includes("error") || lowerQuery.includes("problem") || lowerQuery.includes("issue")) {
    return {
      answer: "Let me help troubleshoot. Common issues include invalid API keys, adapter configuration errors, or matching rule problems.",
      suggestions: [
        "Check your API keys are valid and have correct permissions",
        "Verify adapter configuration matches the schema",
        "Review matching rules - they may be too strict or too loose",
        "Check exception queue for unmatched transactions",
      ],
      codeExamples: [
        `// Test adapter connection
const result = await settler.adapters.test("stripe", {
  apiKey: "sk_test_..."
});

// Check exceptions
const exceptions = await settler.exceptions.list({
  jobId: "job_abc123"
});`,
      ],
      docLinks: ["https://docs.settler.io/troubleshooting", "https://docs.settler.io/api/errors"],
    };
  }

  if (lowerQuery.includes("optimize") || lowerQuery.includes("improve") || lowerQuery.includes("accuracy")) {
    return {
      answer: "To optimize reconciliation accuracy, consider:",
      suggestions: [
        "Add more exact match rules for higher confidence",
        "Adjust tolerance values based on your data patterns",
        "Use fuzzy matching for fields with variations",
        "Review exception patterns to identify rule improvements",
      ],
      codeExamples: [
        `// Get accuracy metrics
const accuracy = await settler.jobs.accuracy("job_abc123");

// Get AI optimization suggestions
const optimizations = await settler.jobs.aiOptimize("job_abc123");`,
      ],
      docLinks: ["https://docs.settler.io/optimization", "https://docs.settler.io/matching-rules"],
    };
  }

  // Default response
  return {
    answer: "I can help with reconciliation setup, troubleshooting, optimization, and best practices. What would you like to know?",
    suggestions: [
      "How to set up a reconciliation job",
      "How to troubleshoot errors",
      "How to optimize matching rules",
      "How to handle exceptions",
    ],
    docLinks: ["https://docs.settler.io"],
  };
}

function generateOptimizationSuggestions(
  job: { source_adapter: string; target_adapter: string; rules: unknown },
  metrics: { avg_accuracy: number; avg_confidence: number; exception_rate: number; match_rate: number }
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
  if (metrics.avg_accuracy < 0.90) {
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
  if (metrics.exception_rate > 0.10) {
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
  if (metrics.match_rate < 0.80) {
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
