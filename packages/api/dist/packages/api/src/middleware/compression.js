"use strict";
/**
 * Compression Middleware
 * Supports Gzip and Brotli compression for API responses
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressionMiddleware = void 0;
exports.brotliCompressionMiddleware = brotliCompressionMiddleware;
const compression_1 = __importDefault(require("compression"));
const zlib = __importStar(require("zlib"));
const util_1 = require("util");
const logger_1 = require("../utils/logger");
const brotliCompress = (0, util_1.promisify)(zlib.brotliCompress);
// Check if client accepts Brotli
function acceptsBrotli(req) {
    const acceptEncoding = req.headers["accept-encoding"] || "";
    return acceptEncoding.includes("br");
}
// Check if client accepts Gzip
function acceptsGzip(req) {
    const acceptEncoding = req.headers["accept-encoding"] || "";
    return acceptEncoding.includes("gzip");
}
// Standard compression middleware (Gzip)
exports.compressionMiddleware = (0, compression_1.default)({
    filter: (req, res) => {
        // Don't compress if client doesn't accept it
        if (!acceptsGzip(req) && !acceptsBrotli(req)) {
            return false;
        }
        // Don't compress if response is already compressed
        if (res.getHeader("content-encoding")) {
            return false;
        }
        // Don't compress small responses (< 1KB)
        const contentLength = res.getHeader("content-length");
        if (contentLength && parseInt(contentLength, 10) < 1024) {
            return false;
        }
        // Compress JSON, text, and HTML responses
        const contentType = res.getHeader("content-type") || "";
        return /json|text|html/.test(contentType);
    },
    level: 6, // Balance between speed and compression ratio
    threshold: 1024, // Only compress responses > 1KB
});
// Brotli compression middleware (higher compression ratio)
async function brotliCompressionMiddleware(req, res, next) {
    // Only apply if client accepts Brotli
    if (!acceptsBrotli(req)) {
        return next();
    }
    const originalSend = res.send;
    res.send = function (body) {
        // Only compress JSON/text responses
        const contentType = res.getHeader("content-type") || "";
        if (!/json|text|html/.test(contentType)) {
            return originalSend.call(this, body);
        }
        // Only compress if body is large enough
        const bodyString = typeof body === "string" ? body : JSON.stringify(body);
        if (bodyString.length < 1024) {
            return originalSend.call(this, body);
        }
        // Compress with Brotli
        brotliCompress(Buffer.from(bodyString))
            .then((compressed) => {
            res.setHeader("content-encoding", "br");
            res.setHeader("content-length", compressed.length.toString());
            originalSend.call(this, compressed);
        })
            .catch((error) => {
            // Fallback to uncompressed
            (0, logger_1.logError)("Brotli compression failed", error);
            originalSend.call(this, body);
        });
        return res;
    };
    next();
}
//# sourceMappingURL=compression.js.map