/**
 * Confidence Score Routes
 * UX-006: Trust anchors - Confidence scores explained
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { query } from "../db";
import { handleRouteError } from "../utils/error-handler";
import { NotFoundError } from "../utils/typed-errors";
import { calculateConfidenceScore, explainConfidenceScore } from "../services/confidence-scoring";
import { MatchingRule } from "../domain/entities/Job";

const router = Router();

const getConfidenceScoreSchema = z.object({
  params: z.object({
    matchId: z.string().uuid(),
  }),
});

// Get confidence score for a match
router.get(
  "/matches/:matchId/confidence",
  requirePermission(Permission.REPORTS_READ),
  validateRequest(getConfidenceScoreSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { matchId } = req.params;
      const userId = req.userId!;

      if (!matchId || !userId) {
        throw new NotFoundError("Match ID and User ID are required", "match", matchId || "unknown");
      }

      // Get match details
      const matches = await query<{
        id: string;
        job_id: string;
        source_id: string;
        target_id: string;
        confidence: number;
        source_data: unknown;
        target_data: unknown;
      }>(
        `SELECT m.id, m.job_id, m.source_id, m.target_id, m.confidence,
                m.source_data, m.target_data
         FROM matches m
         JOIN jobs j ON m.job_id = j.id
         WHERE m.id = $1 AND j.user_id = $2`,
        [matchId, userId]
      );

      if (matches.length === 0 || !matches[0]) {
        throw new NotFoundError("Match not found", "match", matchId);
      }

      const match = matches[0];

      // Get job rules
      const jobs = await query<{ rules: unknown }>(
        `SELECT rules FROM jobs WHERE id = $1`,
        [match.job_id]
      );

      if (jobs.length === 0 || !jobs[0]) {
        throw new NotFoundError("Job not found", "job", match.job_id);
      }

      const rules = (jobs[0].rules as { matching?: unknown[] }).matching || [];

      // Calculate detailed confidence score
      const confidence = calculateConfidenceScore(
        {
          sourceId: match.source_id,
          targetId: match.target_id,
          sourceData: (match.source_data as Record<string, unknown>) || {},
          targetData: (match.target_data as Record<string, unknown>) || {},
          rules: rules as MatchingRule[],
        },
        rules as MatchingRule[]
      );

      // Explain confidence score
      const explanation = explainConfidenceScore(confidence);

      res.json({
        data: {
          matchId: match.id,
          confidence: {
            score: confidence.score,
            percentage: (confidence.score * 100).toFixed(1),
            explanation,
            breakdown: confidence.breakdown,
            factors: confidence.factors,
          },
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get confidence score", 500, { userId: req.userId });
    }
  }
);

// Get accuracy metrics for a job
router.get(
  "/jobs/:jobId/accuracy",
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const userId = req.userId!;

      if (!jobId) {
        throw new NotFoundError("Job ID is required", "job", "unknown");
      }

      // Verify job ownership
      const jobs = await query<{ id: string }>(
        `SELECT id FROM jobs WHERE id = $1 AND user_id = $2`,
        [jobId, userId]
      );

      if (jobs.length === 0) {
        throw new NotFoundError("Job not found", "job", jobId);
      }

      // Get accuracy metrics
      const metrics = await query<{
        total_matches: string;
        high_confidence: string;
        medium_confidence: string;
        low_confidence: string;
        avg_confidence: number;
        accuracy: number;
      }>(
        `SELECT 
           COUNT(*) as total_matches,
           COUNT(*) FILTER (WHERE confidence >= 0.95) as high_confidence,
           COUNT(*) FILTER (WHERE confidence >= 0.80 AND confidence < 0.95) as medium_confidence,
           COUNT(*) FILTER (WHERE confidence < 0.80) as low_confidence,
           AVG(confidence) as avg_confidence,
           (COUNT(*) FILTER (WHERE confidence >= 0.95)::float / NULLIF(COUNT(*), 0)) * 100 as accuracy
         FROM matches
         WHERE job_id = $1`,
        [jobId]
      );

      const m = metrics[0] || {
        total_matches: 0,
        high_confidence: 0,
        medium_confidence: 0,
        low_confidence: 0,
        avg_confidence: 0,
        accuracy: 0,
      };

      res.json({
        data: {
          jobId,
          accuracy: {
            totalMatches: parseInt(String(m.total_matches || "0")),
            highConfidence: parseInt(String(m.high_confidence || "0")),
            mediumConfidence: parseInt(String(m.medium_confidence || "0")),
            lowConfidence: parseInt(String(m.low_confidence || "0")),
            averageConfidence: m.avg_confidence || 0,
            accuracyPercentage: m.accuracy || 0,
            badge: m.accuracy >= 95 ? "high" : m.accuracy >= 80 ? "medium" : "low",
          },
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get accuracy metrics", 500, { userId: req.userId });
    }
  }
);

export { router as confidenceRouter };
