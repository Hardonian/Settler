"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_SEVERITY = exports.ERROR_CATEGORY = void 0;
exports.createErrorSignature = createErrorSignature;
exports.buildErrorObservabilityMetadata = buildErrorObservabilityMetadata;
exports.ERROR_CATEGORY = {
    AUTHENTICATION: "authentication",
    AUTHORIZATION: "authorization",
    VALIDATION: "validation",
    DEPENDENCY: "dependency",
    THROTTLING: "throttling",
    DATA_INTEGRITY: "data_integrity",
    TIMEOUT: "timeout",
    INTERNAL: "internal",
    CONFIGURATION: "configuration",
};
exports.ERROR_SEVERITY = {
    SEV0: "sev0_critical",
    SEV1: "sev1_high",
    SEV2: "sev2_medium",
    SEV3: "sev3_low",
};
function createErrorSignature(params) {
    const normalizedError = (params.errorName || "UnknownError").replace(/\s+/g, "");
    return `${normalizedError}|${params.route}|${params.module}`;
}
function buildErrorObservabilityMetadata(params) {
    return {
        tenant_id: params.tenant_id,
        run_id: params.run_id,
        route: params.route,
        module: params.module,
        category: params.category,
        severity: params.severity,
        retryable: params.retryable,
        error_signature: params.errorSignature ||
            createErrorSignature({
                errorName: params.errorName,
                route: params.route,
                module: params.module,
            }),
    };
}
//# sourceMappingURL=error-taxonomy.js.map