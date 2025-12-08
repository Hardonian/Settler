/**
 * JSON Exporter
 * 
 * Exports reconciled data to JSON format for programmatic access
 */

import { Transaction, Settlement, Fee, ReconciliationMatch, MatchType } from '@settler/types';
import { query } from '../../db';

export interface JSONExportOptions {
  dateRange: {
    start: Date;
    end: Date;
  };
  includeFees: boolean;
  includeUnmatched: boolean;
  includeRawPayloads: boolean;
}

export interface JSONExportResult {
  exportDate: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalMatches: number;
    totalUnmatched: number;
    totalFees: number;
  };
  matches: Array<{
    match: ReconciliationMatch;
    transaction: Transaction;
    settlement: Settlement;
    fees?: Fee[];
  }>;
  unmatched?: Transaction[];
}

export class JSONExporter {
  /**
   * Export to JSON format
   */
  async exportToJSON(
    tenantId: string,
    jobId: string,
    options: JSONExportOptions
  ): Promise<JSONExportResult> {
    const { dateRange, includeFees, includeUnmatched, includeRawPayloads } = options;

    // Get matches
    const matches = await query<ReconciliationMatch & {
      transaction_data: string;
      settlement_data: string;
    }>(
      `SELECT 
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
      ORDER BY t.created_at DESC`,
      [tenantId, jobId, dateRange.start, dateRange.end]
    );

    // Build result
    const result: JSONExportResult = {
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

      const matchObj: {
        id: string;
        tenantId: string;
        executionId?: string;
        jobId?: string;
        transactionId?: string;
        settlementId?: string;
        matchType: MatchType;
        confidenceScore: number;
        matchingRules: unknown;
        matchedAt: string;
        createdAt: string;
      } = {
        id: match.id,
        tenantId: match.tenantId,
        matchType: match.matchType as MatchType,
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
      const matchEntry: {
        match: typeof matchObj;
        transaction: Transaction;
        settlement: Settlement;
        fees?: Fee[];
      } = {
        match: matchObj,
        transaction,
        settlement,
      };

      // Add fees if included
      if (includeFees && match.transactionId) {
        const fees = await query<Fee>(
          `SELECT * FROM fees WHERE transaction_id = $1 AND tenant_id = $2`,
          [match.transactionId, tenantId]
        );

        matchEntry.fees = fees.map(fee => {
          const feeObj: Partial<Fee> = { ...fee };
          if (!includeRawPayloads && 'rawPayload' in feeObj) {
            delete feeObj.rawPayload;
          }
          return feeObj as Fee;
        });
        result.summary.totalFees += fees.length;
      }

      // Build ReconciliationMatch with proper types
      const reconciliationMatch: ReconciliationMatch = {
        id: matchObj.id,
        tenantId: matchObj.tenantId,
        matchType: matchObj.matchType,
        confidenceScore: matchObj.confidenceScore,
        matchingRules: matchObj.matchingRules as Record<string, unknown>,
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
      
      const matchEntryResult: {
        match: ReconciliationMatch;
        transaction: Transaction;
        settlement: Settlement;
        fees?: Fee[];
      } = {
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
      const unmatched = await query<Transaction>(
        `SELECT * FROM transactions t
         LEFT JOIN reconciliation_matches rm ON rm.transaction_id = t.id
         WHERE t.tenant_id = $1
           AND rm.id IS NULL
           AND t.created_at >= $2
           AND t.created_at <= $3
         ORDER BY t.created_at DESC`,
        [tenantId, dateRange.start, dateRange.end]
      );

      result.unmatched = unmatched.map(tx => {
        const txObj: Partial<Transaction> = { ...tx };
        if (!includeRawPayloads && 'rawPayload' in txObj) {
          delete txObj.rawPayload;
        }
        return txObj as Transaction;
      });

      result.summary.totalUnmatched = unmatched.length;
    }

    return result;
  }
}
