"use strict";
/**
 * Canonical Data Model Types
 *
 * These types represent the unified, opinionated schema for all payment data,
 * abstracting provider differences as specified in the Product & Technical Specification.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportIntakeSubmissionSchema = exports.SUPPORT_SEVERITY_LABELS = exports.SUPPORT_SEVERITY = exports.SUPPORT_STATUS_LABELS = exports.SUPPORT_STATUS = exports.SUPPORT_ISSUE_CATEGORY_LABELS = exports.SUPPORT_ISSUE_CATEGORY = exports.safeAsync = exports.AppError = exports.RequestCorrelation = exports.logger = exports.validateEnvScopes = exports.validateTypedServerEnv = exports.validateTypedClientEnv = exports.RUNTIME_REQUIRED_SERVER_KEYS = exports.BUILD_REQUIRED_SERVER_KEYS = exports.SERVER_ENV_KEYS = exports.CLIENT_ENV_KEYS = exports.safeEnv = exports.validateEnv = exports.validateClientEnv = exports.validateServerEnv = exports.fullEnvSchema = exports.clientEnvSchema = exports.serverEnvSchema = void 0;
// Environment validation utilities (Phase 3: Environment Safety)
var env_validation_1 = require("./env-validation");
Object.defineProperty(exports, "serverEnvSchema", { enumerable: true, get: function () { return env_validation_1.serverEnvSchema; } });
Object.defineProperty(exports, "clientEnvSchema", { enumerable: true, get: function () { return env_validation_1.clientEnvSchema; } });
Object.defineProperty(exports, "fullEnvSchema", { enumerable: true, get: function () { return env_validation_1.fullEnvSchema; } });
Object.defineProperty(exports, "validateServerEnv", { enumerable: true, get: function () { return env_validation_1.validateServerEnv; } });
Object.defineProperty(exports, "validateClientEnv", { enumerable: true, get: function () { return env_validation_1.validateClientEnv; } });
Object.defineProperty(exports, "validateEnv", { enumerable: true, get: function () { return env_validation_1.validateEnv; } });
Object.defineProperty(exports, "safeEnv", { enumerable: true, get: function () { return env_validation_1.safeEnv; } });
var typed_env_1 = require("./typed-env");
Object.defineProperty(exports, "CLIENT_ENV_KEYS", { enumerable: true, get: function () { return typed_env_1.CLIENT_ENV_KEYS; } });
Object.defineProperty(exports, "SERVER_ENV_KEYS", { enumerable: true, get: function () { return typed_env_1.SERVER_ENV_KEYS; } });
Object.defineProperty(exports, "BUILD_REQUIRED_SERVER_KEYS", { enumerable: true, get: function () { return typed_env_1.BUILD_REQUIRED_SERVER_KEYS; } });
Object.defineProperty(exports, "RUNTIME_REQUIRED_SERVER_KEYS", { enumerable: true, get: function () { return typed_env_1.RUNTIME_REQUIRED_SERVER_KEYS; } });
Object.defineProperty(exports, "validateTypedClientEnv", { enumerable: true, get: function () { return typed_env_1.validateClientEnv; } });
Object.defineProperty(exports, "validateTypedServerEnv", { enumerable: true, get: function () { return typed_env_1.validateServerEnv; } });
Object.defineProperty(exports, "validateEnvScopes", { enumerable: true, get: function () { return typed_env_1.validateEnvScopes; } });
// Logging utilities (Phase 5: Observability)
var logging_1 = require("./logging");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logging_1.logger; } });
Object.defineProperty(exports, "RequestCorrelation", { enumerable: true, get: function () { return logging_1.RequestCorrelation; } });
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return logging_1.AppError; } });
Object.defineProperty(exports, "safeAsync", { enumerable: true, get: function () { return logging_1.safeAsync; } });
// Support intake (canonical operator/evidence-aligned categories)
var support_intake_contract_1 = require("./support-intake-contract");
Object.defineProperty(exports, "SUPPORT_ISSUE_CATEGORY", { enumerable: true, get: function () { return support_intake_contract_1.SUPPORT_ISSUE_CATEGORY; } });
Object.defineProperty(exports, "SUPPORT_ISSUE_CATEGORY_LABELS", { enumerable: true, get: function () { return support_intake_contract_1.SUPPORT_ISSUE_CATEGORY_LABELS; } });
Object.defineProperty(exports, "SUPPORT_STATUS", { enumerable: true, get: function () { return support_intake_contract_1.SUPPORT_STATUS; } });
Object.defineProperty(exports, "SUPPORT_STATUS_LABELS", { enumerable: true, get: function () { return support_intake_contract_1.SUPPORT_STATUS_LABELS; } });
Object.defineProperty(exports, "SUPPORT_SEVERITY", { enumerable: true, get: function () { return support_intake_contract_1.SUPPORT_SEVERITY; } });
Object.defineProperty(exports, "SUPPORT_SEVERITY_LABELS", { enumerable: true, get: function () { return support_intake_contract_1.SUPPORT_SEVERITY_LABELS; } });
Object.defineProperty(exports, "supportIntakeSubmissionSchema", { enumerable: true, get: function () { return support_intake_contract_1.supportIntakeSubmissionSchema; } });
//# sourceMappingURL=index.js.map