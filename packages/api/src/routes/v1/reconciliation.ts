/**
 * Reconciliation API Routes
 * Handles reconciliation runs and matches
 */

import { Router, Response } from "express";
import { tenantMiddleware, TenantRequest } from "../../middleware/tenant";
import { logError, logInfo } from "../../utils/logger";
import { runReconciliation } from "../../services/ingestion/reconciliation-matcher";
import { query } from "../../db";
import { ReconciliationConfig } from "../../services/ingestion/types";

const router = Router();

/**
 * POST /api/v1/reconciliation/run
 * Run reconciliation for an ingestion
 */
router.post("/run", tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const { ingestionId, config } = req.body;
  const tenantId = req.tenantId!;
  const userId = req.userId!;
  
  try {

    if (!ingestionId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "ingestionId is required",
        traceId: req.traceId,
      });
    }

    const reconciliationConfig: ReconciliationConfig = {
      dateWindowDays: config?.dateWindowDays || 7,
      amountTolerance: config?.amountTolerance || 0.01,
      fuzzyDescriptionThreshold: config?.fuzzyDescriptionThreshold || 0.8,
      requireExactAmount: config?.requireExactAmount || false,
    };

    const runId = await runReconciliation(
      ingestionId,
      tenantId,
      userId,
      reconciliationConfig
    );

    logInfo("Reconciliation run started", { runId, ingestionId, traceId: req.traceId });

    return res.status(201).json({
      runId,
      ingestionId,
      status: "running",
      config: reconciliationConfig,
      traceId: req.traceId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logError("Failed to run reconciliation", error, { 
      traceId: req.traceId,
      ingestionId,
      tenantId,
      userId,
    });
    
    // Check for specific error types
    if (errorMessage.includes("not found") || errorMessage.includes("does not exist")) {
      return res.status(404).json({
        error: "Not Found",
        message: `Ingestion ${ingestionId} not found. Please verify the ingestion ID and try again.`,
        traceId: req.traceId,
      });
    }
    
    if (errorMessage.includes("limit") || errorMessage.includes("quota") || errorMessage.includes("exceeded")) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: `Reconciliation limit exceeded. ${errorMessage}. Please upgrade your plan or wait before running more reconciliations.`,
        traceId: req.traceId,
      });
    }
    
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      return res.status(403).json({
        error: "Forbidden",
        message: `You don't have permission to run reconciliations. Please contact support if you believe this is an error.`,
        traceId: req.traceId,
      });
    }
    
    if (errorMessage.includes("connection") || errorMessage.includes("timeout") || errorMessage.includes("ECONNREFUSED")) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: `Database connection failed while starting reconciliation. Please try again in a few moments.`,
        traceId: req.traceId,
      });
    }
    
    // Validation errors
    if (errorMessage.includes("invalid") || errorMessage.includes("required") || errorMessage.includes("missing")) {
      return res.status(400).json({
        error: "Bad Request",
        message: `Invalid reconciliation configuration: ${errorMessage}. Please check your request and try again.`,
        traceId: req.traceId,
      });
    }
    
    // Default to 500 only for truly unexpected errors
    return res.status(500).json({
      error: "Internal Server Error",
      message: `Failed to run reconciliation: ${errorMessage}. Please contact support with traceId if this persists.`,
      traceId: req.traceId,
    });
  }
});

/**
 * GET /api/v1/reconciliation/runs/:runId
 * Get reconciliation run details
 */
