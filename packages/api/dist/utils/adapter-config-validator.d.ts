/**
 * Adapter Configuration Validator
 * Provides clear schema validation for adapter configs
 * Part of UX-002: Adapter config schema clarity
 */
export interface AdapterConfigSchema {
    required: string[];
    optional?: string[];
    fields?: Record<string, {
        type: 'string' | 'number' | 'boolean' | 'array';
        description?: string;
        example?: unknown;
    }>;
}
export declare const ADAPTER_CONFIG_SCHEMAS: Record<string, AdapterConfigSchema>;
/**
 * Validate adapter configuration
 * @param adapter - Adapter name
 * @param config - Configuration object
 * @throws ValidationError if config is invalid
 */
export declare function validateAdapterConfig(adapter: string, config: Record<string, unknown>): void;
/**
 * Get adapter config schema (for API docs)
 */
export declare function getAdapterConfigSchema(adapter: string): AdapterConfigSchema | null;
/**
 * List all supported adapters with their config schemas
 */
export declare function listAdapters(): Array<{
    id: string;
    name: string;
    configSchema: AdapterConfigSchema;
}>;
//# sourceMappingURL=adapter-config-validator.d.ts.map