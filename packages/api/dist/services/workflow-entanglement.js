"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowEntanglementService = exports.WorkflowEntanglementService = void 0;
const client_1 = require("../infrastructure/supabase/client");
const logger_1 = require("../utils/logger");
class WorkflowEntanglementService {
    /**
     * Register an external reference to a Settler entity
     */
    async registerExternalReference(tenantId, settlerEntityType, settlerEntityId, externalSystem, externalReference, referenceType) {
        try {
            // Check if reference already exists
            const { data: existing } = await client_1.supabase
                .from('usage_events')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('event_type', `workflow_ref:${settlerEntityType}`)
                .eq('metadata->>settler_entity_id', settlerEntityId)
                .eq('metadata->>external_system', externalSystem)
                .eq('metadata->>external_reference', externalReference)
                .limit(1)
                .single();
            if (existing) {
                // Update existing reference
                await client_1.supabase
                    .from('usage_events')
                    .update({
                    metadata: {
                        ...existing.metadata,
                        lastUsed: new Date().toISOString(),
                        usageCount: (existing.metadata?.usageCount || 0) + 1,
                    },
                    updated_at: new Date().toISOString(),
                })
                    .eq('id', existing.id);
                return {
                    id: existing.id,
                    tenantId,
                    settlerEntityType,
                    settlerEntityId,
                    externalSystem,
                    externalReference,
                    referenceType,
                    createdAt: new Date(existing.created_at),
                    lastUsed: new Date(),
                    usageCount: (existing.metadata?.usageCount || 0) + 1,
                };
            }
            // Create new reference
            const { data: newRef } = await client_1.supabase
                .from('usage_events')
                .insert({
                tenant_id: tenantId,
                event_type: `workflow_ref:${settlerEntityType}`,
                quantity: 1,
                metadata: {
                    settler_entity_id: settlerEntityId,
                    external_system: externalSystem,
                    external_reference: externalReference,
                    reference_type: referenceType,
                    usageCount: 1,
                    createdAt: new Date().toISOString(),
                    lastUsed: new Date().toISOString(),
                },
            })
                .select()
                .single();
            return {
                id: newRef.id,
                tenantId,
                settlerEntityType,
                settlerEntityId,
                externalSystem,
                externalReference,
                referenceType,
                createdAt: new Date(),
                lastUsed: new Date(),
                usageCount: 1,
            };
        }
        catch (error) {
            (0, logger_1.logError)('Error registering external reference', error);
            throw error;
        }
    }
    /**
     * Generate stable identifier for external use
     */
    async generateStableIdentifier(tenantId, entityType, entityId) {
        // Stable identifier format: SETTLER-{tenantId}-{entityType}-{hash}
        // This ensures external systems can reference Settler entities reliably
        const hash = await this.hashString(`${tenantId}:${entityType}:${entityId}`);
        return `SETTLER-${tenantId.substring(0, 8)}-${entityType.toUpperCase()}-${hash.substring(0, 12)}`;
    }
    /**
     * Create automation hook
     */
    async createAutomationHook(tenantId, hookType, trigger, targetEntityType, targetEntityId, config) {
        try {
            const { data: hook } = await client_1.supabase
                .from('usage_events')
                .insert({
                tenant_id: tenantId,
                event_type: `automation_hook:${hookType}`,
                quantity: 1,
                metadata: {
                    hook_type: hookType,
                    trigger,
                    target_entity_type: targetEntityType,
                    target_entity_id: targetEntityId,
                    config,
                    is_active: true,
                    execution_count: 0,
                    createdAt: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            })
                .select()
                .single();
            return {
                id: hook.id,
                tenantId,
                hookType,
                trigger,
                targetEntityType,
                targetEntityId,
                config,
                isActive: true,
                executionCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
        catch (error) {
            (0, logger_1.logError)('Error creating automation hook', error);
            throw error;
        }
    }
    /**
     * Record automation hook execution
     */
    async recordHookExecution(hookId) {
        try {
            const { data: hook } = await client_1.supabase
                .from('usage_events')
                .select('*')
                .eq('id', hookId)
                .single();
            if (hook) {
                await client_1.supabase
                    .from('usage_events')
                    .update({
                    metadata: {
                        ...hook.metadata,
                        execution_count: (hook.metadata?.execution_count || 0) + 1,
                        last_executed: new Date().toISOString(),
                    },
                    updated_at: new Date().toISOString(),
                })
                    .eq('id', hookId);
            }
        }
        catch (error) {
            (0, logger_1.logError)('Error recording hook execution', error);
        }
    }
    /**
     * Get workflow entanglement metrics
     */
    async getEntanglementMetrics(tenantId) {
        try {
            // Get external references
            const { data: references } = await client_1.supabase
                .from('usage_events')
                .select('metadata')
                .eq('tenant_id', tenantId)
                .like('event_type', 'workflow_ref:%');
            const externalSystems = new Set();
            references?.forEach((ref) => {
                const system = ref.metadata?.external_system;
                if (system) {
                    externalSystems.add(system);
                }
            });
            // Get automation hooks
            const { count: automationHooks } = await client_1.supabase
                .from('usage_events')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .like('event_type', 'automation_hook:%')
                .eq('metadata->>is_active', true);
            // Calculate breaking change risk
            const breakingChangeRisk = this.calculateBreakingChangeRisk(references?.length || 0, automationHooks || 0, externalSystems.size);
            return {
                tenantId,
                externalReferences: references?.length || 0,
                automationHooks: automationHooks || 0,
                downstreamSystems: Array.from(externalSystems),
                breakingChangeRisk,
            };
        }
        catch (error) {
            (0, logger_1.logError)('Error getting entanglement metrics', error);
            return {
                tenantId,
                externalReferences: 0,
                automationHooks: 0,
                downstreamSystems: [],
                breakingChangeRisk: 0,
            };
        }
    }
    /**
     * Calculate breaking change risk
     */
    calculateBreakingChangeRisk(references, hooks, downstreamSystems) {
        // More references, hooks, and downstream systems = higher risk
        const referenceScore = Math.min(references / 100, 1);
        const hookScore = Math.min(hooks / 50, 1);
        const systemScore = Math.min(downstreamSystems / 10, 1);
        return (referenceScore * 0.4 + hookScore * 0.4 + systemScore * 0.2);
    }
    /**
     * Hash string (simple implementation)
     */
    async hashString(str) {
        // Simple hash function (in production, use crypto.subtle)
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }
}
exports.WorkflowEntanglementService = WorkflowEntanglementService;
exports.workflowEntanglementService = new WorkflowEntanglementService();
//# sourceMappingURL=workflow-entanglement.js.map