router.get("/runs/:runId", tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const { runId } = req.params;
  const tenantId = req.tenantId!;
  
  try {

    const results = await query(
      `SELECT 
        id, ingestion_id, status, started_at, completed_at,
        source_count, target_count, matched_count,
        unmatched_source_count, unmatched_target_count,
        confidence_avg, error_message, trace_id, metadata
      FROM reconciliation_runs
      WHERE id = $1 AND tenant_id = $2`,
      [runId || "", tenantId]
    );

    if (results.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Reconciliation run not found",
        traceId: req.traceId,
      });
    }

    const run = results[0] as Record<string, unknown>;

    return res.json({
      id: run.id as string,
      ingestionId: run.ingestion_id as string | null,
      status: run.status as string,
      startedAt: run.started_at as Date,
      completedAt: run.completed_at as Date | null,
      sourceCount: run.source_count as number,
      targetCount: run.target_count as number,
      matchedCount: run.matched_count as number,
      unmatchedSourceCount: run.unmatched_source_count as number,
      unmatchedTargetCount: run.unmatched_target_count as number,
      confidenceAvg: run.confidence_avg as number | null,
      errorMessage: run.error_message as string | null,
      traceId: run.trace_id as string | null,
      metadata:
        typeof run.metadata === "string"
          ? JSON.parse(run.metadata as string)
          : run.metadata,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logError("Failed to get reconciliation run", error, {
      traceId: req.traceId,
      runId,
      tenantId,
    });
    
    // Database connection errors
    if (errorMessage.includes("connection") || errorMessage.includes("timeout") || errorMessage.includes("ECONNREFUSED")) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: `Database connection failed while retrieving reconciliation run. Please try again in a few moments.`,
        traceId: req.traceId,
      });
    }
    
    // Default to 500 only for truly unexpected errors
    return res.status(500).json({
      error: "Internal Server Error",
      message: `Failed to get reconciliation run: ${errorMessage}. Please contact support with traceId if this persists.`,
      traceId: req.traceId,
    });
  }
});

/**
 * GET /api/v1/reconciliation/runs/:runId/matches
 * Get reconciliation matches
 */
