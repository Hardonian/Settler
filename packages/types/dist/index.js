"use strict";
/**
 * Canonical Data Model Types
 *
 * These types represent the unified, opinionated schema for all payment data,
 * abstracting provider differences as specified in the Product & Technical Specification.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiLegacyPlanFeatures = exports.getApiLegacyPlanLimits = exports.API_LEGACY_PLAN_FEATURES = exports.calculatePlanMonthlyCostUsd = exports.getExceptionThreshold = exports.getReconciliationVolumeLimit = exports.getLegacyQuotaProfile = exports.getDefaultPlanCode = exports.getPlanSpine = exports.mapLegacyPlanTypeToPlanCode = exports.mapLegacySubscriptionPlanId = exports.LEGACY_SUBSCRIPTION_PLAN_ID_MAP = exports.PLAN_DEFAULT_MRR_USD = exports.PREMIUM_PACKS = exports.PLAN_SPINE = exports.USAGE_METERS = exports.supportIntakeSubmissionSchema = exports.supportIntakeRequestSchema = exports.SUPPORT_ISSUE_CATEGORY_LABELS = exports.SUPPORT_ISSUE_CATEGORY = exports.safeAsync = exports.AppError = exports.RequestCorrelation = exports.logger = exports.validateEnvScopes = exports.validateTypedServerEnv = exports.validateTypedClientEnv = exports.RUNTIME_REQUIRED_SERVER_KEYS = exports.BUILD_REQUIRED_SERVER_KEYS = exports.SERVER_ENV_KEYS = exports.CLIENT_ENV_KEYS = exports.safeEnv = exports.validateEnv = exports.validateClientEnv = exports.validateServerEnv = exports.fullEnvSchema = exports.clientEnvSchema = exports.serverEnvSchema = void 0;
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
Object.defineProperty(exports, "supportIntakeRequestSchema", { enumerable: true, get: function () { return support_intake_contract_1.supportIntakeRequestSchema; } });
Object.defineProperty(exports, "supportIntakeSubmissionSchema", { enumerable: true, get: function () { return support_intake_contract_1.supportIntakeSubmissionSchema; } });
// Commercial spine (plans, meters, premium packs, legacy mappings)
var commercial_spine_1 = require("./commercial-spine");
Object.defineProperty(exports, "USAGE_METERS", { enumerable: true, get: function () { return commercial_spine_1.USAGE_METERS; } });
Object.defineProperty(exports, "PLAN_SPINE", { enumerable: true, get: function () { return commercial_spine_1.PLAN_SPINE; } });
Object.defineProperty(exports, "PREMIUM_PACKS", { enumerable: true, get: function () { return commercial_spine_1.PREMIUM_PACKS; } });
Object.defineProperty(exports, "PLAN_DEFAULT_MRR_USD", { enumerable: true, get: function () { return commercial_spine_1.PLAN_DEFAULT_MRR_USD; } });
Object.defineProperty(exports, "LEGACY_SUBSCRIPTION_PLAN_ID_MAP", { enumerable: true, get: function () { return commercial_spine_1.LEGACY_SUBSCRIPTION_PLAN_ID_MAP; } });
Object.defineProperty(exports, "mapLegacySubscriptionPlanId", { enumerable: true, get: function () { return commercial_spine_1.mapLegacySubscriptionPlanId; } });
Object.defineProperty(exports, "mapLegacyPlanTypeToPlanCode", { enumerable: true, get: function () { return commercial_spine_1.mapLegacyPlanTypeToPlanCode; } });
Object.defineProperty(exports, "getPlanSpine", { enumerable: true, get: function () { return commercial_spine_1.getPlanSpine; } });
Object.defineProperty(exports, "getDefaultPlanCode", { enumerable: true, get: function () { return commercial_spine_1.getDefaultPlanCode; } });
Object.defineProperty(exports, "getLegacyQuotaProfile", { enumerable: true, get: function () { return commercial_spine_1.getLegacyQuotaProfile; } });
Object.defineProperty(exports, "getReconciliationVolumeLimit", { enumerable: true, get: function () { return commercial_spine_1.getReconciliationVolumeLimit; } });
Object.defineProperty(exports, "getExceptionThreshold", { enumerable: true, get: function () { return commercial_spine_1.getExceptionThreshold; } });
Object.defineProperty(exports, "calculatePlanMonthlyCostUsd", { enumerable: true, get: function () { return commercial_spine_1.calculatePlanMonthlyCostUsd; } });
Object.defineProperty(exports, "API_LEGACY_PLAN_FEATURES", { enumerable: true, get: function () { return commercial_spine_1.API_LEGACY_PLAN_FEATURES; } });
Object.defineProperty(exports, "getApiLegacyPlanLimits", { enumerable: true, get: function () { return commercial_spine_1.getApiLegacyPlanLimits; } });
Object.defineProperty(exports, "getApiLegacyPlanFeatures", { enumerable: true, get: function () { return commercial_spine_1.getApiLegacyPlanFeatures; } });
//# sourceMappingURL=index.js.map