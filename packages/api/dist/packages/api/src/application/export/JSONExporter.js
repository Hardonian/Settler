"use strict";
/**
 * JSON Exporter
 *
 * Exports reconciled data to JSON format for programmatic access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONExporter = void 0;
const db_1 = require("../../db");
class JSONExporter {
    /**
     * Export to JSON format
     */
    async exportToJSON(tenantId, jobId, options) {
        const { dateRange, includeFees, includeUnmatched, includeRawPayloads } = options;
        // Get matches
        const matches = await (0, db_1.query)(`SELECT 
        rm.*,
        row_to_json(t.*) as transaction_data,
        row_to_json(s.*) as settlement_data
      FROM reconciliation_matches rm
      JOIN transactions t ON t.id = rm.transaction_id
      JOIN settlements s ON s.id = rm.settlement_id
      WHERE rm.tenant_id = $1 
        AND rm.job_id = $2
        AND t.created_at >= $3
        AND t.created_at <= $4
      ORDER BY t.created_at DESC`, [tenantId, jobId, dateRange.start, dateRange.end]);
        // Build result
        const result = {
            exportDate: new Date().toISOString(),
            dateRange: {
                start: dateRange.start.toISOString(),
                end: dateRange.end.toISOString(),
            },
            summary: {
                totalMatches: matches.length,
                totalUnmatched: 0,
                totalFees: 0,
            },
            matches: [],
        };
        // Process matches
        for (const match of matches) {
            const transaction = JSON.parse(match.transaction_data);
            const settlement = JSON.parse(match.settlement_data);
            // Remove raw payloads if not requested
            if (!includeRawPayloads) {
                delete transaction.raw_payload;
                delete settlement.raw_payload;
            }
            const matchObj = {
                id: match.id,
                tenantId: match.tenantId,
                matchType: match.matchType,
                confidenceScore: match.confidenceScore,
                matchingRules: match.matchingRules,
                matchedAt: match.matchedAt.toISOString(),
                createdAt: match.createdAt.toISOString(),
            };
            if (match.executionId) {
                matchObj.executionId = match.executionId;
            }
            if (match.jobId) {
                matchObj.jobId = match.jobId;
            }
            if (match.transactionId) {
                matchObj.transactionId = match.transactionId;
            }
            if (match.settlementId) {
                matchObj.settlementId = match.settlementId;
            }
            const matchEntry = {
                match: matchObj,
                transaction,
                settlement,
            };
            // Add fees if included
            if (includeFees && match.transactionId) {
                const fees = await (0, db_1.query)(`SELECT * FROM fees WHERE transaction_id = $1 AND tenant_id = $2`, [match.transactionId, tenantId]);
                matchEntry.fees = fees.map(fee => {
                    const feeObj = { ...fee };
                    if (!includeRawPayloads && 'rawPayload' in feeObj) {
                        delete feeObj.rawPayload;
                    }
                    return feeObj;
                });
                result.summary.totalFees += fees.length;
            }
            // Build ReconciliationMatch with proper types
            const reconciliationMatch = {
                id: matchObj.id,
                tenantId: matchObj.tenantId,
                matchType: matchObj.matchType,
                confidenceScore: matchObj.confidenceScore,
                matchingRules: matchObj.matchingRules,
                matchedAt: new Date(matchObj.matchedAt),
                createdAt: new Date(matchObj.createdAt),
            };
            if (matchObj.executionId) {
                reconciliationMatch.executionId = matchObj.executionId;
            }
            if (matchObj.jobId) {
                reconciliationMatch.jobId = matchObj.jobId;
            }
            if (matchObj.transactionId) {
                reconciliationMatch.transactionId = matchObj.transactionId;
            }
            if (matchObj.settlementId) {
                reconciliationMatch.settlementId = matchObj.settlementId;
            }
            const matchEntryResult = {
                match: reconciliationMatch,
                transaction,
                settlement,
            };
            if (matchEntry.fees) {
                matchEntryResult.fees = matchEntry.fees;
            }
            result.matches.push(matchEntryResult);
        }
        // Add unmatched if included
        if (includeUnmatched) {
            const unmatched = await (0, db_1.query)(`SELECT * FROM transactions t
         LEFT JOIN reconciliation_matches rm ON rm.transaction_id = t.id
         WHERE t.tenant_id = $1
           AND rm.id IS NULL
           AND t.created_at >= $2
           AND t.created_at <= $3
         ORDER BY t.created_at DESC`, [tenantId, dateRange.start, dateRange.end]);
            result.unmatched = unmatched.map(tx => {
                const txObj = { ...tx };
                if (!includeRawPayloads && 'rawPayload' in txObj) {
                    delete txObj.rawPayload;
                }
                return txObj;
            });
            result.summary.totalUnmatched = unmatched.length;
        }
        return result;
    }
}
exports.JSONExporter = JSONExporter;
//# sourceMappingURL=JSONExporter.js.map