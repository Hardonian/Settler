/**
 * Automation Gravity Service
 *
 * PHASE 4: Irreversible Automation
 *
 * Creates configuration gravity and progressive automation:
 * - Configuration accumulates over time
 * - More automation = less manual effort
 * - Competitor onboarding feels expensive
 *
 * Goal: Onboarding cost is front-loaded, ongoing value compounds
 */
export interface AutomationConfig {
    id: string;
    tenantId: string;
    configType: 'mapping' | 'rule' | 'transformation' | 'validation' | 'schedule';
    configKey: string;
    configValue: Record<string, unknown>;
    usageCount: number;
    lastUsed?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface AutomationGravityMetrics {
    tenantId: string;
    totalConfigs: number;
    activeAutomations: number;
    manualInterventions: number;
    automationEfficiency: number;
    onboardingCost: number;
    timeToValue: number;
}
export declare class AutomationGravityService {
    /**
     * Store configuration (creates gravity)
     */
    storeConfiguration(tenantId: string, configType: AutomationConfig['configType'], configKey: string, configValue: Record<string, unknown>): Promise<AutomationConfig>;
    /**
     * Record configuration usage (increases gravity)
     */
    recordConfigUsage(tenantId: string, configType: AutomationConfig['configType'], configKey: string): Promise<void>;
    /**
     * Record manual intervention (decreases automation efficiency)
     */
    recordManualIntervention(tenantId: string, entityType: string, entityId: string, reason: string): Promise<void>;
    /**
     * Record automation success (increases efficiency)
     */
    recordAutomationSuccess(tenantId: string, automationType: string, entityId: string, timeSaved: number): Promise<void>;
    /**
     * Get automation gravity metrics
     */
    getAutomationGravityMetrics(tenantId: string): Promise<AutomationGravityMetrics>;
    /**
     * Estimate onboarding cost (cost to recreate configs elsewhere)
     */
    private estimateOnboardingCost;
    /**
     * Estimate time to value (days until automation provides value)
     */
    private estimateTimeToValue;
    /**
     * Get progressive automation suggestions
     */
    getProgressiveAutomationSuggestions(tenantId: string): Promise<Array<{
        type: string;
        description: string;
        estimatedTimeSaved: number;
        priority: 'high' | 'medium' | 'low';
    }>>;
}
export declare const automationGravityService: AutomationGravityService;
//# sourceMappingURL=automation-gravity.d.ts.map