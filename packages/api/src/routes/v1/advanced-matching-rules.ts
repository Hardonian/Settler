/**
 * Advanced Matching Rules API Routes
 * Handles custom matching rules endpoints
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { enforceFreezeState } from "../../middleware/governance";
import { logError, logInfo } from "../../utils/logger";
import {
  createCustomMatchingRule,
  getCustomMatchingRule,
  listCustomMatchingRules,
  testMatchingRule,
  type MatchingRule,
} from "../../services/advanced-matching-rules";

const router: Router = Router();

/**
 * POST /api/v1/advanced-matching-rules
 * Create a custom matching rule
 */
router.post("/", enforceFreezeState(), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.userId!;
    const rule = req.body as MatchingRule;

    if (!rule.name || !rule.ruleType || !rule.ruleConfig) {
      return res.status(400).json({
        error: "Bad Request",
        message: "name, ruleType, and ruleConfig are required",
        traceId: req.traceId,
      });
    }

    const ruleId = await createCustomMatchingRule(tenantId, userId, rule);

    logInfo("Custom matching rule created", { ruleId, tenantId, userId, traceId: req.traceId });

    return res.status(201).json({
      id: ruleId,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to create custom matching rule", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create custom matching rule",
      traceId: req.traceId,
    });
  }
});

/**
 * GET /api/v1/advanced-matching-rules
 * List custom matching rules
 */
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { isTemplate, isActive, limit = 100, offset = 0 } = req.query;

    const rules = await listCustomMatchingRules(tenantId, {
      isTemplate: isTemplate === "true" ? true : isTemplate === "false" ? false : undefined,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    return res.json({
      data: rules,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: rules.length,
      },
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to list custom matching rules", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to list custom matching rules",
      traceId: req.traceId,
    });
  }
});

/**
 * GET /api/v1/advanced-matching-rules/:ruleId
 * Get custom matching rule
 */
router.get("/:ruleId", async (req: AuthRequest, res: Response) => {
  try {
    const ruleIdParam = req.params["ruleId"];
    const ruleId = Array.isArray(ruleIdParam) ? (ruleIdParam[0] ?? "") : (ruleIdParam ?? "");
    const tenantId = req.tenantId!;

    if (!ruleId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "ruleId is required",
        traceId: req.traceId,
      });
    }

    const rule = await getCustomMatchingRule(tenantId, ruleId);

    if (!rule) {
      return res.status(404).json({
        error: "Not Found",
        message: "Custom matching rule not found",
        traceId: req.traceId,
      });
    }

    return res.json({
      ...rule,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to get custom matching rule", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get custom matching rule",
      traceId: req.traceId,
    });
  }
});

/**
 * POST /api/v1/advanced-matching-rules/:ruleId/test
 * Test a matching rule
 */
router.post("/:ruleId/test", enforceFreezeState(), async (req: AuthRequest, res: Response) => {
  try {
    const ruleIdParam2 = req.params["ruleId"];
    const ruleId = Array.isArray(ruleIdParam2) ? (ruleIdParam2[0] ?? "") : (ruleIdParam2 ?? "");
    const tenantId = req.tenantId!;
    const { sourceData, targetData } = req.body;

    if (!ruleId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "ruleId is required",
        traceId: req.traceId,
      });
    }

    if (!sourceData || !targetData) {
      return res.status(400).json({
        error: "Bad Request",
        message: "sourceData and targetData are required",
        traceId: req.traceId,
      });
    }

    const rule = await getCustomMatchingRule(tenantId, ruleId);
    if (!rule) {
      return res.status(404).json({
        error: "Not Found",
        message: "Custom matching rule not found",
        traceId: req.traceId,
      });
    }

    const testResult = await testMatchingRule(rule, sourceData, targetData);

    return res.json({
      ...testResult,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to test matching rule", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to test matching rule",
      traceId: req.traceId,
    });
  }
});

export default router;
