/**
 * Reconciliation API Routes
 * Handles reconciliation runs and matches
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { enforceFreezeState } from "../../middleware/governance";
import { logError, logInfo } from "../../utils/logger";
import { isApiError, ValidationError } from "../../utils/typed-errors";
import { sendProblemJson } from "../../utils/problem-json";
import { runReconciliation } from "../../services/ingestion/reconciliation-matcher";
import { query } from "../../db";
import { ReconciliationConfig } from "../../services/ingestion/types";
import {
  buildWorkbenchItem,
  compareWorkbenchRuns,
  ReviewState,
} from "./reconciliation-trust-contract";

const router: Router = Router();

/**
 * POST /api/v1/reconciliation/run
 * Run reconciliation for an ingestion
 */
router.post("/run", enforceFreezeState(), async (req: AuthRequest, res: Response) => {
  try {
    const { ingestionId, config } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.userId!;

    if (!ingestionId) {
      sendProblemJson(req, res, {
        status: 400,
        title: "Validation Error",
        detail: "ingestionId is required",
        code: "VALIDATION_ERROR",
        extra: { field: "ingestionId" },
      });
      return;
    }

    const rawConfig = (config ?? {}) as Record<string, unknown>;
    const reconciliationConfig: ReconciliationConfig = {};
    const invalidConfigFields: string[] = [];

    const dateWindowDays = rawConfig.dateWindowDays;
    if (dateWindowDays !== undefined) {
      if (
        typeof dateWindowDays === "number" &&
        Number.isFinite(dateWindowDays) &&
        dateWindowDays >= 0
      ) {
        reconciliationConfig.dateWindowDays = dateWindowDays;
      } else {
        invalidConfigFields.push("config.dateWindowDays");
      }
    }

    const amountTolerance = rawConfig.amountTolerance;
    if (amountTolerance !== undefined) {
      if (
        typeof amountTolerance === "number" &&
        Number.isFinite(amountTolerance) &&
        amountTolerance >= 0
      ) {
        reconciliationConfig.amountTolerance = amountTolerance;
      } else {
        invalidConfigFields.push("config.amountTolerance");
      }
    }

    const fuzzyDescriptionThreshold = rawConfig.fuzzyDescriptionThreshold;
    if (fuzzyDescriptionThreshold !== undefined) {
      if (
        typeof fuzzyDescriptionThreshold === "number" &&
        Number.isFinite(fuzzyDescriptionThreshold) &&
        fuzzyDescriptionThreshold >= 0 &&
        fuzzyDescriptionThreshold <= 1
      ) {
        reconciliationConfig.fuzzyDescriptionThreshold = fuzzyDescriptionThreshold;
      } else {
        invalidConfigFields.push("config.fuzzyDescriptionThreshold");
      }
    }

    const requireExactAmount = rawConfig.requireExactAmount;
    if (requireExactAmount !== undefined) {
      if (typeof requireExactAmount === "boolean") {
        reconciliationConfig.requireExactAmount = requireExactAmount;
      } else {
        invalidConfigFields.push("config.requireExactAmount");
      }
    }

    if (invalidConfigFields.length > 0) {
      sendProblemJson(req, res, {
        status: 400,
        title: "Validation Error",
        detail: `Invalid config fields: ${invalidConfigFields.join(", ")}`,
        code: "VALIDATION_ERROR",
        extra: { fields: invalidConfigFields },
      });
      return;
    }

    // Extract jobId and templateId from request if available
    const jobId = (req.body as any)?.jobId;
    const templateId = (req.body as any)?.templateId;

    const runId = await runReconciliation(
      ingestionId,
      tenantId,
      userId,
      jobId,
      templateId,
      reconciliationConfig
    );

    logInfo("Reconciliation run started", { runId, ingestionId, traceId: req.traceId });

    return res.status(201).json({
      runId,
      ingestionId,
      status: "running",
      config: Object.keys(reconciliationConfig).length > 0 ? reconciliationConfig : null,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to run reconciliation", error, { traceId: req.traceId });
    if (isApiError(error)) {
      const extra: Record<string, unknown> = {};
      if (error instanceof ValidationError && error.field) {
        extra.field = error.field;
      }
      if (error.details !== undefined) {
        extra.details = error.details;
      }
      sendProblemJson(req, res, {
        status: error.statusCode,
        title: error.errorCode.replace(/_/g, " "),
        detail: error.message,
        code: error.errorCode,
        ...(Object.keys(extra).length > 0 ? { extra } : {}),
      });
      return;
    }
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to run reconciliation",
      traceId: req.traceId,
    });
  }
});

