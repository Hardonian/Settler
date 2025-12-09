"use strict";
/**
 * Validation Enhancements
 * Additional validations for common endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUUID = validateUUID;
exports.validateEmail = validateEmail;
exports.validateDateRange = validateDateRange;
exports.validatePagination = validatePagination;
exports.validateCurrencyCode = validateCurrencyCode;
exports.validateJobName = validateJobName;
exports.validateWebhookURL = validateWebhookURL;
exports.commonValidationsMiddleware = commonValidationsMiddleware;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
// AuthRequest import removed - not used
/**
 * Validate UUID format
 */
function validateUUID(req, res, next) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // Check params
    for (const [key, value] of Object.entries(req.params)) {
        if (key.includes("id") || key.includes("Id")) {
            if (typeof value === "string" && !uuidPattern.test(value)) {
                (0, logger_1.logWarn)("Invalid UUID format", {
                    param: key,
                    value,
                    path: req.path,
                });
                res.status(400).json({
                    error: "BAD_REQUEST",
                    message: `Invalid ${key} format. Expected UUID.`,
                });
                return;
            }
        }
    }
    next();
}
/**
 * Validate email format
 */
const emailSchema = zod_1.z.string().email();
function validateEmail(email) {
    try {
        emailSchema.parse(email);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Validate date range
 */
function validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
        return { valid: true }; // Optional
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime())) {
        return { valid: false, error: "Invalid start date format" };
    }
    if (isNaN(end.getTime())) {
        return { valid: false, error: "Invalid end date format" };
    }
    if (start > end) {
        return { valid: false, error: "Start date must be before end date" };
    }
    // Check range is not too large (e.g., max 1 year)
    const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in ms
    if (end.getTime() - start.getTime() > maxRange) {
        return { valid: false, error: "Date range cannot exceed 1 year" };
    }
    return { valid: true };
}
/**
 * Validate pagination parameters
 */
function validatePagination(page, limit) {
    const validPage = page || 1;
    const validLimit = limit || 20;
    if (validPage < 1) {
        return { valid: false, error: "Page must be >= 1" };
    }
    if (validLimit < 1 || validLimit > 1000) {
        return { valid: false, error: "Limit must be between 1 and 1000" };
    }
    return { valid: true, page: validPage, limit: validLimit };
}
/**
 * Validate currency code (ISO 4217)
 */
const currencyCodePattern = /^[A-Z]{3}$/;
function validateCurrencyCode(currency) {
    return currencyCodePattern.test(currency);
}
/**
 * Validate job name
 */
function validateJobName(name) {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: "Job name is required" };
    }
    if (name.length > 255) {
        return { valid: false, error: "Job name cannot exceed 255 characters" };
    }
    return { valid: true };
}
/**
 * Validate webhook URL
 */
const urlSchema = zod_1.z.string().url();
function validateWebhookURL(url) {
    try {
        urlSchema.parse(url);
        // Must be HTTPS in production
        if (process.env.NODE_ENV === "production" && !url.startsWith("https://")) {
            return { valid: false, error: "Webhook URL must use HTTPS in production" };
        }
        return { valid: true };
    }
    catch {
        return { valid: false, error: "Invalid URL format" };
    }
}
/**
 * Middleware to validate common request patterns
 */
function commonValidationsMiddleware(req, res, next) {
    // Validate UUIDs in params
    validateUUID(req, res, () => {
        // Validate date ranges in query
        if (req.query.startDate || req.query.endDate) {
            const dateRange = validateDateRange(req.query.startDate, req.query.endDate);
            if (!dateRange.valid) {
                res.status(400).json({
                    error: "BAD_REQUEST",
                    message: dateRange.error,
                });
                return;
            }
        }
        // Validate pagination
        if (req.query.page || req.query.limit) {
            const pagination = validatePagination(req.query.page ? Number(req.query.page) : undefined, req.query.limit ? Number(req.query.limit) : undefined);
            if (!pagination.valid) {
                res.status(400).json({
                    error: "BAD_REQUEST",
                    message: pagination.error,
                });
                return;
            }
        }
        next();
    });
}
//# sourceMappingURL=validation-enhancements.js.map