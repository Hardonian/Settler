/**
 * Enhanced Data Validation
 *
 * Validates normalized data before storage
 */
import { NormalizedTransaction, NormalizedAccount, NormalizedBalance, NormalizedPayout, NormalizedInvoice, NormalizedSubscription, NormalizedTaxEstimate } from "../connector-driver";
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export declare class DataValidator {
    /**
     * Validate transaction
     */
    validateTransaction(tx: NormalizedTransaction): ValidationResult;
    /**
     * Validate account
     */
    validateAccount(account: NormalizedAccount): ValidationResult;
    /**
     * Validate balance
     */
    validateBalance(balance: NormalizedBalance): ValidationResult;
    /**
     * Validate payout
     */
    validatePayout(payout: NormalizedPayout): ValidationResult;
    /**
     * Validate invoice
     */
    validateInvoice(invoice: NormalizedInvoice): ValidationResult;
    /**
     * Validate subscription
     */
    validateSubscription(subscription: NormalizedSubscription): ValidationResult;
    /**
     * Validate tax estimate
     */
    validateTaxEstimate(tax: NormalizedTaxEstimate): ValidationResult;
    /**
     * Validate all data types
     */
    validateAll(data: {
        transactions?: NormalizedTransaction[] | undefined;
        accounts?: NormalizedAccount[] | undefined;
        balances?: NormalizedBalance[] | undefined;
        payouts?: NormalizedPayout[] | undefined;
        invoices?: NormalizedInvoice[] | undefined;
        subscriptions?: NormalizedSubscription[] | undefined;
        taxEstimates?: NormalizedTaxEstimate[] | undefined;
    }): {
        valid: boolean;
        errors: string[];
        warnings: string[];
        counts: {
            transactions: {
                valid: number;
                invalid: number;
            };
            accounts: {
                valid: number;
                invalid: number;
            };
            balances: {
                valid: number;
                invalid: number;
            };
            payouts: {
                valid: number;
                invalid: number;
            };
            invoices: {
                valid: number;
                invalid: number;
            };
            subscriptions: {
                valid: number;
                invalid: number;
            };
            taxEstimates: {
                valid: number;
                invalid: number;
            };
        };
    };
}
export declare const validator: DataValidator;
//# sourceMappingURL=data-validator.d.ts.map