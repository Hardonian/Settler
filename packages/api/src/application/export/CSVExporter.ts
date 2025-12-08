/**
 * Generic CSV Exporter
 * 
 * Exports reconciled data to generic CSV format with customizable columns
 */

import { query } from '../../db';

export interface CSVExportOptions {
  dateRange: {
    start: Date;
    end: Date;
  };
  columns: string[]; // Column names to include
  includeFees: boolean;
  includeUnmatched: boolean;
}

export class CSVExporter {
  /**
   * Export to generic CSV format
   */
  async exportToCSV(
    tenantId: string,
    jobId: string,
    options: CSVExportOptions
  ): Promise<string> {
    const { dateRange, columns, includeFees, includeUnmatched } = options;

    // Get matched transactions
    const matches = await query(
      `SELECT 
        rm.id as match_id,
        t.id as transaction_id,
        t.provider_transaction_id,
        t.type as transaction_type,
        t.amount_value as transaction_amount,
        t.amount_currency as transaction_currency,
        t.status as transaction_status,
        t.created_at as transaction_date,
        s.id as settlement_id,
        s.provider_settlement_id,
        s.amount_value as settlement_amount,
        s.amount_currency as settlement_currency,
        s.settlement_date,
        s.status as settlement_status,
        rm.confidence_score,
        rm.matched_at
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

    // Build CSV
    const csvRows: string[] = [];
    
    // Header
    csvRows.push(columns.join(','));

    // Data rows
    for (const match of matches) {
      const row: string[] = [];
      for (const col of columns) {
        const value = this.getColumnValue(match, col);
        row.push(this.escapeCSV(value));
      }
      csvRows.push(row.join(','));
    }

    // Add fees if included
    if (includeFees) {
      for (const match of matches) {
        const transactionId = (match as Record<string, unknown>).transaction_id;
        if (typeof transactionId === 'string') {
          const fees = await query(
            `SELECT type, amount_value, amount_currency, description 
             FROM fees WHERE transaction_id = $1 AND tenant_id = $2`,
            [transactionId, tenantId]
          );

          for (const fee of fees) {
            const row: string[] = [];
            for (const col of columns) {
              const value = this.getFeeColumnValue(fee, col, match);
              row.push(this.escapeCSV(value));
            }
            csvRows.push(row.join(','));
          }
        }
      }
    }

    // Add unmatched if included
    if (includeUnmatched) {
      const unmatched = await query(
        `SELECT 
          t.id as transaction_id,
          t.provider_transaction_id,
          t.type as transaction_type,
          t.amount_value as transaction_amount,
          t.amount_currency as transaction_currency,
          t.status as transaction_status,
          t.created_at as transaction_date
        FROM transactions t
        LEFT JOIN reconciliation_matches rm ON rm.transaction_id = t.id
        WHERE t.tenant_id = $1
          AND rm.id IS NULL
          AND t.created_at >= $2
          AND t.created_at <= $3
        ORDER BY t.created_at DESC`,
        [tenantId, dateRange.start, dateRange.end]
      );

      for (const item of unmatched) {
        const row: string[] = [];
        for (const col of columns) {
          const value = this.getColumnValue(item, col);
          row.push(this.escapeCSV(value));
        }
        csvRows.push(row.join(','));
      }
    }

    return csvRows.join('\n');
  }

  /**
   * Get column value from match object
   */
  private getColumnValue(match: Record<string, unknown>, column: string): string {
    const value = match[column];
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) {
      return String(value);
    }
    return '';
  }

  /**
   * Get fee column value
   */
  private getFeeColumnValue(fee: Record<string, unknown>, column: string, match: Record<string, unknown>): string {
    if (column.startsWith('fee_')) {
      const feeField = column.replace('fee_', '');
      const value = fee[feeField];
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) {
        return String(value);
      }
      return '';
    }
    const value = match[column];
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) {
      return String(value);
    }
    return '';
  }

  /**
   * Escape CSV value
   */
  private escapeCSV(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);
    
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Get default columns
   */
  getDefaultColumns(): string[] {
    return [
      'transaction_id',
      'provider_transaction_id',
      'transaction_type',
      'transaction_amount',
      'transaction_currency',
      'transaction_date',
      'settlement_id',
      'settlement_amount',
      'settlement_currency',
      'settlement_date',
      'confidence_score',
      'matched_at',
    ];
  }
}
