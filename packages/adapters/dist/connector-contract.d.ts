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
export declare class ConnectorError extends Error {
    readonly code: string;
    readonly connector: string;
    readonly cause?: Error | undefined;
    constructor(message: string, code: string, connector: string, cause?: Error | undefined);
}
/**
 * Validation error for data normalization failures
 */
export declare class ValidationError extends Error {
    readonly field?: string | undefined;
    readonly value?: unknown | undefined;
    constructor(message: string, field?: string | undefined, value?: unknown | undefined);
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
export declare const DEFAULT_VALIDATION_RULES: ConnectorValidationRules;
/**
 * Validate connector implementation against contract
 */
export declare function validateConnector(connector: Connector, rules?: ConnectorValidationRules): ValidationResult;
//# sourceMappingURL=connector-contract.d.ts.map