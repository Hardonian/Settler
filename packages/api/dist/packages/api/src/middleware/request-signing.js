"use strict";
/**
 * Request Signing Middleware
 *
 * Implements HMAC request signing for webhook security and API authentication
 * Supports multiple signature algorithms (HMAC-SHA256, HMAC-SHA512)
 *
 * Usage:
 * - Webhook signature verification
 * - API request signing for third-party integrations
 * - Request replay protection via timestamp validation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRequestSignature = verifyRequestSignature;
exports.generateRequestSignature = generateRequestSignature;
exports.requestSigningMiddleware = requestSigningMiddleware;
exports.webhookSignatureMiddleware = webhookSignatureMiddleware;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
/**
 * Verify request signature
 */
function verifyRequestSignature(payload, signature, timestamp, secret, algorithm = 'sha256') {
    try {
        const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
        const now = Math.floor(Date.now() / 1000);
        const tolerance = 300; // 5 minutes default
        // Check timestamp freshness
        if (Math.abs(now - timestampNum) > tolerance) {
            return {
                valid: false,
                reason: 'Timestamp out of tolerance',
                timestamp: timestampNum,
            };
        }
        // Create signed payload
        const signedPayload = `${timestampNum}.${typeof payload === 'string' ? payload : payload.toString()}`;
        const hash = crypto_1.default
            .createHmac(algorithm, secret)
            .update(signedPayload)
            .digest('hex');
        // Extract signature from header (format: v1=signature or just signature)
        const signatureValue = signature.startsWith('v1=') ? signature.substring(3) : signature;
        // Constant-time comparison
        const isValid = crypto_1.default.timingSafeEqual(Buffer.from(hash), Buffer.from(signatureValue));
        const result = {
            valid: isValid,
            algorithm,
            timestamp: timestampNum,
        };
        if (!isValid) {
            result.reason = 'Signature mismatch';
        }
        return result;
    }
    catch (error) {
        return {
            valid: false,
            reason: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Generate request signature
 */
function generateRequestSignature(payload, secret, algorithm = 'sha256') {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${typeof payload === 'string' ? payload : payload.toString()}`;
    const signature = crypto_1.default
        .createHmac(algorithm, secret)
        .update(signedPayload)
        .digest('hex');
    return {
        signature: `v1=${signature}`,
        timestamp,
        header: `t=${timestamp},v1=${signature}`,
    };
}
/**
 * Request signing middleware factory
 */
function requestSigningMiddleware(config) {
    return (req, res, next) => {
        const signatureHeader = req.headers[config.headerName || 'x-signature'];
        const timestampHeader = req.headers[config.timestampHeaderName || 'x-signature-timestamp'];
        if (!signatureHeader || !timestampHeader) {
            (0, logger_1.logWarn)('Missing signature headers', {
                path: req.path,
                method: req.method,
            });
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing signature headers',
            });
        }
        // Get request body as string
        const payload = typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body);
        const verification = verifyRequestSignature(payload, signatureHeader, timestampHeader, config.secret, config.algorithm);
        if (!verification.valid) {
            (0, logger_1.logWarn)('Invalid request signature', {
                path: req.path,
                method: req.method,
                reason: verification.reason,
            });
            return res.status(401).json({
                error: 'Unauthorized',
                message: verification.reason || 'Invalid signature',
            });
        }
        // Attach signature info to request
        req.signature = {
            algorithm: verification.algorithm || config.algorithm || 'sha256',
            timestamp: verification.timestamp || parseInt(timestampHeader, 10),
            signature: signatureHeader,
            verified: true,
        };
        return next();
    };
}
/**
 * Webhook signature verification middleware (for incoming webhooks)
 */
function webhookSignatureMiddleware(secret) {
    return (req, res, next) => {
        const signature = req.headers['x-webhook-signature'];
        const timestamp = req.headers['x-webhook-timestamp'];
        if (!signature || !timestamp) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing webhook signature',
            });
        }
        const rawBody = typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body);
        const verification = verifyRequestSignature(rawBody, signature, timestamp, secret);
        if (!verification.valid) {
            (0, logger_1.logError)('Webhook signature verification failed', undefined, {
                path: req.path,
                reason: verification.reason,
            });
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid webhook signature',
            });
        }
        req.signature = {
            algorithm: verification.algorithm || 'sha256',
            timestamp: verification.timestamp || parseInt(timestamp, 10),
            signature,
            verified: true,
        };
        return next();
    };
}
//# sourceMappingURL=request-signing.js.map