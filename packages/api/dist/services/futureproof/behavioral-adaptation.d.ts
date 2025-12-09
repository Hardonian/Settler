/**
 * Behavioral Adaptation
 *
 * Agents that continuously adjust system defaults, routing, cost thresholds, etc.
 * Part 13: Long-Range Futureproofing
 */
export interface SystemDefaults {
    routingPreference: 'cost' | 'latency' | 'accuracy' | 'balanced';
    costThreshold: number;
    pipelineTemplateChoice: string;
    reconAccuracyHeuristic: number;
}
export interface AdaptationEvent {
    type: 'default_change' | 'routing_change' | 'cost_threshold_change' | 'template_change' | 'heuristic_change';
    oldValue: unknown;
    newValue: unknown;
    reason: string;
    timestamp: Date;
}
export declare class BehavioralAdaptation {
    private defaults;
    private adaptationHistory;
    constructor();
    /**
     * Get current defaults
     */
    getDefaults(): SystemDefaults;
    /**
     * Adapt routing preference
     */
    adaptRoutingPreference(preference: 'cost' | 'latency' | 'accuracy' | 'balanced', reason: string): void;
    /**
     * Adapt cost threshold
     */
    adaptCostThreshold(threshold: number, reason: string): void;
    /**
     * Adapt pipeline template choice
     */
    adaptPipelineTemplate(template: string, reason: string): void;
    /**
     * Adapt recon accuracy heuristic
     */
    adaptReconAccuracy(heuristic: number, reason: string): void;
    /**
     * Get adaptation history
     */
    getAdaptationHistory(): AdaptationEvent[];
    /**
     * Auto-adapt based on usage patterns
     */
    autoAdapt(usageData: {
        avgCost: number;
        avgLatency: number;
        avgAccuracy: number;
        popularTemplates: string[];
    }): Promise<void>;
}
//# sourceMappingURL=behavioral-adaptation.d.ts.map