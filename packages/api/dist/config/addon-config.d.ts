/**
 * Add-On Configuration System
 *
 * Allows new add-ons to be defined via JSON configuration
 * without requiring database schema changes.
 */
export interface AddOnConfig {
    integration_id: string;
    name: string;
    description: string;
    category: "integration" | "feature" | "support";
    base_price_monthly: number;
    usage_price_per_unit?: number;
    usage_unit?: string;
    is_standard: boolean;
    features?: string[];
    required_credentials?: string[];
    metadata?: Record<string, unknown>;
}
/**
 * Add-on configurations (can be loaded from JSON file or database)
 */
export declare const ADDON_CONFIGS: Record<string, AddOnConfig>;
/**
 * Load add-on configuration
 */
export declare function getAddOnConfig(integrationId: string): AddOnConfig | null;
/**
 * Get all add-on configurations
 */
export declare function getAllAddOnConfigs(): AddOnConfig[];
/**
 * Get standard add-ons
 */
export declare function getStandardAddOns(): AddOnConfig[];
/**
 * Get premium add-ons
 */
export declare function getPremiumAddOns(): AddOnConfig[];
/**
 * Validate add-on configuration
 */
export declare function validateAddOnConfig(config: AddOnConfig): {
    valid: boolean;
    errors?: string[];
};
/**
 * Create add-on from configuration (for seeding database)
 */
interface SupabaseClient {
    from: (table: string) => {
        insert: (data: Record<string, unknown>) => {
            select: (columns: string) => {
                single: () => Promise<{
                    data: {
                        id: string;
                    } | null;
                    error: Error | null;
                }>;
            };
        };
    };
}
export declare function createAddOnFromConfig(config: AddOnConfig, supabase: SupabaseClient): Promise<string | null>;
export {};
//# sourceMappingURL=addon-config.d.ts.map