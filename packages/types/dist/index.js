/**
 * Canonical Data Model Types
 *
 * These types represent the unified, opinionated schema for all payment data,
 * abstracting provider differences as specified in the Product & Technical Specification.
 */
// Environment validation utilities (Phase 3: Environment Safety)
export { serverEnvSchema, clientEnvSchema, fullEnvSchema, validateServerEnv, validateClientEnv, validateEnv, safeEnv, } from "./env-validation";
export { CLIENT_ENV_KEYS, SERVER_ENV_KEYS, BUILD_REQUIRED_SERVER_KEYS, RUNTIME_REQUIRED_SERVER_KEYS, validateClientEnv as validateTypedClientEnv, validateServerEnv as validateTypedServerEnv, validateEnvScopes, } from "./typed-env";
// Logging utilities (Phase 5: Observability)
export { logger, RequestCorrelation, AppError, safeAsync, } from "./logging";
// Support intake (canonical operator/evidence-aligned categories)
export { SUPPORT_ISSUE_CATEGORY, SUPPORT_ISSUE_CATEGORY_LABELS, supportIntakeRequestSchema, supportIntakeSubmissionSchema, } from "./support-intake-contract";
// Commercial spine (plans, meters, premium packs, legacy mappings)
export { USAGE_METERS, PLAN_SPINE, PREMIUM_PACKS, PLAN_DEFAULT_MRR_USD, LEGACY_SUBSCRIPTION_PLAN_ID_MAP, mapLegacySubscriptionPlanId, mapLegacyPlanTypeToPlanCode, getPlanSpine, getDefaultPlanCode, getLegacyQuotaProfile, getReconciliationVolumeLimit, getExceptionThreshold, calculatePlanMonthlyCostUsd, API_LEGACY_PLAN_FEATURES, getApiLegacyPlanLimits, getApiLegacyPlanFeatures, } from "./commercial-spine";
//# sourceMappingURL=index.js.map