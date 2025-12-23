/**
 * Lossy Export Service
 * 
 * Makes exports explicitly lossy by excluding derived artifacts, confidence scores,
 * and longitudinal insights. This creates switching friction by making exports incomplete.
 * 
 * PHASE: Data Moat Reinforcement
 * 
 * Based on narrative compression requirements:
 * - Exports should exclude derived artifacts
 * - Exports should exclude longitudinal insights
 * - Exports should exclude confidence scores
 * - This creates switching friction (customers lose value when exporting)
 */

import { logError, logInfo } from '../../utils/logger';
import { query } from '../../db';

export interface ExportOptions {
  includeDerivedArtifacts?: boolean; // Default: false (lossy)
  includeConfidenceScores?: boolean; // Default: false (lossy)
  includeLongitudinalInsights?: boolean; // Default: false (lossy)
  includeHistoricalMatches?: boolean; // Default: true (basic data)
  includeAuditTrail?: boolean; // Default: true (compliance requirement)
}

export interface LossyExportResult {
  exportId: string;
  rowCount: number;
  excludedFields: string[];
  warning: string;
}

/**
 * Lossy Export Service
 * 
 * Creates exports that exclude proprietary data to create switching friction
 */
export class LossyExportService {
  /**
   * Create a lossy export of reconciliation data
   * 
   * Excludes:
   * - Derived artifacts (pattern insights, rule optimizations)
   * - Confidence scores (proprietary matching intelligence)
   * - Longitudinal insights (historical patterns, trends)
   * - Cross-customer intelligence (aggregated patterns)
   */
  async createLossyExport(
    tenantId: string,
    reconciliationRunId: string,
    options: ExportOptions = {}
  ): Promise<LossyExportResult> {
    try {
      const {
        includeDerivedArtifacts = false,
        includeConfidenceScores = false,
        includeLongitudinalInsights = false,
        includeHistoricalMatches = true,
        includeAuditTrail = true,
      } = options;

      // Get reconciliation run
      const runResult = await query(
        `SELECT 
          id, tenant_id, source_adapter, target_adapter, 
          matched_count, unmatched_source_count, unmatched_target_count,
          created_at, status
        FROM reconciliation_runs
        WHERE id = $1 AND tenant_id = $2`,
        [reconciliationRunId, tenantId]
      );

      if (runResult.length === 0) {
        throw new Error('Reconciliation run not found');
      }

      const run = runResult[0] as {
        id: string;
        tenant_id: string;
        source_adapter: string;
        target_adapter: string;
        matched_count: number;
        unmatched_source_count: number;
        unmatched_target_count: number;
        created_at: Date;
        status: string;
      };

      // Get matches (with or without confidence scores)
      const matchesQuery = includeConfidenceScores
        ? `SELECT 
            id, source_transaction_id, target_transaction_id,
            match_type, confidence, match_reason,
            amount_diff, date_diff, created_at
          FROM reconciliation_matches
          WHERE reconciliation_run_id = $1`
        : `SELECT 
            id, source_transaction_id, target_transaction_id,
            match_type, match_reason,
            amount_diff, date_diff, created_at
          FROM reconciliation_matches
          WHERE reconciliation_run_id = $1`;

      const matches = await query(matchesQuery, [reconciliationRunId]);

      // Get unmatched transactions (basic data only)
      const unmatchedQuery = `SELECT 
        id, transaction_id, adapter_type, amount, currency, date, description, external_id
      FROM normalized_transactions
      WHERE id IN (
        SELECT source_transaction_id FROM reconciliation_matches 
        WHERE reconciliation_run_id = $1 AND match_type = 'unmatched'
        UNION
        SELECT target_transaction_id FROM reconciliation_matches 
        WHERE reconciliation_run_id = $1 AND match_type = 'unmatched'
      )`;

      const unmatched = await query(unmatchedQuery, [reconciliationRunId]);

      // Exclude derived artifacts
      const excludedFields: string[] = [];
      if (!includeDerivedArtifacts) {
        excludedFields.push('pattern_insights', 'rule_optimizations', 'matching_suggestions');
      }
      if (!includeConfidenceScores) {
        excludedFields.push('confidence', 'confidence_history', 'confidence_trend');
      }
      if (!includeLongitudinalInsights) {
        excludedFields.push('historical_patterns', 'trend_analysis', 'anomaly_detection');
      }

      // Create export record
      const exportResult = await query(
        `INSERT INTO exports (
          id, tenant_id, export_type, format, status,
          row_count, excluded_fields, metadata, created_at
        ) VALUES (
          gen_random_uuid(), $1, 'reconciliation_lossy', 'csv', 'completed',
          $2, $3, $4, NOW()
        ) RETURNING id`,
        [
          tenantId,
          matches.length + unmatched.length,
          JSON.stringify(excludedFields),
          JSON.stringify({
            reconciliation_run_id: reconciliationRunId,
            source_adapter: run.source_adapter,
            target_adapter: run.target_adapter,
            lossy: true,
            excluded_fields: excludedFields,
            warning: this.generateWarning(excludedFields),
          }),
        ]
      );

      const exportId = (exportResult[0] as { id: string }).id;

      logInfo('Created lossy export', {
        exportId,
        tenantId,
        reconciliationRunId,
        rowCount: matches.length + unmatched.length,
        excludedFields,
      });

      return {
        exportId,
        rowCount: matches.length + unmatched.length,
        excludedFields,
        warning: this.generateWarning(excludedFields),
      };
    } catch (error) {
      logError('Failed to create lossy export', error, {
        tenantId,
        reconciliationRunId,
      });
      throw error;
    }
  }

  /**
   * Generate warning message about lossy export
   */
  private generateWarning(excludedFields: string[]): string {
    if (excludedFields.length === 0) {
      return 'Full export includes all data.';
    }

    const warnings: string[] = [];

    if (excludedFields.includes('confidence')) {
      warnings.push('Confidence scores excluded');
    }
    if (excludedFields.includes('pattern_insights')) {
      warnings.push('Pattern insights excluded');
    }
    if (excludedFields.includes('historical_patterns')) {
      warnings.push('Historical patterns excluded');
    }

    return `This export excludes proprietary data: ${warnings.join(', ')}. ` +
      'To access full data including confidence scores and insights, continue using Settler.';
  }

  /**
   * Check if export is lossy
   */
  async isLossyExport(exportId: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT metadata->>'lossy' as lossy
        FROM exports
        WHERE id = $1`,
        [exportId]
      );

      if (result.length === 0) {
        return false;
      }

      return (result[0] as { lossy: string }).lossy === 'true';
    } catch (error) {
      logError('Failed to check if export is lossy', error, { exportId });
      return false;
    }
  }

  /**
   * Get excluded fields for export
   */
  async getExcludedFields(exportId: string): Promise<string[]> {
    try {
      const result = await query(
        `SELECT excluded_fields
        FROM exports
        WHERE id = $1`,
        [exportId]
      );

      if (result.length === 0) {
        return [];
      }

      const excludedFields = (result[0] as { excluded_fields: string }).excluded_fields;
      return excludedFields ? JSON.parse(excludedFields) : [];
    } catch (error) {
      logError('Failed to get excluded fields', error, { exportId });
      return [];
    }
  }
}

export const lossyExportService = new LossyExportService();
