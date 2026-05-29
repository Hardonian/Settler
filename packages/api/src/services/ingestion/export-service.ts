/**
 * Export Service
 * Handles CSV and JSON exports with signed URLs and metadata storage
 *
 * IMPORTANT: Exports are intentionally LOSSY to create switching friction.
 * Exports exclude:
 * - Derived artifacts (reconciliation patterns, matching rules)
 * - Longitudinal insights (trends, anomalies, baselines)
 * - Confidence scores from ML models
 * - Cross-customer intelligence patterns
 * - Historical match rates
 *
 * This creates a data moat: users can export raw data, but lose accumulated intelligence.
 */

import fs from "node:fs";
import { join } from "path";
import { tmpdir } from "os";
import { v4 as uuidv4 } from "uuid";
import { query } from "../../db";
import { logError, logInfo } from "../../utils/logger";

export type ExportType = "csv" | "json";
export type ExportFormat = "matched" | "unmatched" | "all" | "reconciliation_report";

export interface ExportOptions {
  type: ExportType;
  format: ExportFormat;
  reconciliationRunId?: string;
  ingestionId?: string;
  tenantId: string;
  userId: string;
  traceId?: string;
}

/**
 * Generate signed URL (mock implementation - should use S3 or similar in production)
 */
function generateSignedUrl(
  filePath: string,
  expiresInHours: number = 24
): { url: string; expiresAt: Date } {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  const url = `/api/v1/exports/download/${filePath.split("/").pop()}`;

  return { url, expiresAt };
}

/**
 * Create export record
 */
export async function createExport(options: ExportOptions): Promise<string> {
  const exportId = uuidv4();
  const traceId = options.traceId || uuidv4();

  try {
    await query(
      `INSERT INTO exports (
        id, tenant_id, user_id, type, format, reconciliation_run_id,
        ingestion_id, status, trace_id, metadata, created_at, updated_at,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), $11)
      RETURNING id`,
      [
        exportId,
        options.tenantId,
        options.userId,
        options.type,
        options.format,
        options.reconciliationRunId || null,
        options.ingestionId || null,
        "pending",
        traceId,
        JSON.stringify({}),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ]
    );

    logInfo("Created export", { exportId, type: options.type, format: options.format, traceId });
    return exportId;
  } catch (error) {
    logError("Failed to create export", error, { options });
    throw error;
  }
}

/**
 * Export matched transactions to CSV (LOSSY - excludes ML-derived fields)
 */
async function exportMatchedToCSV(reconciliationRunId: string, tenantId: string): Promise<string> {
  // LOSSY: Exclude confidence scores, match reasoning (ML-derived)
  const matches = await query(
    `SELECT 
      rm.id as match_id,
      rm.match_type,
      -- Excluded: rm.confidence (ML-derived, proprietary)
      -- Excluded: rm.match_reason (contains ML insights)
      rm.amount_diff,
      rm.date_diff,
      st.id as source_id,
      st.amount as source_amount,
      st.currency as source_currency,
      st.date as source_date,
      st.description as source_description,
      st.external_id as source_external_id,
      tt.id as target_id,
      tt.amount as target_amount,
      tt.currency as target_currency,
      tt.date as target_date,
      tt.description as target_description,
      tt.external_id as target_external_id
      -- Excluded: Derived artifacts, longitudinal insights, ML predictions
    FROM reconciliation_matches rm
    JOIN normalized_transactions st ON st.id = rm.source_transaction_id
    LEFT JOIN normalized_transactions tt ON tt.id = rm.target_transaction_id
    WHERE rm.run_id = $1 AND rm.tenant_id = $2 AND rm.target_transaction_id IS NOT NULL
    ORDER BY st.date DESC`,
    [reconciliationRunId, tenantId]
  );

  const csvRows: string[] = [];

  // Warning header
  csvRows.push(
    "# WARNING: This export is LOSSY. Confidence scores, match reasoning, and ML-derived insights are excluded."
  );
  csvRows.push("# These features are only available within Settler.");

  // Header (excludes confidence and match_reason)
  csvRows.push(
    "Match ID,Match Type,Source ID,Source Amount,Source Currency,Source Date,Source Description,Target ID,Target Amount,Target Currency,Target Date,Target Description,Amount Diff,Date Diff"
  );

  // Data rows
  for (const match of matches) {
    const row = match;
    const escapeCSV = (val: unknown): string => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    csvRows.push(
      [
        escapeCSV(row.match_id),
        escapeCSV(row.match_type),
        escapeCSV(row.confidence),
        escapeCSV(row.source_id),
        escapeCSV(row.source_amount),
        escapeCSV(row.source_currency),
        escapeCSV(row.source_date),
        escapeCSV(row.source_description),
        escapeCSV(row.target_id),
        escapeCSV(row.target_amount),
        escapeCSV(row.target_currency),
        escapeCSV(row.target_date),
        escapeCSV(row.target_description),
        escapeCSV(row.amount_diff),
        escapeCSV(row.date_diff),
      ].join(",")
    );
  }

  return csvRows.join("\n");
}

