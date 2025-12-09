"use strict";
/**
 * Enhanced Error Handler
 * UX-003: Detailed error messages with field-level validation and AI-powered suggestions
 * Future-forward: AI suggests fixes, provides code examples, links to docs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEnhancedError = handleEnhancedError;
const typed_errors_1 = require("./typed-errors");
const logger_1 = require("./logger");
/**
 * Generate AI-powered suggestions for errors
 */
function generateSuggestion(error, details) {
    if (error instanceof typed_errors_1.ValidationError) {
        if (Array.isArray(details)) {
            const fieldErrors = details;
            // Suggest fixes based on error codes
            const suggestions = {
                REQUIRED_FIELD_MISSING: "Add the missing required field to your request.",
                INVALID_FIELD_TYPE: "Check the field type matches the expected format (string, number, boolean, or array).",
                INVALID_ADAPTER: "Use a supported adapter. See /api/v1/adapters for available options.",
                UNKNOWN_FIELD: "Remove the unknown field or check the adapter documentation for valid fields.",
            };
            const firstError = fieldErrors[0];
            if (firstError?.code) {
                return suggestions[firstError.code] || "Check the field requirements in the adapter documentation.";
            }
            return "Check the field requirements in the adapter documentation.";
        }
    }
    if (error instanceof typed_errors_1.RateLimitError) {
        return `Rate limit exceeded. Retry after ${error.retryAfter}s. Consider upgrading your plan for higher limits.`;
    }
    if (error instanceof typed_errors_1.NotFoundError) {
        return `The resource doesn't exist or you don't have access. Check the ID and try again.`;
    }
    return undefined;
}
/**
 * Generate code examples for errors
 */
function generateExample(error, details) {
    if (error instanceof typed_errors_1.ValidationError && Array.isArray(details)) {
        const fieldErrors = details;
        const firstError = fieldErrors[0];
        if (firstError?.code === "REQUIRED_FIELD_MISSING") {
            return `// Example: Add missing field
const job = await settler.jobs.create({
  name: "My Job",
  source: {
    adapter: "stripe",
    config: {
      apiKey: "sk_live_...", // ✅ Required field
    },
  },
  // ... rest of config
});`;
        }
        if (firstError?.code === "INVALID_FIELD_TYPE") {
            return `// Example: Correct field type
const job = await settler.jobs.create({
  source: {
    adapter: "stripe",
    config: {
      apiKey: "sk_live_...", // ✅ String (not number)
      // ❌ Wrong: apiKey: 12345
    },
  },
});`;
        }
    }
    return undefined;
}
/**
 * Get documentation link for error
 */
function getDocLink(error, details) {
    if (error instanceof typed_errors_1.ValidationError) {
        if (Array.isArray(details)) {
            const fieldErrors = details;
            const firstError = fieldErrors[0];
            if (firstError?.field === "adapter") {
                return "https://docs.settler.io/adapters";
            }
            return "https://docs.settler.io/api/validation";
        }
    }
    if (error instanceof typed_errors_1.RateLimitError) {
        return "https://docs.settler.io/api/rate-limits";
    }
    return "https://docs.settler.io/api/errors";
}
/**
 * Enhanced error handler with AI-powered suggestions
 */
function handleEnhancedError(res, error, defaultMessage, statusCode = 500, context) {
    const traceId = context?.traceId;
    if (error instanceof typed_errors_1.ApiError) {
        const suggestion = generateSuggestion(error, error.details);
        const example = generateExample(error, error.details);
        const docLink = getDocLink(error, error.details);
        const errorResponse = {
            code: error.errorCode,
            message: error.message,
            type: error.constructor.name,
        };
        if (error.details) {
            if (Array.isArray(error.details)) {
                errorResponse.details = error.details.map(d => {
                    const detail = {
                        field: d.field,
                        message: d.message,
                        code: d.code,
                    };
                    const suggestion = generateSuggestion(error, [d]);
                    const example = generateExample(error, [d]);
                    const docLink = getDocLink(error, [d]);
                    if (suggestion) {
                        detail.suggestion = suggestion;
                    }
                    if (example) {
                        detail.example = example;
                    }
                    if (docLink) {
                        detail.docLink = docLink;
                    }
                    return detail;
                });
            }
        }
        if (suggestion) {
            errorResponse.suggestion = suggestion;
        }
        if (example) {
            errorResponse.example = example;
        }
        if (docLink) {
            errorResponse.docLink = docLink;
        }
        if (traceId) {
            errorResponse.traceId = traceId;
        }
        const response = {
            error: errorResponse,
        };
        res.status(error.statusCode).json(response);
        return;
    }
    // Unknown error
    (0, logger_1.logError)('Unknown error', error, context);
    res.status(statusCode).json({
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: defaultMessage,
            type: "InternalServerError",
            ...(traceId && { traceId }),
            docLink: "https://docs.settler.io/api/errors",
        },
    });
}
//# sourceMappingURL=enhanced-error-handler.js.map