/**
 * GET /api/v1/reconciliation/runs/:runId
 * Get reconciliation run details
 */
router.get("/runs/:runId", async (req: AuthRequest, res: Response) => {
  try {
    const { runId } = req.params;
    const tenantId = req.tenantId!;

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
      metadata: typeof run.metadata === "string" ? JSON.parse(run.metadata) : run.metadata,
    });
  } catch (error) {
    logError("Failed to get reconciliation run", error, {
      traceId: req.traceId,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get reconciliation run",
      traceId: req.traceId,
    });
  }
});

/**
 * GET /api/v1/reconciliation/runs/:runId/matches
 * Get reconciliation matches
 */
router.get("/runs/:runId/matches", async (req: AuthRequest, res: Response) => {
  try {
    const { runId } = req.params;
    const tenantId = req.tenantId!;
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
    logError("Failed to get reconciliation matches", error, {
      traceId: req.traceId,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get reconciliation matches",
      traceId: req.traceId,
    });
  }
});

router.get("/runs/:runId/workbench", async (req: AuthRequest, res: Response) => {
  try {
    const { runId } = req.params;
    const tenantId = req.tenantId!;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const queue = req.query.queue as string | undefined;

    const runs = await query(
      `SELECT metadata FROM reconciliation_runs WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
      [runId || "", tenantId]
    );

    if (runs.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Reconciliation run not found",
        traceId: req.traceId,
      });
    }

    const runMetadataRaw = (runs[0] as { metadata: unknown }).metadata;
    const runMetadata =
      typeof runMetadataRaw === "string"
        ? (JSON.parse(runMetadataRaw) as Record<string, unknown>)
        : ((runMetadataRaw as Record<string, unknown>) ?? {});

    const rows = await query(
      `SELECT
        rm.id, rm.run_id, rm.match_type, rm.confidence, rm.match_reason,
        rm.amount_diff, rm.date_diff, rm.reviewed, rm.reviewed_at, rm.reviewed_by, rm.metadata,
        st.id as source_id, st.amount as source_amount, st.currency as source_currency,
        st.date as source_date, st.description as source_description, st.external_id as source_external_id,
        tt.id as target_id, tt.amount as target_amount, tt.currency as target_currency,
        tt.date as target_date, tt.description as target_description, tt.external_id as target_external_id
      FROM reconciliation_matches rm
      JOIN normalized_transactions st ON st.id = rm.source_transaction_id
      LEFT JOIN normalized_transactions tt ON tt.id = rm.target_transaction_id
      WHERE rm.run_id = $1 AND rm.tenant_id = $2
      ORDER BY rm.confidence ASC, st.date DESC
      LIMIT $3 OFFSET $4`,
      [runId || "", tenantId, limit.toString(), offset.toString()]
    );

    const items = rows
      .map((row) => buildWorkbenchItem(row as never, runMetadata))
      .filter((item) => (queue ? item.queue === queue : true));

    const queueCounts = items.reduce<Record<string, number>>((acc, item) => {
      acc[item.queue] = (acc[item.queue] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      runId,
      queue: queue ?? null,
      summary: {
        totalItems: items.length,
        queueCounts,
      },
      items,
      pagination: { limit, offset, total: items.length },
    });
  } catch (error) {
    logError("Failed to load reconciliation workbench", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load reconciliation workbench",
      traceId: req.traceId,
    });
  }
});

router.get("/runs/:runId/compare/:otherRunId", async (req: AuthRequest, res: Response) => {
  try {
    const runIdParam = req.params["runId"];
    const runId = Array.isArray(runIdParam) ? (runIdParam[0] ?? "") : (runIdParam ?? "");
    const otherRunIdParam = req.params["otherRunId"];
    const otherRunId = Array.isArray(otherRunIdParam)
      ? (otherRunIdParam[0] ?? "")
      : (otherRunIdParam ?? "");
    const tenantId = req.tenantId!;

    const fetchRunItems = async (targetRunId: string) => {
      const runRows = await query(
        `SELECT metadata FROM reconciliation_runs WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
        [targetRunId, tenantId]
      );
      if (runRows.length === 0) {
        throw new Error(`Run not found: ${targetRunId}`);
      }

      const runMetadataRaw = (runRows[0] as { metadata: unknown }).metadata;
      const runMetadata =
        typeof runMetadataRaw === "string"
          ? (JSON.parse(runMetadataRaw) as Record<string, unknown>)
          : ((runMetadataRaw as Record<string, unknown>) ?? {});

      const rows = await query(
        `SELECT
          rm.id, rm.run_id, rm.match_type, rm.confidence, rm.match_reason,
          rm.amount_diff, rm.date_diff, rm.reviewed, rm.reviewed_at, rm.reviewed_by, rm.metadata,
          st.id as source_id, st.amount as source_amount, st.currency as source_currency,
          st.date as source_date, st.description as source_description, st.external_id as source_external_id,
          tt.id as target_id, tt.amount as target_amount, tt.currency as target_currency,
          tt.date as target_date, tt.description as target_description, tt.external_id as target_external_id
        FROM reconciliation_matches rm
        JOIN normalized_transactions st ON st.id = rm.source_transaction_id
        LEFT JOIN normalized_transactions tt ON tt.id = rm.target_transaction_id
        WHERE rm.run_id = $1 AND rm.tenant_id = $2`,
        [targetRunId, tenantId]
      );

      return rows.map((row) => buildWorkbenchItem(row as never, runMetadata));
    };

    const fromItems = await fetchRunItems(runId || "");
    const toItems = await fetchRunItems(otherRunId || "");
    const comparison = compareWorkbenchRuns(fromItems, toItems, runId || "", otherRunId || "");

    return res.json(comparison);
  } catch (error) {
    logError("Failed to compare reconciliation runs", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to compare reconciliation runs",
      traceId: req.traceId,
    });
  }
});

