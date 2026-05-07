import { v4 as uuidv4 } from "uuid";
import { query } from "../../../db";
import { logInfo } from "../../../utils/logger";
import { ReconciliationMatch, SYSTEM_USER_ID } from "./types";

/**
 * Get match details
 */
export async function getMatch(
  matchId: string,
  tenantId: string
): Promise<ReconciliationMatch | null> {
  const results = await query<{
    id: string;
    run_id: string;
    source_transaction_id: string;
    target_transaction_id: string | null;
    tenant_id: string;
    match_type: string;
    confidence: number;
    match_reason: string | null;
    amount_diff: number | null;
    date_diff: number | null;
    reviewed: boolean;
    reviewed_by: string | null;
    reviewed_at: Date | null;
    metadata: string;
  }>(
    `SELECT
      id, run_id, source_transaction_id, target_transaction_id,
      tenant_id, match_type, confidence, match_reason,
      amount_diff, date_diff, reviewed, reviewed_by, reviewed_at, metadata
    FROM reconciliation_matches
    WHERE id = $1 AND tenant_id = $2`,
    [matchId, tenantId]
  );

  if (results.length === 0) {
    return null;
  }

  const row = results[0]!;
  return {
    id: row.id,
    runId: row.run_id,
    sourceTransactionId: row.source_transaction_id,
    targetTransactionId: row.target_transaction_id,
    tenantId: row.tenant_id,
    matchType: row.match_type as ReconciliationMatch["matchType"],
    confidence: Number(row.confidence),
    matchReason: row.match_reason,
    amountDiff: row.amount_diff ? Number(row.amount_diff) : null,
    dateDiff: row.date_diff,
    reviewed: row.reviewed,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata,
  };
}

/**
 * Mark match as reviewed
 */
export async function markMatchReviewed(
  matchId: string,
  tenantId: string,
  action: string,
  resolutionRule?: string
): Promise<void> {
  await query(
    `UPDATE reconciliation_matches
     SET reviewed = true,
         reviewed_by = $1,
         reviewed_at = NOW(),
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
           'auto_reviewed', true,
           'review_action', $2,
           'resolution_rule', $3,
           'reviewed_at', NOW()
         ),
         updated_at = NOW()
     WHERE id = $4 AND tenant_id = $5`,
    [SYSTEM_USER_ID, action, resolutionRule || null, matchId, tenantId]
  );
}

/**
 * Log audit trail entry
 */
export async function logAuditTrail(params: {
  auditType: "auto_resolution" | "exception_handling" | "quality_check";
  action: string;
  entityType: string;
  entityId: string;
  tenantId: string;
  beforeState: Record<string, unknown>;
  afterState: Record<string, unknown>;
  metadata: Record<string, unknown>;
}): Promise<string> {
  // Check if recon_audits table exists (it might be in Supabase schema)
  // For now, we'll use reconciliation_runs metadata or create audit entry
  const auditId = uuidv4();

  try {
    // Try to insert into recon_audits if it exists
    await query(
      `INSERT INTO recon_audits (
        id, tenant_id, audit_type, action, entity_type, entity_id,
        before_state, after_state, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        auditId,
        params.tenantId,
        params.auditType,
        params.action,
        params.entityType,
        params.entityId,
        JSON.stringify(params.beforeState),
        JSON.stringify(params.afterState),
        JSON.stringify(params.metadata),
      ]
    );
  } catch {
    // If table doesn't exist, log to reconciliation_runs metadata
    logInfo("Audit table not available, logging to metadata", {
      auditId,
      params,
    });
  }

  return auditId;
}

/**
 * Get review statistics for a reconciliation run
 */
export async function getReviewStatistics(
  runId: string,
  tenantId: string
): Promise<{
  total: number;
  reviewed: number;
  autoApproved: number;
  ruleResolved: number;
  exceptionHandled: number;
  systemFlagged: number;
  averageConfidence: number;
}> {
  const results = await query<{
    total: string;
    reviewed: string;
    auto_approved: string;
    rule_resolved: string;
    exception_handled: string;
    system_flagged: string;
    avg_confidence: number | null;
  }>(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE reviewed = true) as reviewed,
      COUNT(*) FILTER (WHERE metadata->>'review_action' = 'auto_approved') as auto_approved,
      COUNT(*) FILTER (WHERE metadata->>'review_action' = 'rule_resolved') as rule_resolved,
      COUNT(*) FILTER (WHERE metadata->>'review_action' = 'exception_handled') as exception_handled,
      COUNT(*) FILTER (WHERE metadata->>'review_action' = 'system_flagged') as system_flagged,
      AVG(confidence) as avg_confidence
    FROM reconciliation_matches
    WHERE run_id = $1 AND tenant_id = $2`,
    [runId, tenantId]
  );

  const row = results[0]!;
  return {
    total: parseInt(row.total),
    reviewed: parseInt(row.reviewed),
    autoApproved: parseInt(row.auto_approved),
    ruleResolved: parseInt(row.rule_resolved),
    exceptionHandled: parseInt(row.exception_handled),
    systemFlagged: parseInt(row.system_flagged),
    averageConfidence: row.avg_confidence ? Number(row.avg_confidence) : 0,
  };
}