/**
 * Export unmatched transactions to CSV
 */
async function exportUnmatchedToCSV(
  reconciliationRunId: string,
  tenantId: string
): Promise<string> {
  const unmatched = await query(
    `SELECT 
      rm.id as match_id,
      st.id as transaction_id,
      st.amount,
      st.currency,
      st.date,
      st.description,
      st.external_id,
      st.category,
      st.payment_method
    FROM reconciliation_matches rm
    JOIN normalized_transactions st ON st.id = rm.source_transaction_id
    WHERE rm.run_id = $1 AND rm.tenant_id = $2 AND rm.target_transaction_id IS NULL
    ORDER BY st.date DESC`,
    [reconciliationRunId, tenantId]
  );

  const csvRows: string[] = [];

  // Header
  csvRows.push(
    "Transaction ID,Amount,Currency,Date,Description,External ID,Category,Payment Method"
  );

  // Data rows
  for (const transaction of unmatched) {
    const row = transaction;
    const escapeCSV = (val: unknown): string => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    csvRows.push(
      [
        escapeCSV(row.transaction_id),
        escapeCSV(row.amount),
        escapeCSV(row.currency),
        escapeCSV(row.date),
        escapeCSV(row.description),
        escapeCSV(row.external_id),
        escapeCSV(row.category),
        escapeCSV(row.payment_method),
      ].join(",")
    );
  }

  return csvRows.join("\n");
}

/**
 * Export all transactions to CSV
 */
async function exportAllToCSV(ingestionId: string, tenantId: string): Promise<string> {
  const transactions = await query(
    `SELECT 
      id, external_id, amount, currency, date, description,
      category, payment_method, reference
    FROM normalized_transactions
    WHERE ingestion_id = $1 AND tenant_id = $2
    ORDER BY date DESC`,
    [ingestionId, tenantId]
  );

  const csvRows: string[] = [];

  // Header
  csvRows.push("ID,External ID,Amount,Currency,Date,Description,Category,Payment Method,Reference");

  // Data rows
  for (const transaction of transactions) {
    const row = transaction;
    const escapeCSV = (val: unknown): string => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    csvRows.push(
      [
        escapeCSV(row.id),
        escapeCSV(row.external_id),
        escapeCSV(row.amount),
        escapeCSV(row.currency),
        escapeCSV(row.date),
        escapeCSV(row.description),
        escapeCSV(row.category),
        escapeCSV(row.payment_method),
        escapeCSV(row.reference),
      ].join(",")
    );
  }

  return csvRows.join("\n");
}

/**
 * Export reconciliation report to CSV
 */