router.get("/runs/:runId/workbench/export", async (req: AuthRequest, res: Response) => {
  try {
    const { runId } = req.params;
    const tenantId = req.tenantId!;

    const runRows = await query(
      `SELECT metadata FROM reconciliation_runs WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
      [runId || "", tenantId]
    );

    if (runRows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Reconciliation run not found",
        traceId: req.traceId,
      });
    }

    const runMetadataRaw = (runRows[0] as { metadata: unknown }).metadata;
    const runMetadata =
      typeof runMetadataRaw === "string"
        ? (JSON.parse(runMetadataRaw) as Record<string, unknown>)
        : ((runMetadataRaw as Record<string, unknown>) ?? {});
    const rows = await query(
      `SELECT
        rm.id, rm.run_id, rm.match_type, rm.confidence, rm.match_reason,
        rm.amount_diff, rm.date_diff, rm.reviewed, rm.reviewed_at, rm.reviewed_by, rm.metadata,
        st.id as source_id, st.amount as source_amount, st.currency as source_currency,
        st.date as source_date, st.description as source_description, st.external_id as source_external_id,
        tt.id as target_id, tt.amount as target_amount, tt.currency as target_currency,
        tt.date as target_date, tt.description as target_description, tt.external_id as target_external_id
      FROM reconciliation_matches rm
      JOIN normalized_transactions st ON st.id = rm.source_transaction_id
      LEFT JOIN normalized_transactions tt ON tt.id = rm.target_transaction_id
      WHERE rm.run_id = $1 AND rm.tenant_id = $2
      ORDER BY st.date DESC`,
      [runId || "", tenantId]
    );

    const items = rows.map((row) => buildWorkbenchItem(row as never, runMetadata));
    return res.json({
      runId,
      exportedAt: new Date().toISOString(),
      schemaVersion: "reconciliation-workbench.v1",
      items,
    });
  } catch (error) {
    logError("Failed to export reconciliation workbench", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to export reconciliation workbench",
      traceId: req.traceId,
    });
  }
});

/**
 * PATCH /api/v1/reconciliation/matches/:matchId
 * Update match (e.g., mark as reviewed)
 */
router.patch("/matches/:matchId", enforceFreezeState(), async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const { reviewed, reviewState } = req.body as { reviewed?: boolean; reviewState?: ReviewState };
    const tenantId = req.tenantId!;
    const userId = req.userId!;

    const normalizedReviewState: ReviewState =
      reviewState === "reviewed" ||
      reviewState === "approved" ||
      reviewState === "dismissed" ||
      reviewState === "escalated"
        ? reviewState
        : reviewed === true
          ? "reviewed"
          : "pending_review";

    await query(
      `UPDATE reconciliation_matches SET
        reviewed = $1,
        reviewed_by = $2,
        reviewed_at = NOW(),
        metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{review_state}', to_jsonb($3::text), true),
        updated_at = NOW()
      WHERE id = $4 AND tenant_id = $5`,
      [reviewed === true, userId || "", normalizedReviewState, matchId || "", tenantId]
    );

    return res.json({
      id: matchId,
      reviewed: reviewed === true,
      reviewState: normalizedReviewState,
      reviewedAt: new Date().toISOString(),
    });
  } catch (error) {
    logError("Failed to update match", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update match",
      traceId: req.traceId,
    });
  }
});

export default router;
