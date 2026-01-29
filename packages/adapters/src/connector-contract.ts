/**
 * Connector Interface Contract
 *
 * This is the public contract that third-party connectors must implement.
 * External developers can build connectors without reading internal code.
 */

import { NormalizedData, FetchOptions, ValidationResult } from "./base";

/**
 * Connector interface that all adapters must implement
 *
 * This is the stable, versioned contract for third-party connectors.
 * Breaking changes require a major version bump.
 */
export interface Connector {
  /**
   * Unique identifier for this connector (e.g., 'stripe', 'shopify')
   */
  readonly name: string;

  /**
   * Version of the connector implementation
   */
  readonly version: string;

  /**
   * Fetch data from the external system
   *
   * @param options - Fetch configuration including date range and credentials
   * @returns Promise resolving to normalized data array
   * @throws {ConnectorError} When fetch fails
   */
  fetch(options: FetchOptions): Promise<NormalizedData[]>;

  /**
   * Normalize raw data from external system to Settler format
   *
   * @param data - Raw data from external system
   * @returns Normalized data object
   * @throws {ValidationError} When normalization fails
   */
  normalize(data: unknown): NormalizedData;

  /**
   * Validate normalized data before processing
   *
   * @param data - Normalized data to validate
   * @returns Validation result with errors if invalid
   */
  validate(data: NormalizedData): ValidationResult;

  /**
   * Optional: Normalize webhook payloads from external system
   *
   * @param payload - Raw webhook payload
   * @param tenantId - Tenant ID for context
   * @returns Array of normalized events
   */
  normalizeWebhook?(payload: unknown, tenantId: string): NormalizedData[];

  /**
   * Optional: Test connection to external system
   *
   * @param config - Connection configuration
   * @returns Promise resolving to connection test result
   */
  testConnection?(config: Record<string, unknown>): Promise<{
    success: boolean;
    message?: string;
  }>;
}

/**
 * Connector error for standardized error handling
 */
export class ConnectorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly connector: string,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = "ConnectorError";
  }
}

/**
 * Validation error for data normalization failures
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Connector metadata for registration
 */
export interface ConnectorMetadata {
  name: string;
  version: string;
  displayName: string;
  description: string;
  category: "payment" | "ecommerce" | "accounting" | "other";
  icon?: string;
  documentationUrl?: string;
  supportsWebhooks: boolean;
  requiredConfig: string[];
  optionalConfig: string[];
}

/**
 * Connector validation rules
 */
export interface ConnectorValidationRules {
  /**
   * Minimum version of connector interface required
   */
  minInterfaceVersion: string;

  /**
   * Required methods that must be implemented
   */
  requiredMethods: Array<keyof Connector>;

  /**
   * Validation rules for normalized data
   */
  dataValidation: {
    requiredFields: string[];
    fieldTypes: Record<string, "string" | "number" | "date" | "object" | "array">;
    constraints?: Record<string, unknown>;
  };

  /**
   * Rate limiting rules
   */
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };

  /**
   * Security requirements
   */
  security: {
    requiresHttps: boolean;
    allowedOrigins?: string[];
    credentialEncryption: "required" | "optional" | "none";
  };
}

/**
 * Default validation rules for connectors
 */
export const DEFAULT_VALIDATION_RULES: ConnectorValidationRules = {
  minInterfaceVersion: "1.0.0",
  requiredMethods: ["name", "version", "fetch", "normalize", "validate"],
  dataValidation: {
    requiredFields: ["id", "amount", "currency", "date"],
    fieldTypes: {
      id: "string",
      amount: "number",
      currency: "string",
      date: "date",
      metadata: "object",
    },
  },
  security: {
    requiresHttps: true,
    credentialEncryption: "required",
  },
};

/**
 * Validate connector implementation against contract
 */
export function validateConnector(
  connector: Connector,
  rules: ConnectorValidationRules = DEFAULT_VALIDATION_RULES
): ValidationResult {
  const errors: string[] = [];

  // Check required methods
  for (const method of rules.requiredMethods) {
    if (!(method in connector) || typeof connector[method] !== "function") {
      errors.push(`Missing required method: ${method}`);
    }
  }

  // Validate name
  if (!connector.name || typeof connector.name !== "string") {
    errors.push("Connector name must be a non-empty string");
  }

  // Validate version
  if (!connector.version || typeof connector.version !== "string") {
    errors.push("Connector version must be a non-empty string");
  }

  // Test normalize with sample data
  try {
    const normalized = connector.normalize({});
    const validation = connector.validate(normalized);
    if (!validation.valid) {
      errors.push(`Validation failed: ${validation.errors?.join(", ")}`);
    }
  } catch (error) {
    errors.push(
      `Normalize/validate test failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return {
    valid: errors.length === 0,
    ...(errors.length > 0 ? { errors } : {}),
  };
}