router.get("/runs/:runId/matches", tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const { runId } = req.params;
  const tenantId = req.tenantId!;
  
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const matchType = req.query.matchType as string | undefined;
    const reviewed = req.query.reviewed as string | undefined;

    let queryStr = `SELECT 
      rm.id, rm.match_type, rm.confidence, rm.match_reason,
      rm.amount_diff, rm.date_diff, rm.reviewed, rm.reviewed_at,
      st.id as source_id, st.amount as source_amount, st.currency as source_currency,
      st.date as source_date, st.description as source_description,
      st.external_id as source_external_id,
      tt.id as target_id, tt.amount as target_amount, tt.currency as target_currency,
      tt.date as target_date, tt.description as target_description,
      tt.external_id as target_external_id
    FROM reconciliation_matches rm
    JOIN normalized_transactions st ON st.id = rm.source_transaction_id
    LEFT JOIN normalized_transactions tt ON tt.id = rm.target_transaction_id
    WHERE rm.run_id = $1 AND rm.tenant_id = $2`;

    const params: unknown[] = [runId, tenantId];

    if (matchType) {
      queryStr += ` AND rm.match_type = $${params.length + 1}`;
      params.push(matchType);
    }

    if (reviewed !== undefined) {
      queryStr += ` AND rm.reviewed = $${params.length + 1}`;
      params.push(reviewed === "true");
    }

    queryStr += ` ORDER BY rm.confidence DESC, st.date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit.toString(), offset.toString());

    const matches = await query(queryStr, params as (string | number | boolean | Date | null)[]);

    const totalResults = await query(
      `SELECT COUNT(*) as count
      FROM reconciliation_matches
      WHERE run_id = $1 AND tenant_id = $2`,
      [runId || "", tenantId]
    );

    const total = (totalResults[0] as { count: string }).count;

    return res.json({
      matches: matches.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        matchType: m.match_type as string,
        confidence: m.confidence as number,
        matchReason: m.match_reason as string | null,
        amountDiff: m.amount_diff as number | null,
        dateDiff: m.date_diff as number | null,
        reviewed: m.reviewed as boolean,
        reviewedAt: m.reviewed_at as Date | null,
        source: {
          id: m.source_id as string,
          amount: m.source_amount as number,
          currency: m.source_currency as string,
          date: m.source_date as Date,
          description: m.source_description as string | null,
          externalId: m.source_external_id as string | null,
        },
        target: m.target_id
          ? {
              id: m.target_id as string,
              amount: m.target_amount as number,
              currency: m.target_currency as string,
              date: m.target_date as Date,
              description: m.target_description as string | null,
              externalId: m.target_external_id as string | null,
            }
          : null,
      })),
      pagination: {
        limit,
        offset,
        total: parseInt(total),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logError("Failed to get reconciliation matches", error, {
      traceId: req.traceId,
      runId,
      tenantId,
    });
    
    // Database connection errors
    if (errorMessage.includes("connection") || errorMessage.includes("timeout") || errorMessage.includes("ECONNREFUSED")) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: `Database connection failed while retrieving reconciliation matches. Please try again in a few moments.`,
        traceId: req.traceId,
      });
    }
    
    // SQL syntax errors (shouldn't happen but catch them)
    if (errorMessage.includes("syntax") || errorMessage.includes("SQL")) {
      return res.status(500).json({
        error: "Internal Server Error",
        message: `Database query error occurred. Please contact support with traceId.`,
        traceId: req.traceId,
      });
    }
    
    // Default to 500 only for truly unexpected errors
    return res.status(500).json({
      error: "Internal Server Error",
      message: `Failed to get reconciliation matches: ${errorMessage}. Please contact support with traceId if this persists.`,
      traceId: req.traceId,
    });
  }
});

/**
 * PATCH /api/v1/reconciliation/matches/:matchId
 * Update match (e.g., mark as reviewed)
 */
router.patch("/matches/:matchId", tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const { matchId } = req.params;
  const { reviewed } = req.body;
  const tenantId = req.tenantId!;
  const userId = req.userId!;
  
  try {

    await query(
      `UPDATE reconciliation_matches SET
        reviewed = $1,
        reviewed_by = $2,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $3 AND tenant_id = $4`,
      [reviewed === true, userId || "", matchId || "", tenantId]
    );

    return res.json({
      id: matchId,
      reviewed: reviewed === true,
      reviewedAt: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logError("Failed to update match", error, { 
      traceId: req.traceId,
      matchId,
      tenantId,
      userId,
    });
    
    // Check for specific error types
    if (errorMessage.includes("not found") || errorMessage.includes("does not exist")) {
      return res.status(404).json({
        error: "Not Found",
        message: `Match ${matchId} not found. Please verify the match ID and try again.`,
        traceId: req.traceId,
      });
    }
    
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      return res.status(403).json({
        error: "Forbidden",
        message: `You don't have permission to update this match. Please contact support if you believe this is an error.`,
        traceId: req.traceId,
      });
    }
    
    if (errorMessage.includes("connection") || errorMessage.includes("timeout") || errorMessage.includes("ECONNREFUSED")) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: `Database connection failed while updating match. Please try again in a few moments.`,
        traceId: req.traceId,
      });
    }
    
    // Default to 500 only for truly unexpected errors
    return res.status(500).json({
      error: "Internal Server Error",
      message: `Failed to update match: ${errorMessage}. Please contact support with traceId if this persists.`,
      traceId: req.traceId,
    });
  }
});

/**
 * PUT /api/v1/reconciliation/exceptions/:exceptionId
 * Resolve a reconciliation exception (unmatched transaction)
 */
