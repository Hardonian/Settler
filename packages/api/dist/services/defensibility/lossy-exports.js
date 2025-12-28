"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.lossyExportService = exports.LossyExportService = void 0;
const logger_1 = require("../../utils/logger");
const db_1 = require("../../db");
/**
 * Lossy Export Service
 *
 * Creates exports that exclude proprietary data to create switching friction
 */
class LossyExportService {
    /**
     * Create a lossy export of reconciliation data
     *
     * Excludes:
     * - Derived artifacts (pattern insights, rule optimizations)
     * - Confidence scores (proprietary matching intelligence)
     * - Longitudinal insights (historical patterns, trends)
     * - Cross-customer intelligence (aggregated patterns)
     */
    async createLossyExport(tenantId, userId, reconciliationRunId, options = {}) {
        try {
            const { includeDerivedArtifacts = false, includeConfidenceScores = false, includeLongitudinalInsights = false, } = options;
            // Get reconciliation run
            const runResult = await (0, db_1.query)(`SELECT 
          id, tenant_id, matched_count, unmatched_source_count, unmatched_target_count,
          created_at, status, metadata
        FROM reconciliation_runs
        WHERE id = $1 AND tenant_id = $2`, [reconciliationRunId, tenantId]);
            if (runResult.length === 0) {
                throw new Error('Reconciliation run not found');
            }
            const run = runResult[0];
            // Extract adapter info from metadata if available
            const metadata = typeof run.metadata === 'string' ? JSON.parse(run.metadata) : run.metadata;
            const sourceAdapter = metadata?.source_adapter || 'unknown';
            const targetAdapter = metadata?.target_adapter || 'unknown';
            // Get matches (with or without confidence scores)
            const matchesQuery = includeConfidenceScores
                ? `SELECT 
            id, source_transaction_id, target_transaction_id,
            match_type, confidence, match_reason,
            amount_diff, date_diff, created_at
          FROM reconciliation_matches
          WHERE run_id = $1`
                : `SELECT 
            id, source_transaction_id, target_transaction_id,
            match_type, match_reason,
            amount_diff, date_diff, created_at
          FROM reconciliation_matches
          WHERE run_id = $1`;
            const matches = await (0, db_1.query)(matchesQuery, [reconciliationRunId]);
            // Get unmatched transactions (basic data only)
            const unmatchedQuery = `SELECT 
        id, external_id, amount, currency, date, description
      FROM normalized_transactions
      WHERE id IN (
        SELECT source_transaction_id FROM reconciliation_matches 
        WHERE run_id = $1 AND match_type = 'unmatched'
        UNION
        SELECT target_transaction_id FROM reconciliation_matches 
        WHERE run_id = $1 AND match_type = 'unmatched'
      )`;
            const unmatched = await (0, db_1.query)(unmatchedQuery, [reconciliationRunId]);
            // Exclude derived artifacts
            const excludedFields = [];
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
            const exportResult = await (0, db_1.query)(`INSERT INTO exports (
          id, tenant_id, user_id, type, format, status,
          reconciliation_run_id, row_count, metadata, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, 'csv', 'reconciliation_report', 'completed',
          $3, $4, $5, NOW()
        ) RETURNING id`, [
                tenantId,
                userId,
                reconciliationRunId,
                matches.length + unmatched.length,
                JSON.stringify({
                    source_adapter: sourceAdapter,
                    target_adapter: targetAdapter,
                    lossy: true,
                    excluded_fields: excludedFields,
                    warning: this.generateWarning(excludedFields),
                }),
            ]);
            const exportId = exportResult[0].id;
            (0, logger_1.logInfo)('Created lossy export', {
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
        }
        catch (error) {
            (0, logger_1.logError)('Failed to create lossy export', error, {
                tenantId,
                reconciliationRunId,
            });
            throw error;
        }
    }
    /**
     * Generate warning message about lossy export
     */
    generateWarning(excludedFields) {
        if (excludedFields.length === 0) {
            return 'Full export includes all data.';
        }
        const warnings = [];
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
    async isLossyExport(exportId) {
        try {
            const result = await (0, db_1.query)(`SELECT metadata->>'lossy' as lossy
        FROM exports
        WHERE id = $1`, [exportId]);
            if (result.length === 0) {
                return false;
            }
            return result[0].lossy === 'true';
        }
        catch (error) {
            (0, logger_1.logError)('Failed to check if export is lossy', error, { exportId });
            return false;
        }
    }
    /**
     * Get excluded fields for export
     */
    async getExcludedFields(exportId) {
        try {
            const result = await (0, db_1.query)(`SELECT metadata
        FROM exports
        WHERE id = $1`, [exportId]);
            if (result.length === 0) {
                return [];
            }
            const metadata = result[0].metadata;
            if (!metadata) {
                return [];
            }
            const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            return parsed.excluded_fields || [];
        }
        catch (error) {
            (0, logger_1.logError)('Failed to get excluded fields', error, { exportId });
            return [];
        }
    }
}
exports.LossyExportService = LossyExportService;
exports.lossyExportService = new LossyExportService();
//# sourceMappingURL=lossy-exports.js.map