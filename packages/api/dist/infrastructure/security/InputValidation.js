"use strict";
/**
 * Comprehensive Input Validation
 * OWASP Top 10 mitigation: Injection, XSS, etc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REQUEST_LIMITS = exports.commonSchemas = void 0;
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
exports.sanitizeString = sanitizeString;
exports.validateJson = validateJson;
exports.validateFile = validateFile;
const zod_1 = require("zod");
// Common validation schemas
exports.commonSchemas = {
    uuid: zod_1.z.string().uuid('Invalid UUID format'),
    email: zod_1.z.string().email('Invalid email format').max(255),
    slug: zod_1.z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format').min(1).max(255),
    url: zod_1.z.string().url('Invalid URL format').max(2048),
    nonEmptyString: zod_1.z.string().min(1).max(10000),
    positiveInteger: zod_1.z.number().int().positive(),
    nonNegativeInteger: zod_1.z.number().int().nonnegative(),
    json: zod_1.z.string().transform((str, ctx) => {
        try {
            return JSON.parse(str);
        }
        catch {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Invalid JSON',
            });
            return zod_1.z.NEVER;
        }
    }),
};
// Request size limits (OWASP recommendation)
exports.REQUEST_LIMITS = {
    MAX_BODY_SIZE: 1024 * 1024, // 1 MB
    MAX_FIELD_LENGTH: 10000,
    MAX_ARRAY_LENGTH: 1000,
    MAX_DEPTH: 20,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
};
/**
 * Validate request body with Zod schema
 */
function validateBody(schema) {
    return async (req, res, next) => {
        try {
            // Check body size
            const contentLength = parseInt(req.get('content-length') || '0', 10);
            if (contentLength > exports.REQUEST_LIMITS.MAX_BODY_SIZE) {
                res.status(413).json({
                    error: 'PayloadTooLarge',
                    message: `Request body exceeds ${exports.REQUEST_LIMITS.MAX_BODY_SIZE} bytes`,
                });
                return;
            }
            // Validate with Zod
            const validated = await schema.parseAsync(req.body);
            req.body = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: 'ValidationError',
                    message: 'Invalid request body',
                    details: error.errors.map((e) => ({
                        path: e.path.join('.'),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
}
/**
 * Validate query parameters
 */
function validateQuery(schema) {
    return async (req, res, next) => {
        try {
            const validated = await schema.parseAsync(req.query);
            req.query = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: 'ValidationError',
                    message: 'Invalid query parameters',
                    details: error.errors.map((e) => ({
                        path: e.path.join('.'),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
}
/**
 * Validate path parameters
 */
function validateParams(schema) {
    return async (req, res, next) => {
        try {
            const validated = await schema.parseAsync(req.params);
            req.params = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: 'ValidationError',
                    message: 'Invalid path parameters',
                    details: error.errors.map((e) => ({
                        path: e.path.join('.'),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
}
/**
 * Sanitize string input (XSS prevention)
 */
function sanitizeString(input) {
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');
    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    // Truncate to max length
    if (sanitized.length > exports.REQUEST_LIMITS.MAX_FIELD_LENGTH) {
        sanitized = sanitized.substring(0, exports.REQUEST_LIMITS.MAX_FIELD_LENGTH);
    }
    return sanitized;
}
/**
 * Validate and sanitize JSON input
 */
function validateJson(input, maxDepth = exports.REQUEST_LIMITS.MAX_DEPTH) {
    const parsed = JSON.parse(input);
    function checkDepth(obj, currentDepth = 0) {
        if (currentDepth > maxDepth) {
            throw new Error(`JSON depth exceeds maximum of ${maxDepth} levels`);
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const value of Object.values(obj)) {
                if (typeof value === 'object' && value !== null) {
                    checkDepth(value, currentDepth + 1);
                }
            }
        }
    }
    checkDepth(parsed);
    return parsed;
}
/**
 * Validate file upload
 */
function validateFile(file) {
    if (file.size > exports.REQUEST_LIMITS.MAX_FILE_SIZE) {
        throw new Error(`File size exceeds ${exports.REQUEST_LIMITS.MAX_FILE_SIZE} bytes`);
    }
    // Validate file extension (whitelist approach)
    const allowedExtensions = ['.json', '.csv', '.txt'];
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(ext.toLowerCase())) {
        throw new Error(`File type not allowed: ${ext}`);
    }
}
//# sourceMappingURL=InputValidation.js.map