router.put("/exceptions/:exceptionId", tenantMiddleware, async (req: TenantRequest, res: Response) => {
  const { exceptionId } = req.params;
  const { resolution, notes, targetTransactionId } = req.body;
  const tenantId = req.tenantId!;
  const userId = req.userId!;
  
  try {

    if (!exceptionId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "exceptionId is required",
        traceId: req.traceId,
      });
    }

    if (!resolution || !["matched", "manual", "ignored"].includes(resolution)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "resolution is required and must be one of: matched, manual, ignored",
        traceId: req.traceId,
      });
    }

    // Verify exception exists and belongs to tenant
    const exceptionCheck = await query(
      `SELECT rm.id, rm.run_id, rm.match_type, rm.source_transaction_id, rm.target_transaction_id
       FROM reconciliation_matches rm
       JOIN reconciliation_runs rr ON rr.id = rm.run_id
       WHERE rm.id = $1 AND rm.tenant_id = $2 AND rm.match_type = 'unmatched'`,
      [exceptionId, tenantId]
    );

    if (exceptionCheck.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: `Exception ${exceptionId} not found or already resolved. Please verify the exception ID and try again.`,
        traceId: req.traceId,
      });
    }

    const exception = exceptionCheck[0] as {
      id: string;
      run_id: string;
      match_type: string;
      source_transaction_id: string;
      target_transaction_id: string | null;
    };

    // Update exception based on resolution
    if (resolution === "matched" && targetTransactionId) {
      // Link to target transaction
      await query(
        `UPDATE reconciliation_matches SET
          target_transaction_id = $1,
          match_type = 'manual',
          reviewed = true,
          reviewed_by = $2,
          reviewed_at = NOW(),
          match_reason = $3,
          updated_at = NOW()
        WHERE id = $4 AND tenant_id = $5`,
        [
          targetTransactionId,
          userId,
          notes || "Manually matched via exception resolution",
          exceptionId,
          tenantId,
        ]
      );
    } else if (resolution === "manual") {
      // Mark as manually resolved
      await query(
        `UPDATE reconciliation_matches SET
          reviewed = true,
          reviewed_by = $1,
          reviewed_at = NOW(),
          match_reason = $2,
          updated_at = NOW()
        WHERE id = $3 AND tenant_id = $4`,
        [
          userId,
          notes || "Manually resolved",
          exceptionId,
          tenantId,
        ]
      );
    } else if (resolution === "ignored") {
      // Mark as ignored/dismissed
      await query(
        `UPDATE reconciliation_matches SET
          reviewed = true,
          reviewed_by = $1,
          reviewed_at = NOW(),
          match_reason = $2,
          updated_at = NOW()
        WHERE id = $3 AND tenant_id = $4`,
        [
          userId,
          notes || "Ignored",
          exceptionId,
          tenantId,
        ]
      );
    }

    // Create audit trail entry
    await query(
      `INSERT INTO audit_logs (
        event, user_id, tenant_id, metadata, created_at
      ) VALUES ($1, $2, $3, $4, NOW())`,
      [
        "exception_resolved",
        userId,
        tenantId,
        JSON.stringify({
          exceptionId,
          runId: exception.run_id,
          resolution,
          notes,
          targetTransactionId: resolution === "matched" ? targetTransactionId : null,
        }),
      ]
    );

    logInfo("Exception resolved", {
      exceptionId,
      resolution,
      tenantId,
      userId,
      traceId: req.traceId,
    });

    return res.json({
      id: exceptionId,
      resolution,
      resolvedAt: new Date().toISOString(),
      resolvedBy: userId,
      traceId: req.traceId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logError("Failed to resolve exception", error, {
      traceId: req.traceId,
      exceptionId: req.params.exceptionId,
      tenantId: req.tenantId,
      userId: req.userId,
    });

    // Check for specific error types
    if (errorMessage.includes("not found") || errorMessage.includes("does not exist")) {
      return res.status(404).json({
        error: "Not Found",
        message: `Exception not found. Please verify the exception ID and try again.`,
        traceId: req.traceId,
      });
    }

    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      return res.status(403).json({
        error: "Forbidden",
        message: `You don't have permission to resolve this exception. Please contact support if you believe this is an error.`,
        traceId: req.traceId,
      });
    }

    if (errorMessage.includes("connection") || errorMessage.includes("timeout") || errorMessage.includes("ECONNREFUSED")) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: `Database connection failed while resolving exception. Please try again in a few moments.`,
        traceId: req.traceId,
      });
    }

    // Default to 500 only for truly unexpected errors
    return res.status(500).json({
      error: "Internal Server Error",
      message: `Failed to resolve exception: ${errorMessage}. Please contact support with traceId if this persists.`,
      traceId: req.traceId,
    });
  }
});

export default router;
