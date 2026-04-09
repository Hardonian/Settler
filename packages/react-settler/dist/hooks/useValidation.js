"use strict";
/**
 * useValidation Hook
 * Validates reconciliation data with enterprise-grade validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useValidation = useValidation;
const react_1 = require("react");
const protocol_1 = require("@settler/protocol");
function useValidation(rules) {
    const validateTransaction = (0, react_1.useMemo)(() => {
        return (tx) => {
            const errors = [];
            const warnings = [];
            // Validate ID
            if (!(0, protocol_1.validateTransactionId)(tx.id)) {
                errors.push({
                    field: "id",
                    code: "INVALID_ID",
                    message: "Transaction ID is invalid",
                });
            }
            // Validate provider
            if (!tx.provider || typeof tx.provider !== "string") {
                errors.push({
                    field: "provider",
                    code: "REQUIRED_FIELD",
                    message: "Provider is required",
                });
            }
            else if (rules?.transaction?.allowedProviders) {
                if (!rules.transaction.allowedProviders.includes(tx.provider)) {
                    errors.push({
                        field: "provider",
                        code: "INVALID_PROVIDER",
                        message: `Provider must be one of: ${rules.transaction.allowedProviders.join(", ")}`,
                    });
                }
            }
            // Validate amount
            if (!(0, protocol_1.isValidMoney)(tx.amount)) {
                errors.push({
                    field: "amount",
                    code: "INVALID_AMOUNT",
                    message: "Amount is invalid",
                });
            }
            else {
                if (rules?.transaction?.maxAmount && tx.amount.value > rules.transaction.maxAmount) {
                    errors.push({
                        field: "amount",
                        code: "AMOUNT_TOO_LARGE",
                        message: `Amount exceeds maximum of ${rules.transaction.maxAmount}`,
                    });
                }
                if (rules?.transaction?.minAmount && tx.amount.value < rules.transaction.minAmount) {
                    errors.push({
                        field: "amount",
                        code: "AMOUNT_TOO_SMALL",
                        message: `Amount is below minimum of ${rules.transaction.minAmount}`,
                    });
                }
            }
            // Validate currency
            if (!(0, protocol_1.isValidCurrency)(tx.currency)) {
                errors.push({
                    field: "currency",
                    code: "INVALID_CURRENCY",
                    message: "Currency must be a valid ISO 4217 code",
                });
            }
            else if (rules?.transaction?.allowedCurrencies) {
                if (!rules.transaction.allowedCurrencies.includes(tx.currency)) {
                    errors.push({
                        field: "currency",
                        code: "INVALID_CURRENCY",
                        message: `Currency must be one of: ${rules.transaction.allowedCurrencies.join(", ")}`,
                    });
                }
            }
            // Validate date
            if (!(0, protocol_1.isValidISODate)(tx.date)) {
                errors.push({
                    field: "date",
                    code: "INVALID_DATE",
                    message: "Date must be a valid ISO 8601 date string",
                });
            }
            else if (rules?.transaction?.dateRange) {
                const date = new Date(tx.date);
                if (rules.transaction.dateRange.min && date < new Date(rules.transaction.dateRange.min)) {
                    errors.push({
                        field: "date",
                        code: "DATE_TOO_EARLY",
                        message: `Date is before minimum allowed date`,
                    });
                }
                if (rules.transaction.dateRange.max && date > new Date(rules.transaction.dateRange.max)) {
                    errors.push({
                        field: "date",
                        code: "DATE_TOO_LATE",
                        message: `Date is after maximum allowed date`,
                    });
                }
            }
            // Validate status
            const validStatuses = ["pending", "succeeded", "failed", "refunded", "disputed"];
            if (!validStatuses.includes(tx.status)) {
                errors.push({
                    field: "status",
                    code: "INVALID_STATUS",
                    message: `Status must be one of: ${validStatuses.join(", ")}`,
                });
            }
            // Sanitize metadata if present
            if (tx.metadata && typeof tx.metadata === "object") {
                // Metadata validation would go here
            }
            return {
                valid: errors.length === 0,
                errors,
                warnings,
            };
        };
    }, [rules]);
    const validateSettlement = (0, react_1.useMemo)(() => {
        return (st) => {
            const errors = [];
            const warnings = [];
            // Similar validation logic for settlements
            if (!(0, protocol_1.validateTransactionId)(st.id)) {
                errors.push({
                    field: "id",
                    code: "INVALID_ID",
                    message: "Settlement ID is invalid",
                });
            }
            if (!(0, protocol_1.isValidMoney)(st.amount)) {
                errors.push({
                    field: "amount",
                    code: "INVALID_AMOUNT",
                    message: "Amount is invalid",
                });
            }
            if (!(0, protocol_1.isValidCurrency)(st.currency)) {
                errors.push({
                    field: "currency",
                    code: "INVALID_CURRENCY",
                    message: "Currency must be a valid ISO 4217 code",
                });
            }
            if (!(0, protocol_1.isValidISODate)(st.settlementDate)) {
                errors.push({
                    field: "settlementDate",
                    code: "INVALID_DATE",
                    message: "Settlement date must be a valid ISO 8601 date string",
                });
            }
            return {
                valid: errors.length === 0,
                errors,
                warnings,
            };
        };
    }, [rules]);
    const validateException = (0, react_1.useMemo)(() => {
        return (exc) => {
            const errors = [];
            const warnings = [];
            if (!exc.id || typeof exc.id !== "string") {
                errors.push({
                    field: "id",
                    code: "REQUIRED_FIELD",
                    message: "Exception ID is required",
                });
            }
            if (!exc.description || typeof exc.description !== "string") {
                errors.push({
                    field: "description",
                    code: "REQUIRED_FIELD",
                    message: "Description is required",
                });
            }
            else {
                const maxLength = rules?.exception?.descriptionMaxLength || 1000;
                if (exc.description.length > maxLength) {
                    errors.push({
                        field: "description",
                        code: "DESCRIPTION_TOO_LONG",
                        message: `Description exceeds maximum length of ${maxLength} characters`,
                    });
                }
            }
            return {
                valid: errors.length === 0,
                errors,
                warnings,
            };
        };
    }, [rules]);
    return {
        validateTransaction,
        validateSettlement,
        validateException,
    };
}
//# sourceMappingURL=useValidation.js.map