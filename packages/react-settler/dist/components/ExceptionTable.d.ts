/**
 * ExceptionTable
 * Displays reconciliation exceptions requiring manual review
 */
import React from "react";
import { ReconciliationException } from "@settler/protocol";
export interface ExceptionTableProps {
    exceptions: ReconciliationException[];
    onResolve?: (exception: ReconciliationException) => void;
    className?: string;
    showSeverity?: boolean;
    showCategory?: boolean;
}
export declare const ExceptionTable: React.NamedExoticComponent<ExceptionTableProps>;
//# sourceMappingURL=ExceptionTable.d.ts.map