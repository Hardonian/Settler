/**
 * useValidation Hook
 * Validates reconciliation data with enterprise-grade validation
 */
import { ReconciliationTransaction, ReconciliationSettlement, ReconciliationException, ValidationResult, ValidationRules } from '@settler/protocol';
export declare function useValidation(rules?: ValidationRules): {
    validateTransaction: (tx: ReconciliationTransaction) => ValidationResult;
    validateSettlement: (st: ReconciliationSettlement) => ValidationResult;
    validateException: (exc: ReconciliationException) => ValidationResult;
};
//# sourceMappingURL=useValidation.d.ts.map