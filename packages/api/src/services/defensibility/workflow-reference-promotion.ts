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

import { logError, logInfo } from '../../utils/logger';
import { workflowEntanglementService } from '../workflow-entanglement';
import { query } from '../../db';

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
  promotionScore: number; // 0-1, higher = more embedded
}

/**
 * Workflow Reference Promotion Service
 * 
 * Actively promotes and tracks external references to create workflow lock-in
 */
export class WorkflowReferencePromotionService {
  /**
   * Promote external reference registration
   * 
   * Actively encourages customers to reference Settler IDs in external systems
   */
  async promoteExternalReference(
    tenantId: string,
    entityType: string,
    entityId: string,
    externalSystem: string,
    externalReference: string,
    referenceType: WorkflowReferencePromotion['referenceType'],
    promotionMethod: WorkflowReferencePromotion['promotionMethod'] = 'manual'
  ): Promise<WorkflowReferencePromotion> {
    try {
      // Generate stable identifier for external use
      const stableId = await workflowEntanglementService.generateStableIdentifier(
        tenantId,
        entityType,
        entityId
      );

      // Register external reference
      await workflowEntanglementService.registerExternalReference(
        tenantId,
        entityType,
        entityId,
        externalSystem,
        externalReference,
        referenceType
      );

      // Record promotion (get billing account ID first)
      const billingAccountResult = await query(
        `SELECT id FROM billing_accounts WHERE tenant_id = $1 LIMIT 1`,
        [tenantId]
      );
      const billingAccountId = billingAccountResult.length > 0 
        ? (billingAccountResult[0] as { id: string }).id 
        : null;

      if (!billingAccountId) {
        throw new Error('Billing account not found for tenant');
      }

      await query(
        `INSERT INTO usage_events (
          tenant_id, billing_account_id, event_type, quantity, metadata, timestamp
        ) VALUES (
          $1, $2, 'workflow_ref_promotion', 1, $3, NOW()
        )`,
        [
          tenantId,
          billingAccountId,
          JSON.stringify({
            entityType,
            entityId,
            externalSystem,
            externalReference,
            referenceType,
            stableId,
            promotionMethod,
            promoted: true,
          }),
        ]
      );

      logInfo('Promoted external reference', {
        tenantId,
        entityType,
        entityId,
        externalSystem,
        stableId,
        promotionMethod,
      });

      return {
        tenantId,
        entityType,
        entityId,
        externalSystem,
        externalReference,
        referenceType,
        promoted: true,
        promotionMethod,
      };
    } catch (error) {
      logError('Failed to promote external reference', error, {
        tenantId,
        entityType,
        entityId,
      });
      throw error;
    }
  }

  /**
   * Suggest external reference opportunities
   * 
   * Analyzes reconciliation runs and suggests where external references could be created
   */
  async suggestExternalReferences(
    tenantId: string,
    reconciliationRunId: string
  ): Promise<Array<{
    entityType: string;
    entityId: string;
    suggestedSystem: string;
    suggestedReferenceType: WorkflowReferencePromotion['referenceType'];
    reason: string;
  }>> {
    try {
      // Get reconciliation run
      const runResult = await query(
        `SELECT 
          id, status, created_at, metadata
        FROM reconciliation_runs
        WHERE id = $1 AND tenant_id = $2`,
        [reconciliationRunId, tenantId]
      );

      if (runResult.length === 0) {
        return [];
      }

      const run = runResult[0] as {
        id: string;
        status: string;
        created_at: Date;
        metadata: string | Record<string, unknown>;
      };

      // Extract adapter info from metadata if available
      const metadata = typeof run.metadata === 'string' ? JSON.parse(run.metadata) : run.metadata;
      const _sourceAdapter = (metadata as { source_adapter?: string })?.source_adapter || 'unknown';
      const targetAdapter = (metadata as { target_adapter?: string })?.target_adapter || 'unknown';

      const suggestions: Array<{
        entityType: string;
        entityId: string;
        suggestedSystem: string;
        suggestedReferenceType: WorkflowReferencePromotion['referenceType'];
        reason: string;
      }> = [];

      // Suggest accounting system reference if QuickBooks/Xero is target
      if (targetAdapter === 'quickbooks' || targetAdapter === 'xero') {
        suggestions.push({
          entityType: 'reconciliation_run',
          entityId: run.id,
          suggestedSystem: 'accounting',
          suggestedReferenceType: 'finance',
          reason: `Reference this reconciliation in ${targetAdapter} for audit trail`,
        });
      }

      // Suggest ERP reference if NetSuite/SAP is target
      if (targetAdapter === 'netsuite' || targetAdapter === 'sap') {
        suggestions.push({
          entityType: 'reconciliation_run',
          entityId: run.id,
          suggestedSystem: 'erp',
          suggestedReferenceType: 'finance',
          reason: `Reference this reconciliation in ${targetAdapter} for financial reporting`,
        });
      }

      // Suggest compliance reference for completed reconciliations
      if (run.status === 'completed') {
        suggestions.push({
          entityType: 'reconciliation_run',
          entityId: run.id,
          suggestedSystem: 'compliance',
          suggestedReferenceType: 'compliance',
          reason: 'Reference this reconciliation for compliance audits',
        });
      }

      logInfo('Generated external reference suggestions', {
        tenantId,
        reconciliationRunId,
        suggestionCount: suggestions.length,
      });

      return suggestions;
    } catch (error) {
      logError('Failed to suggest external references', error, {
        tenantId,
        reconciliationRunId,
      });
      return [];
    }
  }

