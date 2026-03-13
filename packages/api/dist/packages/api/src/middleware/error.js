"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
const sentry_1 = require("./sentry");
const typed_errors_1 = require("../utils/typed-errors");
const problem_json_1 = require("../utils/problem-json");
const errorHandler = (err, req, res, _next) => {
    const authReq = req;
    const apiError = (0, typed_errors_1.toApiError)(err);
    // Set Sentry user context
    if (authReq.userId) {
        (0, sentry_1.setSentryUser)(authReq);
    }
    // Log error with context
    (0, logger_1.logError)("Request error", err, {
        method: req.method,
        path: req.path,
        ip: req.ip,
        traceId: authReq.traceId,
        userId: authReq.userId,
    });
    // Capture exception to Sentry (only for 5xx errors)
    const statusCode = apiError.statusCode;
    if (statusCode >= 500) {
        const error = err instanceof Error ? err : new Error(String(err));
        (0, sentry_1.captureException)(error, {
            request: {
                method: req.method,
                url: req.url,
                headers: req.headers,
                query: req.query,
                body: req.body,
            },
            user: {
                id: authReq.userId,
            },
        });
    }
    const extra = {};
    if (apiError.details) {
        extra.details = apiError.details;
    }
    if (config_1.config.nodeEnv === "development" && err instanceof Error && err.stack !== undefined) {
        extra.stack = err.stack;
    }
    (0, problem_json_1.sendProblemJson)(authReq, res, {
        status: statusCode,
        title: apiError.name,
        detail: apiError.message,
        code: apiError.errorCode,
        extra,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.js.map