"use strict";
/**
 * Sentry Error Tracking Integration
 * Captures and reports errors to Sentry
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSentry = initializeSentry;
exports.sentryRequestHandler = sentryRequestHandler;
exports.sentryTracingHandler = sentryTracingHandler;
exports.sentryErrorHandler = sentryErrorHandler;
exports.setSentryUser = setSentryUser;
exports.captureException = captureException;
exports.captureMessage = captureMessage;
const Sentry = __importStar(require("@sentry/node"));
const profiling_node_1 = require("@sentry/profiling-node");
const validation_1 = require("../config/validation");
let sentryInitialized = false;
/**
 * Initialize Sentry
 */
function initializeSentry() {
    if (sentryInitialized) {
        return;
    }
    if (!validation_1.validatedConfig.sentry.dsn) {
        console.log('Sentry DSN not configured, skipping Sentry initialization');
        return;
    }
    Sentry.init({
        dsn: validation_1.validatedConfig.sentry.dsn,
        environment: validation_1.validatedConfig.sentry.environment,
        tracesSampleRate: validation_1.validatedConfig.sentry.tracesSampleRate,
        profilesSampleRate: validation_1.validatedConfig.sentry.environment === 'production' ? 0.1 : 1.0,
        integrations: [
            new profiling_node_1.ProfilingIntegration(),
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express(),
        ],
        beforeSend(event, _hint) {
            // Don't send events in development unless explicitly enabled
            if (validation_1.validatedConfig.nodeEnv === 'development' && !process.env.SENTRY_ENABLE_DEV) {
                return null;
            }
            return event;
        },
    });
    sentryInitialized = true;
    console.log('Sentry initialized');
}
/**
 * Sentry request handler middleware
 * Must be added before other middleware
 */
function sentryRequestHandler() {
    if (!sentryInitialized) {
        return (_req, _res, next) => next();
    }
    return Sentry.Handlers.requestHandler({
        user: ['id', 'email'],
        ip: true,
    });
}
/**
 * Sentry tracing handler middleware
 * Adds performance tracing
 */
function sentryTracingHandler() {
    if (!sentryInitialized) {
        return (_req, _res, next) => next();
    }
    return Sentry.Handlers.tracingHandler();
}
/**
 * Sentry error handler middleware
 * Must be added before error handler
 */
function sentryErrorHandler() {
    if (!sentryInitialized) {
        return (err, _req, _res, next) => next(err);
    }
    return Sentry.Handlers.errorHandler({
        shouldHandleError(error) {
            // Don't report 4xx errors (client errors)
            const apiError = error;
            if (apiError.statusCode && apiError.statusCode < 500) {
                return false;
            }
            return true;
        },
    });
}
/**
 * Set user context for Sentry
 */
function setSentryUser(req) {
    if (!sentryInitialized || !req.userId) {
        return;
    }
    const user = {
        id: req.userId,
    };
    if (req.ip !== undefined) {
        user.ip_address = req.ip;
    }
    Sentry.setUser(user);
}
/**
 * Capture exception to Sentry
 */
function captureException(error, context) {
    if (!sentryInitialized) {
        return;
    }
    Sentry.withScope((scope) => {
        if (context) {
            Object.entries(context).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    scope.setContext(key, value);
                }
            });
        }
        Sentry.captureException(error);
    });
}
/**
 * Capture message to Sentry
 */
function captureMessage(message, level = 'info', context) {
    if (!sentryInitialized) {
        return;
    }
    Sentry.withScope((scope) => {
        if (context) {
            Object.entries(context).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    scope.setContext(key, value);
                }
            });
        }
        Sentry.captureMessage(message, level);
    });
}
//# sourceMappingURL=sentry.js.map