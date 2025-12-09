/**
 * TransactionTable
 * Displays reconciliation transactions in a table format
 */
import React from 'react';
import { ReconciliationTransaction } from '@settler/protocol';
export interface TransactionTableProps {
    transactions: ReconciliationTransaction[];
    onSelect?: (transaction: ReconciliationTransaction) => void;
    className?: string;
    showProvider?: boolean;
    showStatus?: boolean;
}
export declare const TransactionTable: React.NamedExoticComponent<TransactionTableProps>;
//# sourceMappingURL=TransactionTable.d.ts.map