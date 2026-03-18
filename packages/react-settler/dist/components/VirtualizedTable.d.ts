import { ReconciliationTransaction } from '@settler/protocol';
export interface VirtualizedTableProps {
    transactions: ReconciliationTransaction[];
    height?: number;
    rowHeight?: number;
    onSelect?: (transaction: ReconciliationTransaction) => void;
    className?: string;
}
export declare function VirtualizedTable({ transactions, height, rowHeight, onSelect, className }: VirtualizedTableProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=VirtualizedTable.d.ts.map