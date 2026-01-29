"use strict";
/**
 * API Response Types for External Services
 *
 * Provides TypeScript interfaces for all external API responses to eliminate `any` types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAmazonTokenResponse = isAmazonTokenResponse;
exports.isChargebeeSubscriptionResponse = isChargebeeSubscriptionResponse;
exports.isChargebeeInvoiceResponse = isChargebeeInvoiceResponse;
exports.isEbayTokenResponse = isEbayTokenResponse;
exports.isEtsyTokenResponse = isEtsyTokenResponse;
exports.isEbayPayoutsResponse = isEbayPayoutsResponse;
exports.isEbayTransactionsResponse = isEbayTransactionsResponse;
exports.isEtsyShopsResponse = isEtsyShopsResponse;
exports.isEtsyReceiptsResponse = isEtsyReceiptsResponse;
exports.isEbayError = isEbayError;
exports.isEtsyError = isEtsyError;
exports.validateRequiredFields = validateRequiredFields;
exports.extractStringField = extractStringField;
exports.extractNumberField = extractNumberField;
// Type Guards for API Responses
function isAmazonTokenResponse(data) {
    return (typeof data === "object" &&
        data !== null &&
        typeof data.access_token === "string");
}
function isChargebeeSubscriptionResponse(data) {
    return (typeof data === "object" &&
        data !== null &&
        Array.isArray(data.list));
}
function isChargebeeInvoiceResponse(data) {
    return (typeof data === "object" &&
        data !== null &&
        Array.isArray(data.list));
}
function isEbayTokenResponse(data) {
    return (typeof data === "object" &&
        data !== null &&
        typeof data.access_token === "string");
}
function isEtsyTokenResponse(data) {
    return (typeof data === "object" &&
        data !== null &&
        typeof data.access_token === "string");
}
function isEbayPayoutsResponse(data) {
    return (typeof data === "object" &&
        data !== null &&
        Array.isArray(data.payouts));
}
function isEbayTransactionsResponse(data) {
    return (typeof data === "object" &&
        data !== null &&
        Array.isArray(data.transactions));
}
function isEtsyShopsResponse(data) {
    return (typeof data === "object" && data !== null && Array.isArray(data.results));
}
function isEtsyReceiptsResponse(data) {
    return (typeof data === "object" &&
        data !== null &&
        Array.isArray(data.results));
}
// Error Type Guards
function isEbayError(data) {
    return (typeof data === "object" &&
        data !== null &&
        (typeof data.error === "string" ||
            typeof data.error_description === "string"));
}
function isEtsyError(data) {
    return (typeof data === "object" &&
        data !== null &&
        (typeof data.error === "string" ||
            typeof data.error_description === "string"));
}
// Validation helpers
function validateRequiredFields(obj, fields) {
    if (typeof obj !== "object" || obj === null) {
        return false;
    }
    const record = obj;
    return fields.every((field) => field in record && record[field] !== undefined);
}
function extractStringField(obj, field) {
    if (typeof obj !== "object" || obj === null) {
        return null;
    }
    const value = obj[field];
    return typeof value === "string" ? value : null;
}
function extractNumberField(obj, field) {
    if (typeof obj !== "object" || obj === null) {
        return null;
    }
    const value = obj[field];
    return typeof value === "number" ? value : null;
}
//# sourceMappingURL=api-responses.js.map