/**
 * Governance Layer
 *
 * Version pinning, immutability zones, migration guardrails, audit trails
 * Part 11: Resilience & Zero-Fault Hardening
 */
import { PrismaClient } from '@prisma/client';
export type ResourceType = 'workflow' | 'template' | 'transform' | 'mapping';
export interface GovernanceRule {
    type: 'version_pinning' | 'immutability' | 'migration_guardrail' | 'audit_requirement';
    resourceType: ResourceType;
    resourceId: string;
    rule: Record<string, unknown>;
}
export interface EvolutionEvent {
    type: 'workflow_update' | 'template_change' | 'transform_modification' | 'migration';
    resourceId: string;
    oldVersion: string;
    newVersion: string;
    timestamp: Date;
    actor: string;
    changes: Array<Record<string, unknown>>;
}
export declare class GovernanceLayer {
    private _prisma;
    private rules;
    private evolutionEvents;
    constructor(prisma: PrismaClient);
    /**
     * Pin version
     */
    pinVersion(resourceType: ResourceType, resourceId: string, version: string): Promise<void>;
    /**
     * Create immutability zone
     */
    createImmutabilityZone(resourceType: ResourceType, resourceId: string): Promise<void>;
    /**
     * Add migration guardrail
     */
    addMigrationGuardrail(resourceType: ResourceType, resourceId: string, guardrail: {
        allowBreakingChanges: boolean;
        requireApproval: boolean;
        maxVersionJump: number;
    }): Promise<void>;
    /**
     * Check if change is allowed
     */
    isChangeAllowed(_resourceType: ResourceType, resourceId: string, proposedChange: Record<string, unknown>): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    /**
     * Log evolution event
     */
    logEvolutionEvent(event: EvolutionEvent): Promise<void>;
    /**
     * Get evolution history
     */
    getEvolutionHistory(resourceId: string): EvolutionEvent[];
    /**
     * Add rule
     */
    private addRule;
    /**
     * Get rules
     */
    private getRules;
}
//# sourceMappingURL=governance-layer.d.ts.map