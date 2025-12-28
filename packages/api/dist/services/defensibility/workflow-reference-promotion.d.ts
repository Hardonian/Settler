/**
 * Workflow Reference Promotion Service
 *
 * Actively tracks and promotes external references to Settler entities.
 * This creates workflow lock-in by embedding Settler into operational processes.
 *
 * PHASE: Workflow Lock-In Reinforcement
 *
 * Based on narrative compression requirements:
 * - Actively encourage customers to reference Settler IDs in external systems
 * - Track external references to measure switching friction
 * - Promote workflow templates that create external references
 * - Generate stable identifiers for external use
 */
export interface WorkflowReferencePromotion {
    tenantId: string;
    entityType: string;
    entityId: string;
    externalSystem: string;
    externalReference: string;
    referenceType: 'report' | 'audit' | 'compliance' | 'finance' | 'api';
    promoted: boolean;
    promotionMethod: 'template' | 'suggestion' | 'automatic' | 'manual';
}
export interface PromotionMetrics {
    tenantId: string;
    totalReferences: number;
    uniqueSystems: number;
    breakingChangeRisk: number;
    promotionScore: number;
}
/**
 * Workflow Reference Promotion Service
 *
 * Actively promotes and tracks external references to create workflow lock-in
 */
export declare class WorkflowReferencePromotionService {
    /**
     * Promote external reference registration
     *
     * Actively encourages customers to reference Settler IDs in external systems
     */
    promoteExternalReference(tenantId: string, entityType: string, entityId: string, externalSystem: string, externalReference: string, referenceType: WorkflowReferencePromotion['referenceType'], promotionMethod?: WorkflowReferencePromotion['promotionMethod']): Promise<WorkflowReferencePromotion>;
    /**
     * Suggest external reference opportunities
     *
     * Analyzes reconciliation runs and suggests where external references could be created
     */
    suggestExternalReferences(tenantId: string, reconciliationRunId: string): Promise<Array<{
        entityType: string;
        entityId: string;
        suggestedSystem: string;
        suggestedReferenceType: WorkflowReferencePromotion['referenceType'];
        reason: string;
    }>>;
    /**
     * Get promotion metrics for tenant
     *
     * Measures how embedded Settler is in tenant's workflows
     */
    getPromotionMetrics(tenantId: string): Promise<PromotionMetrics>;
    /**
     * Auto-promote external references from workflow templates
     *
     * Automatically creates external references when using workflow templates
     */
    autoPromoteFromTemplate(tenantId: string, templateId: string, reconciliationJobId: string): Promise<void>;
}
export declare const workflowReferencePromotionService: WorkflowReferencePromotionService;
//# sourceMappingURL=workflow-reference-promotion.d.ts.map