  /**
   * Get promotion metrics for tenant
   * 
   * Measures how embedded Settler is in tenant's workflows
   */
  async getPromotionMetrics(tenantId: string): Promise<PromotionMetrics> {
    try {
      // Get workflow entanglement metrics
      const entanglementMetrics = await workflowEntanglementService.getEntanglementMetrics(
        tenantId
      );

      // Get promotion events
      const promotionResult = await query(
        `SELECT COUNT(*) as count
        FROM usage_events
        WHERE tenant_id = $1 AND event_type = 'workflow_ref_promotion'`,
        [tenantId]
      );

      const promotionCount = (promotionResult[0] as { count: number }).count || 0;

      // Calculate promotion score (0-1)
      // Higher score = more embedded = harder to switch
      const promotionScore = Math.min(
        1.0,
        (entanglementMetrics.externalReferences * 0.4 +
          entanglementMetrics.automationHooks * 0.3 +
          entanglementMetrics.downstreamSystems.length * 0.2 +
          promotionCount * 0.1) /
          100
      );

      return {
        tenantId,
        totalReferences: entanglementMetrics.externalReferences,
        uniqueSystems: entanglementMetrics.downstreamSystems.length,
        breakingChangeRisk: entanglementMetrics.breakingChangeRisk,
        promotionScore,
      };
    } catch (error) {
      logError('Failed to get promotion metrics', error, { tenantId });
      return {
        tenantId,
        totalReferences: 0,
        uniqueSystems: 0,
        breakingChangeRisk: 0,
        promotionScore: 0,
      };
    }
  }

  /**
   * Auto-promote external references from workflow templates
   * 
   * Automatically creates external references when using workflow templates
   */
  async autoPromoteFromTemplate(
    tenantId: string,
    templateId: string,
    reconciliationJobId: string
  ): Promise<void> {
    try {
      // Get template external references
      const templateResult = await query(
        `SELECT external_references
        FROM recon_templates
        WHERE id = $1`,
        [templateId]
      );

      if (templateResult.length === 0) {
        return;
      }

      const template = templateResult[0] as {
        external_references: Array<{
          system: string;
          referenceType: WorkflowReferencePromotion['referenceType'];
        }>;
      };

      // Promote each external reference
      for (const ref of template.external_references || []) {
        await this.promoteExternalReference(
          tenantId,
          'recon_job',
          reconciliationJobId,
          ref.system,
          `template-${templateId}`,
          ref.referenceType,
          'template'
        );
      }

      logInfo('Auto-promoted external references from template', {
        tenantId,
        templateId,
        reconciliationJobId,
        referenceCount: template.external_references?.length || 0,
      });
    } catch (error) {
      logError('Failed to auto-promote from template', error, {
        tenantId,
        templateId,
        reconciliationJobId,
      });
    }
  }
}

export const workflowReferencePromotionService = new WorkflowReferencePromotionService();
