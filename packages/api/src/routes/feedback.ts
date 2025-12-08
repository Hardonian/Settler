/**
 * Feedback Routes
 * VOC: Feedback collection and aggregation system
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { query } from "../db";
import { handleRouteError } from "../utils/error-handler";
import { trackEventAsync } from "../utils/event-tracker";

const router = Router();

const createFeedbackSchema = z.object({
  body: z.object({
    source: z.enum(["sales_call", "user_interview", "support_ticket", "github_issue", "community", "survey"]),
    persona: z.enum(["cto", "cfo", "finance_ops", "developer"]).optional(),
    company: z.string().max(255).optional(),
    context: z.object({
      stage: z.enum(["evaluating", "onboarding", "active", "churned"]).optional(),
      useCase: z.string().optional(),
      transactionVolume: z.string().optional(),
    }).optional(),
    pain: z.object({
      description: z.string().min(1),
      severity: z.enum(["high", "medium", "low"]),
      frequency: z.enum(["daily", "weekly", "monthly", "one-time"]),
    }),
    desiredOutcome: z.object({
      description: z.string().min(1),
      successMetric: z.string().optional(),
    }),
    workaround: z.object({
      description: z.string(),
      painPoints: z.array(z.string()),
    }).optional(),
    quotes: z.array(z.string()).optional(),
    featureRequests: z.array(z.object({
      feature: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      rationale: z.string(),
    })).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const listFeedbackSchema = z.object({
  query: z.object({
    persona: z.enum(["cto", "cfo", "finance_ops", "developer"]).optional(),
    source: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default("50"),
    offset: z.string().regex(/^\d+$/).transform(Number).optional().default("0"),
  }),
});

// Create feedback
router.post(
  "/feedback",
  requirePermission(Permission.USERS_WRITE),
  validateRequest(createFeedbackSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const feedback = req.body;

      const result = await query<{ id: string }>(
        `INSERT INTO feedback (
           user_id, source, persona, company, context,
           pain, desired_outcome, workaround, quotes, feature_requests, tags
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          userId,
          feedback.source,
          feedback.persona || null,
          feedback.company || null,
          JSON.stringify(feedback.context || {}),
          JSON.stringify(feedback.pain),
          JSON.stringify(feedback.desiredOutcome),
          feedback.workaround ? JSON.stringify(feedback.workaround) : null,
          feedback.quotes || [],
          feedback.featureRequests ? JSON.stringify(feedback.featureRequests) : null,
          feedback.tags || [],
        ]
      );

      if (!result[0]) {
        throw new Error('Failed to create feedback');
      }

      // Track event
      trackEventAsync(userId, 'FeedbackCreated', {
        feedbackId: result[0].id,
        source: feedback.source,
        persona: feedback.persona,
      });

      res.status(201).json({
        data: {
          id: result[0].id,
        },
        message: "Feedback created successfully",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to create feedback", 500, { userId: req.userId });
    }
  }
);

// List feedback
router.get(
  "/feedback",
  requirePermission(Permission.USERS_READ),
  validateRequest(listFeedbackSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const queryParams = listFeedbackSchema.parse({ query: req.query });
      const { persona, source, startDate, endDate, limit, offset } = queryParams.query;

      const conditions: string[] = [];
      const values: (string | number | boolean | Date | null)[] = [];
      let paramCount = 1;

      // Only show feedback for user's organization (or all if admin)
      conditions.push(`user_id = $${paramCount++}`);
      values.push(userId);

      if (persona) {
        conditions.push(`persona = $${paramCount++}`);
        values.push(persona);
      }

      if (source) {
        conditions.push(`source = $${paramCount++}`);
        values.push(source);
      }

      if (startDate) {
        conditions.push(`created_at >= $${paramCount++}`);
        values.push(new Date(startDate));
      }

      if (endDate) {
        conditions.push(`created_at <= $${paramCount++}`);
        values.push(new Date(endDate));
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const feedback = await query<{
        id: string;
        source: string;
        persona: string | null;
        company: string | null;
        context: unknown;
        pain: unknown;
        desired_outcome: unknown;
        workaround: unknown | null;
        quotes: string[];
        feature_requests: unknown | null;
        tags: string[];
        created_at: Date;
      }>(
        `SELECT id, source, persona, company, context,
                pain, desired_outcome, workaround, quotes, feature_requests, tags,
                created_at
         FROM feedback
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramCount++} OFFSET $${paramCount++}`,
        [...values, limit, offset]
      );

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM feedback ${whereClause}`,
        values
      );

      if (!countResult[0]) {
        throw new Error('Failed to get feedback count');
      }
      const total = parseInt(countResult[0].count);

      res.json({
        data: feedback.map((f) => {
          if (!f) return null;
          return {
            id: f.id,
            source: f.source,
            persona: f.persona,
            company: f.company,
            context: f.context,
            pain: f.pain,
            desiredOutcome: f.desired_outcome,
            workaround: f.workaround,
            quotes: f.quotes,
            featureRequests: f.feature_requests,
            tags: f.tags,
            createdAt: f.created_at.toISOString(),
          };
        }).filter((f) => f !== null),
        pagination: {
          limit,
          offset,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to list feedback", 500, { userId: req.userId });
    }
  }
);

// Get feedback insights
router.get(
  "/feedback/insights",
  requirePermission(Permission.USERS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { startDate, endDate } = req.query as {
        startDate?: string;
        endDate?: string;
      };

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Top pains by frequency
      const topPains = await query<{
        pain_description: string;
        count: string;
        avg_severity: string;
      }>(
        `SELECT 
           pain->>'description' as pain_description,
           COUNT(*) as count,
           AVG(CASE 
             WHEN pain->>'severity' = 'high' THEN 3
             WHEN pain->>'severity' = 'medium' THEN 2
             WHEN pain->>'severity' = 'low' THEN 1
           END) as avg_severity
         FROM feedback
         WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
         GROUP BY pain_description
         ORDER BY count DESC, avg_severity DESC
         LIMIT 10`,
        [userId, start, end]
      );

      // Feature requests by frequency
      const topFeatureRequests = await query<{
        feature: string;
        count: string;
        avg_priority: string;
      }>(
        `SELECT 
           feature_request->>'feature' as feature,
           COUNT(*) as count,
           AVG(CASE 
             WHEN feature_request->>'priority' = 'high' THEN 3
             WHEN feature_request->>'priority' = 'medium' THEN 2
             WHEN feature_request->>'priority' = 'low' THEN 1
           END) as avg_priority
         FROM feedback,
         LATERAL jsonb_array_elements(feature_requests) AS feature_request
         WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
         GROUP BY feature
         ORDER BY count DESC, avg_priority DESC
         LIMIT 10`,
        [userId, start, end]
      );

      res.json({
        data: {
          topPains: topPains.map(p => ({
            description: p.pain_description,
            count: parseInt(p.count),
            avgSeverity: parseFloat(p.avg_severity),
          })),
          topFeatureRequests: topFeatureRequests.map(f => ({
            feature: f.feature,
            count: parseInt(f.count),
            avgPriority: parseFloat(f.avg_priority),
          })),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get feedback insights", 500, { userId: req.userId });
    }
  }
);

export { router as feedbackRouter };
