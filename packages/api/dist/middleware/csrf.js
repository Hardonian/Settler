"use strict";
/**
 * CSRF Protection Middleware
 * Protects web UI endpoints from Cross-Site Request Forgery attacks
 *
 * Uses double-submit cookie pattern:
 * 1. Server sets CSRF token in cookie (httpOnly: false for JavaScript access)
 * 2. Client sends token in header (X-CSRF-Token)
 * 3. Server validates token matches cookie value
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfProtection = csrfProtection;
exports.setCsrfToken = setCsrfToken;
exports.getCsrfToken = getCsrfToken;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';
/**
 * Generate CSRF token
 */
function generateCsrfToken() {
    return (0, uuid_1.v4)();
}
/**
 * CSRF protection middleware
 * Only applies to state-changing methods (POST, PUT, PATCH, DELETE)
 * and only when not using API key authentication
 */
function csrfProtection(req, res, next) {
    // Skip CSRF for API key authentication (stateless)
    if (req.headers['x-api-key']) {
        return next();
    }
    // Skip CSRF for read-only methods
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!stateChangingMethods.includes(req.method)) {
        return next();
    }
    // Skip CSRF for API endpoints (they use API keys or JWT)
    if (req.path.startsWith('/api/')) {
        return next();
    }
    // Get token from cookie and header
    const cookieToken = req.cookies[CSRF_TOKEN_COOKIE];
    const headerToken = req.headers[CSRF_TOKEN_HEADER];
    // Validate tokens match
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        (0, logger_1.logWarn)('CSRF token validation failed', {
            path: req.path,
            method: req.method,
            ip: req.ip,
        });
        res.status(403).json({
            error: 'FORBIDDEN',
            message: 'CSRF token validation failed',
        });
        return;
    }
    next();
}
/**
 * Middleware to set CSRF token cookie
 * Sets token on GET requests for web UI
 */
function setCsrfToken(req, res, next) {
    // Only set CSRF token for web UI routes
    if (req.path.startsWith('/api/')) {
        return next();
    }
    // Generate new token if not present
    const existingToken = req.cookies[CSRF_TOKEN_COOKIE];
    if (!existingToken) {
        const token = generateCsrfToken();
        res.cookie(CSRF_TOKEN_COOKIE, token, {
            httpOnly: false, // Must be accessible to JavaScript
            secure: config_1.config.security.secureCookies, // HTTPS only in production
            sameSite: 'strict', // Prevent CSRF attacks
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
    }
    next();
}
/**
 * Get CSRF token endpoint (for JavaScript clients)
 * Returns token in response body
 */
function getCsrfToken(req, res) {
    const token = req.cookies[CSRF_TOKEN_COOKIE] || generateCsrfToken();
    // Set cookie if not present
    if (!req.cookies[CSRF_TOKEN_COOKIE]) {
        res.cookie(CSRF_TOKEN_COOKIE, token, {
            httpOnly: false,
            secure: config_1.config.security.secureCookies,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000,
        });
    }
    res.json({ csrfToken: token });
}
//# sourceMappingURL=csrf.js.map