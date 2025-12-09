"use strict";
/**
 * Input Sanitization Middleware
 * Provides additional input sanitization beyond Zod validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = sanitizeInput;
exports.sanitizeUrlParams = sanitizeUrlParams;
const xss_sanitize_1 = require("../utils/xss-sanitize");
const logger_1 = require("../utils/logger");
/**
 * Sanitize request body to prevent XSS and injection attacks
 * This is a defense-in-depth measure - Zod validation is primary
 */
function sanitizeInput(req, _res, next) {
    // Only sanitize if body exists and is an object
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
        try {
            // Deep sanitize string values
            req.body = (0, xss_sanitize_1.sanitizeReportData)(req.body);
        }
        catch (error) {
            (0, logger_1.logWarn)('Input sanitization failed', { error, path: req.path });
            // Continue anyway - Zod validation will catch invalid input
        }
    }
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
        for (const [key, value] of Object.entries(req.query)) {
            if (typeof value === 'string') {
                // Remove potential XSS patterns
                const sanitized = value
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
                if (sanitized !== value) {
                    (0, logger_1.logWarn)('Potentially malicious query parameter detected', {
                        key,
                        path: req.path,
                        ip: req.ip,
                    });
                    req.query[key] = sanitized;
                }
            }
        }
    }
    next();
}
/**
 * Validate and sanitize URL parameters
 */
function sanitizeUrlParams(req, res, next) {
    // Validate UUID format for ID parameters
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const [key, value] of Object.entries(req.params)) {
        if (key.toLowerCase().includes('id') && typeof value === 'string') {
            if (!uuidPattern.test(value)) {
                res.status(400).json({
                    error: 'INVALID_ID',
                    message: `Invalid ${key} format`,
                });
                return;
            }
        }
        // Sanitize string parameters
        if (typeof value === 'string') {
            const sanitized = value.replace(/[<>'"&]/g, '');
            if (sanitized !== value) {
                (0, logger_1.logWarn)('Potentially malicious URL parameter detected', {
                    key,
                    path: req.path,
                    ip: req.ip,
                });
                req.params[key] = sanitized;
            }
        }
    }
    next();
}
//# sourceMappingURL=input-sanitization.js.map