async function exportReconciliationReportToCSV(
  reconciliationRunId: string,
  tenantId: string
): Promise<string> {
  // Get run summary
  const runResults = await query(
    `SELECT 
      id, source_count, target_count, matched_count,
      unmatched_source_count, unmatched_target_count, confidence_avg,
      started_at, completed_at
    FROM reconciliation_runs
    WHERE id = $1 AND tenant_id = $2`,
    [reconciliationRunId, tenantId]
  );

  if (runResults.length === 0) {
    throw new Error(`Reconciliation run ${reconciliationRunId} not found`);
  }

  const run = runResults[0] as Record<string, unknown>;

  // Get all matches
  const matches = await query(
    `SELECT 
      rm.match_type,
      rm.confidence,
      st.amount as source_amount,
      st.currency,
      st.date as source_date
    FROM reconciliation_matches rm
    JOIN normalized_transactions st ON st.id = rm.source_transaction_id
    WHERE rm.run_id = $1 AND rm.tenant_id = $2
    ORDER BY rm.confidence DESC`,
    [reconciliationRunId, tenantId]
  );

  const csvRows: string[] = [];

  // Summary section
  csvRows.push("Reconciliation Report");
  csvRows.push(`Run ID,${run.id}`);
  csvRows.push(`Started At,${run.started_at}`);
  csvRows.push(`Completed At,${run.completed_at}`);
  csvRows.push(`Source Count,${run.source_count}`);
  csvRows.push(`Target Count,${run.target_count}`);
  csvRows.push(`Matched Count,${run.matched_count}`);
  csvRows.push(`Unmatched Source,${run.unmatched_source_count}`);
  csvRows.push(`Unmatched Target,${run.unmatched_target_count}`);
  csvRows.push(`Average Confidence,${run.confidence_avg}`);
  csvRows.push("");
  csvRows.push("Matches");
  csvRows.push("Match Type,Confidence,Source Amount,Currency,Source Date");

  // Match rows
  for (const match of matches) {
    const row = match;
    csvRows.push(
      [
        String(row.match_type || ""),
        String(row.confidence || ""),
        String(row.source_amount || ""),
        String(row.currency || ""),
        String(row.source_date || ""),
      ].join(",")
    );
  }

  return csvRows.join("\n");
}

/**
 * Export to JSON (LOSSY - excludes derived intelligence)
 */
