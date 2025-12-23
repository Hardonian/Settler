/**
 * Workflow Entanglement Service
 *
 * PHASE 3: Workflow Entanglement
 *
 * Embeds Settler into how work is done:
 * - Settler-generated outputs referenced downstream
 * - Stable identifiers used externally
 * - Repeatable automation hooks
 *
 * Goal: Removing Settler breaks established workflows
 */
export interface WorkflowReference {
    id: string;
    tenantId: string;
    settlerEntityType: string;
    settlerEntityId: string;
    externalSystem: string;
    externalReference: string;
    referenceType: 'report' | 'audit' | 'compliance' | 'finance' | 'api';
    createdAt: Date;
    lastUsed: Date;
    usageCount: number;
}
export interface AutomationHook {
    id: string;
    tenantId: string;
    hookType: 'cron' | 'webhook' | 'api' | 'event';
    trigger: string;
    targetEntityType: string;
    targetEntityId?: string;
    config: Record<string, unknown>;
    isActive: boolean;
    executionCount: number;
    lastExecuted?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowEntanglementMetrics {
    tenantId: string;
    externalReferences: number;
    automationHooks: number;
    downstreamSystems: string[];
    breakingChangeRisk: number;
}
export declare class WorkflowEntanglementService {
    /**
     * Register an external reference to a Settler entity
     */
    registerExternalReference(tenantId: string, settlerEntityType: string, settlerEntityId: string, externalSystem: string, externalReference: string, referenceType: WorkflowReference['referenceType']): Promise<WorkflowReference>;
    /**
     * Generate stable identifier for external use
     */
    generateStableIdentifier(tenantId: string, entityType: string, entityId: string): Promise<string>;
    /**
     * Create automation hook
     */
    createAutomationHook(tenantId: string, hookType: AutomationHook['hookType'], trigger: string, targetEntityType: string, targetEntityId: string | undefined, config: Record<string, unknown>): Promise<AutomationHook>;
    /**
     * Record automation hook execution
     */
    recordHookExecution(hookId: string): Promise<void>;
    /**
     * Get workflow entanglement metrics
     */
    getEntanglementMetrics(tenantId: string): Promise<WorkflowEntanglementMetrics>;
    /**
     * Calculate breaking change risk
     */
    private calculateBreakingChangeRisk;
    /**
     * Hash string (simple implementation)
     */
    private hashString;
}
export declare const workflowEntanglementService: WorkflowEntanglementService;
//# sourceMappingURL=workflow-entanglement.d.ts.map