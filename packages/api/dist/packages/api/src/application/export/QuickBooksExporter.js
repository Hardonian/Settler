"use strict";
/**
 * QuickBooks Online Exporter
 *
 * Exports reconciled data to QuickBooks Online CSV format
 * as specified in the Product & Technical Specification.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickBooksExporter = void 0;
const db_1 = require("../../db");
class QuickBooksExporter {
    /**
     * Export to QuickBooks CSV format
     */
    async exportToCSV(tenantId, jobId, options) {
        const { dateRange, includeFees, includeUnmatched, glAccountMapping = {} } = options;
        // Get matched transactions
        const matches = await (0, db_1.query)(`SELECT 
        rm.transaction_id,
        rm.settlement_id,
        t.amount_value as transaction_amount,
        t.amount_currency as transaction_currency,
        s.amount_value as settlement_amount,
        s.amount_currency as settlement_currency,
        t.type as transaction_type,
        t.created_at as transaction_date,
        s.settlement_date
      FROM reconciliation_matches rm
      JOIN transactions t ON t.id = rm.transaction_id
      JOIN settlements s ON s.id = rm.settlement_id
      WHERE rm.tenant_id = $1 
        AND rm.job_id = $2
        AND t.created_at >= $3
        AND t.created_at <= $4
      ORDER BY t.created_at DESC`, [tenantId, jobId, dateRange.start, dateRange.end]);
        // Build CSV rows
        const csvRows = [];
        // QuickBooks CSV header
        csvRows.push('Date,Transaction Type,Num,Name,Memo,Account,Class,Amount');
        for (const match of matches) {
            const glAccount = glAccountMapping[match.transaction_type] || 'Accounts Receivable';
            const amount = match.settlement_amount;
            const date = match.settlement_date.toISOString().split('T')[0];
            const memo = `Reconciled: ${match.transaction_type} - ${match.transaction_id.substring(0, 8)}`;
            csvRows.push(`${date},${match.transaction_type},${match.transaction_id.substring(0, 8)},,${memo},${glAccount},,${amount}`);
            // Add fee line if included
            if (includeFees) {
                const fees = await (0, db_1.query)(`SELECT amount_value, type FROM fees 
           WHERE transaction_id = $1 AND tenant_id = $2`, [match.transaction_id, tenantId]);
                for (const fee of fees) {
                    const feeGLAccount = glAccountMapping[`fee_${fee.type}`] || 'Payment Processing Fees';
                    csvRows.push(`${date},Fee,${match.transaction_id.substring(0, 8)},,${fee.type} fee,${feeGLAccount},,${-fee.amount_value}`);
                }
            }
        }
        // Add unmatched transactions if included
        if (includeUnmatched) {
            const unmatched = await (0, db_1.query)(`SELECT 
          t.id as transaction_id,
          t.amount_value,
          t.type as transaction_type,
          t.created_at
        FROM transactions t
        LEFT JOIN reconciliation_matches rm ON rm.transaction_id = t.id
        WHERE t.tenant_id = $1
          AND rm.id IS NULL
          AND t.created_at >= $2
          AND t.created_at <= $3
        ORDER BY t.created_at DESC`, [tenantId, dateRange.start, dateRange.end]);
            for (const item of unmatched) {
                const glAccount = glAccountMapping[item.transaction_type] || 'Accounts Receivable';
                const date = item.created_at.toISOString().split('T')[0];
                const memo = `Unmatched: ${item.transaction_type} - ${item.transaction_id.substring(0, 8)}`;
                csvRows.push(`${date},${item.transaction_type},${item.transaction_id.substring(0, 8)},,${memo},${glAccount},,${item.amount_value}`);
            }
        }
        return csvRows.join('\n');
    }
    /**
     * Get GL account mapping template
     */
    getGLAccountMappingTemplate() {
        return {
            'capture': 'Accounts Receivable',
            'refund': 'Accounts Receivable',
            'chargeback': 'Chargebacks',
            'adjustment': 'Adjustments',
            'fee_processing': 'Payment Processing Fees',
            'fee_fx': 'FX Fees',
            'fee_chargeback': 'Chargeback Fees',
        };
    }
}
exports.QuickBooksExporter = QuickBooksExporter;
//# sourceMappingURL=QuickBooksExporter.js.map