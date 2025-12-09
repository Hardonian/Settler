"use strict";
/**
 * ETag Middleware
 * Implements HTTP ETags for cache validation on GET requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.etagMiddleware = etagMiddleware;
exports.generateETagFromData = generateETagFromData;
const crypto_1 = require("crypto");
/**
 * Generate ETag from response body
 */
function generateETag(body) {
    return `"${(0, crypto_1.createHash)('md5').update(body).digest('hex')}"`;
}
/**
 * ETag middleware for GET requests
 */
function etagMiddleware(req, res, next) {
    // Only apply to GET/HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
    }
    const originalSend = res.send;
    const originalJson = res.json;
    // Override res.send
    res.send = function (body) {
        const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
        const etag = generateETag(bodyString);
        // Set ETag header
        res.setHeader('ETag', etag);
        // Check if client sent If-None-Match header
        const clientETag = req.headers['if-none-match'];
        if (clientETag === etag || clientETag === `W/${etag}`) {
            // Resource hasn't changed
            res.status(304).end();
            return res;
        }
        return originalSend.call(this, body);
    };
    // Override res.json
    res.json = function (body) {
        const bodyString = JSON.stringify(body);
        const etag = generateETag(bodyString);
        res.setHeader('ETag', etag);
        const clientETag = req.headers['if-none-match'];
        if (clientETag === etag || clientETag === `W/${etag}`) {
            res.status(304).end();
            return res;
        }
        return originalJson.call(this, body);
    };
    next();
}
/**
 * Generate ETag from data object (for manual ETag generation)
 */
function generateETagFromData(data) {
    return generateETag(JSON.stringify(data));
}
//# sourceMappingURL=etag.js.map