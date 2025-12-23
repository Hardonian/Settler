/**
 * Custom Integrations Service
 * Handles custom adapter development and white-label configurations
 */
export interface CustomIntegration {
    id: string;
    tenantId: string;
    integrationName: string;
    integrationType: string;
    adapterConfig: Record<string, unknown>;
    isActive: boolean;
    whiteLabelConfig?: {
        logoUrl?: string;
        brandColor?: string;
        companyName?: string;
        customDomain?: string;
    };
}
/**
 * Create custom integration
 */
export declare function createCustomIntegration(tenantId: string, integrationName: string, integrationType: string, adapterConfig: Record<string, unknown>, whiteLabelConfig?: Record<string, unknown>): Promise<string>;
/**
 * Get custom integration
 */
export declare function getCustomIntegration(tenantId: string, integrationId: string): Promise<CustomIntegration | null>;
/**
 * List custom integrations
 */
export declare function listCustomIntegrations(tenantId: string, filters?: {
    isActive?: boolean;
    integrationType?: string;
}): Promise<CustomIntegration[]>;
/**
 * Update custom integration
 */
export declare function updateCustomIntegration(tenantId: string, integrationId: string, updates: {
    adapterConfig?: Record<string, unknown>;
    whiteLabelConfig?: Record<string, unknown>;
    isActive?: boolean;
}): Promise<void>;
//# sourceMappingURL=custom-integrations.d.ts.map