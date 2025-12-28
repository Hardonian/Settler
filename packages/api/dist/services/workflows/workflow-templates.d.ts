/**
 * Workflow Templates
 *
 * Pre-built templates for common reconciliation workflows.
 * These create workflow lock-in by embedding Settler into operational processes.
 *
 * PHASE: Workflow Lock-In Reinforcement
 */
export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: "ecommerce" | "saas" | "fintech" | "accounting" | "custom";
    sourceAdapter: string;
    targetAdapter: string;
    scheduleCron: string;
    matchingRules: Array<{
        field: string;
        type: "exact" | "fuzzy" | "range";
        config: Record<string, unknown>;
    }>;
    validationRules: Array<{
        type: string;
        config: Record<string, unknown>;
    }>;
    webhookConfig?: {
        url: string;
        events: string[];
    };
    externalReferences: Array<{
        system: string;
        referenceType: "report" | "audit" | "compliance" | "finance";
    }>;
}
/**
 * Workflow Template Service
 */
export declare class WorkflowTemplateService {
    /**
     * Get all available templates
     */
    getTemplates(category?: WorkflowTemplate["category"]): Promise<WorkflowTemplate[]>;
    /**
     * Create reconciliation job from template
     */
    createJobFromTemplate(templateId: string, tenantId: string, userId: string, configOverrides?: Partial<WorkflowTemplate>): Promise<string>;
    /**
     * Get template from database
     */
    private getTemplateFromDB;
}
export declare const workflowTemplateService: WorkflowTemplateService;
//# sourceMappingURL=workflow-templates.d.ts.map