async function exportToJSON(options: ExportOptions): Promise<string> {
  let data: unknown;

  if (options.format === "matched" && options.reconciliationRunId) {
    // LOSSY: Exclude confidence scores, match reasoning, ML model predictions
    const matches = await query(
      `SELECT 
        rm.id as match_id,
        rm.match_type,
        -- Excluded: rm.confidence (ML-derived)
        -- Excluded: rm.match_reason (contains ML insights)
        st.id as source_id,
        st.amount as source_amount,
        st.currency as source_currency,
        st.date as source_date,
        st.description as source_description,
        st.external_id as source_external_id,
        tt.id as target_id,
        tt.amount as target_amount,
        tt.currency as target_currency,
        tt.date as target_date,
        tt.description as target_description,
        tt.external_id as target_external_id
        -- Excluded: Derived artifacts, longitudinal insights, ML confidence scores
      FROM reconciliation_matches rm
      JOIN normalized_transactions st ON st.id = rm.source_transaction_id
      LEFT JOIN normalized_transactions tt ON tt.id = rm.target_transaction_id
      WHERE rm.run_id = $1 AND rm.tenant_id = $2 AND rm.target_transaction_id IS NOT NULL`,
      [options.reconciliationRunId, options.tenantId]
    );
    data = matches;
  } else if (options.format === "unmatched" && options.reconciliationRunId) {
    // LOSSY: Exclude anomaly detection, pattern matching insights
    const unmatched = await query(
      `SELECT 
        st.id,
        st.amount,
        st.currency,
        st.date,
        st.description,
        st.external_id,
        st.category,
        st.payment_method
        -- Excluded: Anomaly scores, pattern matches, ML predictions
      FROM reconciliation_matches rm
      JOIN normalized_transactions st ON st.id = rm.source_transaction_id
      WHERE rm.run_id = $1 AND rm.tenant_id = $2 AND rm.target_transaction_id IS NULL`,
      [options.reconciliationRunId, options.tenantId]
    );
    data = unmatched;
  } else if (options.format === "all" && options.ingestionId) {
    // LOSSY: Exclude normalized metadata, derived fields
    const transactions = await query(
      `SELECT 
        id,
        external_id,
        amount,
        currency,
        date,
        description,
        category,
        payment_method,
        reference
        -- Excluded: metadata (contains derived artifacts), normalized fields
      FROM normalized_transactions
      WHERE ingestion_id = $1 AND tenant_id = $2`,
      [options.ingestionId, options.tenantId]
    );
    data = transactions;
  } else {
    throw new Error(`Invalid export format: ${options.format}`);
  }

  // Add lossy export warning
  const exportData = {
    warning:
      "This export is LOSSY. It excludes derived artifacts, longitudinal insights, confidence scores, and ML model predictions. These features are only available within Settler.",
    exportedAt: new Date().toISOString(),
    data,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate export file
 */
export async function generateExport(
  exportId: string
): Promise<{ filePath: string; fileSize: number; signedUrl: string; expiresAt: Date }> {
  // Get export record
  const exportResults = await query(
    `SELECT type, format, reconciliation_run_id, ingestion_id, tenant_id
    FROM exports WHERE id = $1`,
    [exportId]
  );

  if (exportResults.length === 0) {
    throw new Error(`Export ${exportId} not found`);
  }

  const exportRecord = exportResults[0] as {
    type: ExportType;
    format: ExportFormat;
    reconciliation_run_id: string | null;
    ingestion_id: string | null;
    tenant_id: string;
  };

  // Update status to processing
  await query(`UPDATE exports SET status = 'processing', updated_at = NOW() WHERE id = $1`, [
    exportId,
  ]);

  let content: string;
  let fileExtension: string;

  try {
    if (exportRecord.type === "csv") {
      fileExtension = "csv";
      if (exportRecord.format === "matched" && exportRecord.reconciliation_run_id) {
        content = await exportMatchedToCSV(
          exportRecord.reconciliation_run_id,
          exportRecord.tenant_id
        );
      } else if (exportRecord.format === "unmatched" && exportRecord.reconciliation_run_id) {
        content = await exportUnmatchedToCSV(
          exportRecord.reconciliation_run_id,
          exportRecord.tenant_id
        );
      } else if (exportRecord.format === "all" && exportRecord.ingestion_id) {
        content = await exportAllToCSV(exportRecord.ingestion_id, exportRecord.tenant_id);
      } else if (
        exportRecord.format === "reconciliation_report" &&
        exportRecord.reconciliation_run_id
      ) {
        content = await exportReconciliationReportToCSV(
          exportRecord.reconciliation_run_id,
          exportRecord.tenant_id
        );
      } else {
        throw new Error(`Invalid export format: ${exportRecord.format}`);
      }
    } else {
      fileExtension = "json";
      content = await exportToJSON({
        type: exportRecord.type,
        format: exportRecord.format,
        reconciliationRunId: exportRecord.reconciliation_run_id || undefined,
        ingestionId: exportRecord.ingestion_id || undefined,
        tenantId: exportRecord.tenant_id,
        userId: "", // Not needed for generation
      });
    }

    // Write to temporary file (in production, upload to S3)
    const fileName = `${exportId}.${fileExtension}`;
    const filePath = join(tmpdir(), fileName);
    fs.writeFileSync(filePath, content, "utf8");
    const fileSize = fs.statSync(filePath).size;

    // Generate signed URL
    const { url, expiresAt } = generateSignedUrl(filePath, 24);

    // Update export record
    await query(
      `UPDATE exports SET
        status = 'completed',
        storage_location = $1,
        signed_url = $2,
        signed_url_expires_at = $3,
        file_size_bytes = $4,
        row_count = $5,
        updated_at = NOW()
      WHERE id = $6`,
      [
        filePath,
        url,
        expiresAt,
        fileSize,
        content.split("\n").length - 1, // Approximate row count
        exportId,
      ]
    );

    logInfo("Export generated", { exportId, filePath, fileSize });

    return {
      filePath,
      fileSize,
      signedUrl: url,
      expiresAt,
    };
  } catch (error) {
    logError("Failed to generate export", error, { exportId });
    await query(
      `UPDATE exports SET
        status = 'failed',
        error_message = $1,
        updated_at = NOW()
      WHERE id = $2`,
      [error instanceof Error ? error.message : String(error), exportId]
    );
    throw error;
  }
}
