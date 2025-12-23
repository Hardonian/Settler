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

import { supabase } from '../infrastructure/supabase/client';
import { logError, logInfo } from '../utils/logger';

export interface WorkflowReference {
  id: string;
  tenantId: string;
  settlerEntityType: string; // 'reconciliation', 'export', 'report', 'audit'
  settlerEntityId: string;
  externalSystem: string; // 'accounting', 'erp', 'compliance', 'finance'
  externalReference: string; // External ID that references Settler output
  referenceType: 'report' | 'audit' | 'compliance' | 'finance' | 'api';
  createdAt: Date;
  lastUsed: Date;
  usageCount: number;
}

export interface AutomationHook {
  id: string;
  tenantId: string;
  hookType: 'cron' | 'webhook' | 'api' | 'event';
  trigger: string; // Cron expression, webhook URL, event name
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
  breakingChangeRisk: number; // 0-1, higher = more risky to remove Settler
}

export class WorkflowEntanglementService {
  /**
   * Register an external reference to a Settler entity
   */
  async registerExternalReference(
    tenantId: string,
    settlerEntityType: string,
    settlerEntityId: string,
    externalSystem: string,
    externalReference: string,
    referenceType: WorkflowReference['referenceType']
  ): Promise<WorkflowReference> {
    try {
      // Check if reference already exists
      const { data: existing } = await supabase
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
        await supabase
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
      const { data: newRef } = await supabase
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
        id: newRef!.id,
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
    } catch (error) {
      logError('Error registering external reference', error);
      throw error;
    }
  }

  /**
   * Generate stable identifier for external use
   */
  async generateStableIdentifier(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<string> {
    // Stable identifier format: SETTLER-{tenantId}-{entityType}-{hash}
    // This ensures external systems can reference Settler entities reliably
    const hash = await this.hashString(`${tenantId}:${entityType}:${entityId}`);
    return `SETTLER-${tenantId.substring(0, 8)}-${entityType.toUpperCase()}-${hash.substring(0, 12)}`;
  }

  /**
   * Create automation hook
   */
  async createAutomationHook(
    tenantId: string,
    hookType: AutomationHook['hookType'],
    trigger: string,
    targetEntityType: string,
    targetEntityId: string | undefined,
    config: Record<string, unknown>
  ): Promise<AutomationHook> {
    try {
      const { data: hook } = await supabase
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
        id: hook!.id,
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
    } catch (error) {
      logError('Error creating automation hook', error);
      throw error;
    }
  }

  /**
   * Record automation hook execution
   */
  async recordHookExecution(hookId: string): Promise<void> {
    try {
      const { data: hook } = await supabase
        .from('usage_events')
        .select('*')
        .eq('id', hookId)
        .single();

      if (hook) {
        await supabase
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
    } catch (error) {
      logError('Error recording hook execution', error);
    }
  }

  /**
   * Get workflow entanglement metrics
   */
  async getEntanglementMetrics(tenantId: string): Promise<WorkflowEntanglementMetrics> {
    try {
      // Get external references
      const { data: references } = await supabase
        .from('usage_events')
        .select('metadata')
        .eq('tenant_id', tenantId)
        .like('event_type', 'workflow_ref:%');

      const externalSystems = new Set<string>();
      references?.forEach((ref) => {
        const system = ref.metadata?.external_system as string;
        if (system) {
          externalSystems.add(system);
        }
      });

      // Get automation hooks
      const { count: automationHooks } = await supabase
        .from('usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .like('event_type', 'automation_hook:%')
        .eq('metadata->>is_active', true);

      // Calculate breaking change risk
      const breakingChangeRisk = this.calculateBreakingChangeRisk(
        references?.length || 0,
        automationHooks || 0,
        externalSystems.size
      );

      return {
        tenantId,
        externalReferences: references?.length || 0,
        automationHooks: automationHooks || 0,
        downstreamSystems: Array.from(externalSystems),
        breakingChangeRisk,
      };
    } catch (error) {
      logError('Error getting entanglement metrics', error);
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
  private calculateBreakingChangeRisk(
    references: number,
    hooks: number,
    downstreamSystems: number
  ): number {
    // More references, hooks, and downstream systems = higher risk
    const referenceScore = Math.min(references / 100, 1);
    const hookScore = Math.min(hooks / 50, 1);
    const systemScore = Math.min(downstreamSystems / 10, 1);

    return (referenceScore * 0.4 + hookScore * 0.4 + systemScore * 0.2);
  }

  /**
   * Hash string (simple implementation)
   */
  private async hashString(str: string): Promise<string> {
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

export const workflowEntanglementService = new WorkflowEntanglementService();
