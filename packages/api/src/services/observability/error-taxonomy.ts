export const ERROR_CATEGORY = {
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  VALIDATION: "validation",
  DEPENDENCY: "dependency",
  THROTTLING: "throttling",
  DATA_INTEGRITY: "data_integrity",
  TIMEOUT: "timeout",
  INTERNAL: "internal",
  CONFIGURATION: "configuration",
} as const;

export type ErrorCategory = (typeof ERROR_CATEGORY)[keyof typeof ERROR_CATEGORY];

export const ERROR_SEVERITY = {
  SEV0: "sev0_critical",
  SEV1: "sev1_high",
  SEV2: "sev2_medium",
  SEV3: "sev3_low",
} as const;

export type ErrorSeverity = (typeof ERROR_SEVERITY)[keyof typeof ERROR_SEVERITY];

export interface ObservabilityCorrelationFields {
  tenant_id: string;
  run_id?: string;
  route: string;
  module: string;
}

export interface ErrorObservabilityMetadata extends ObservabilityCorrelationFields {
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  error_signature: string;
}

export function createErrorSignature(params: {
  errorName?: string;
  route: string;
  module: string;
}): string {
  const normalizedError = (params.errorName || "UnknownError").replace(/\s+/g, "");
  return `${normalizedError}|${params.route}|${params.module}`;
}

export function buildErrorObservabilityMetadata(params: {
  tenant_id: string;
  run_id?: string;
  route: string;
  module: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  errorName?: string;
  errorSignature?: string;
}): ErrorObservabilityMetadata {
  return {
    tenant_id: params.tenant_id,
    run_id: params.run_id,
    route: params.route,
    module: params.module,
    category: params.category,
    severity: params.severity,
    retryable: params.retryable,
    error_signature:
      params.errorSignature ||
      createErrorSignature({
        errorName: params.errorName,
        route: params.route,
        module: params.module,
      }),
  };
}
